import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header.jsx';
import ModalWindow from '../../components/ModalWindow/ModalWindow.jsx';
import { compileAnimation } from '../../animation/compile.js';
import { easings } from '../../animation/easing.js';
import { loadAnimationDocument, MAX_FILE_BYTES } from '../../animation/assets.js';
import { readStored, writeStored } from '../../animation/storage.js';
import { CHANNELS, PRESETS, DRAFT_KEY, addKey, createDocument, deleteKey, editKey, historyReducer, importDocument, setTransformKeys, validateDocument } from '../../animation/editor.js';
import EditorPreview from './EditorPreview.jsx';
import Timeline from './Timeline.jsx';
import { CurvePreview, NumberField } from './EditorFields.jsx';
import ToolIcon from './ToolIcon.jsx';
import './Editor.css';

function initialHistory() {
    let document;
    try {
        const draft = readStored(DRAFT_KEY);
        if (draft?.version === 1) document = importDocument(draft.document).document;
    } catch { /* A corrupt or incompatible draft should not prevent opening the editor. */ }
    return { past: [], present: document ?? createDocument('pop'), future: [], group: null };
}

const conversionNote = 'Expressions were converted to 121 keyframes per track. Motion between keyframes is approximate; direction is fixed to match the gallery preview.';
const fileName = document => `${document.id.split(':').at(-1).replace(/[^a-zA-Z0-9_-]/g, '_') || 'animation'}.json`;

export default function Editor() {
    const [searchParams, setSearchParams] = useSearchParams(), source = searchParams.get('source');
    const [history, dispatch] = useReducer(historyReducer, undefined, initialHistory);
    const document = history.present;
    const animation = useMemo(() => compileAnimation(document), [document]);
    const [selection, setSelection] = useState({ channel: 'transform.scale.x', t: null });
    const [progress, setProgress] = useState(.7), [playing, setPlaying] = useState(false);
    const [loop, setLoop] = useState(true), [speed, setSpeed] = useState(1), [snap, setSnap] = useState(false);
    const [zoom, setZoom] = useState(1), [block, setBlock] = useState('grass');
    const [tool, setTool] = useState('translate'), [space, setSpace] = useState('world');
    const [transformSnap, setTransformSnap] = useState(false), [axis, setAxis] = useState(null);
    const [timelineHeight, setTimelineHeight] = useState(265);
    const [saveStatus, setSaveStatus] = useState('saving');
    const [notice, setNotice] = useState(''), [error, setError] = useState('');
    const [loadingFile, setLoadingFile] = useState(false), [resolvedSource, setResolvedSource] = useState(null);
    const [submissionOpen, setSubmissionOpen] = useState(false);
    const loading = loadingFile || Boolean(source && source !== resolvedSource);
    const input = useRef(null), progressRef = useRef(progress), draftRef = useRef(document);
    const gesture = useRef(null), gestureSequence = useRef(0), panelResize = useRef(null);
    const duration = document.timeline.duration_ms;
    const channel = CHANNELS.find(item => item.id === selection.channel);
    const activeTrack = document.tracks[selection.channel];
    const selectedKey = activeTrack.keyframes.find(key => key.t === selection.t);
    const totalKeys = Object.values(document.tracks).reduce((sum, track) => sum + track.keyframes.length, 0);
    const currentPose = animation.sample(progress);

    useEffect(() => { progressRef.current = progress; }, [progress]);
    useEffect(() => { draftRef.current = document; }, [document]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSaveStatus(writeStored(DRAFT_KEY, { version: 1, document, updatedAt: Date.now() }) ? 'saved' : 'unavailable');
        }, 450);
        return () => clearTimeout(timer);
    }, [document]);

    useEffect(() => {
        // Persist the latest edit even if navigation happens before the debounce fires.
        const flush = () => { writeStored(DRAFT_KEY, { version: 1, document: draftRef.current, updatedAt: Date.now() }); };
        window.addEventListener('pagehide', flush);
        return () => { window.removeEventListener('pagehide', flush); flush(); };
    }, []);

    useEffect(() => {
        if (!source) return;
        let cancelled = false;
        loadAnimationDocument(source, { allowImported: false }).then(data => {
            if (cancelled) return;
            const result = importDocument(data);
            dispatch({ type: 'edit', document: result.document });
            setSelection({ channel: 'transform.position.x', t: null }); setProgress(.7); setSaveStatus('saving');
            setNotice(result.converted ? conversionNote : 'Gallery animation opened. Changes are saved to your draft.');
            setResolvedSource(source);
            setSearchParams(params => { params.delete('source'); return params; }, { replace: true });
        }).catch(failure => { if (!cancelled) setError(`Could not open animation: ${failure.message}`); })
            .finally(() => { if (!cancelled) setResolvedSource(source); });
        return () => { cancelled = true; };
    }, [source, setSearchParams]);

    useEffect(() => {
        if (!playing) return;
        let frame, last = performance.now(), current = progressRef.current >= 1 ? 0 : progressRef.current;
        function tick(now) {
            current += Math.max(0, now - last) * speed / duration;
            last = now;
            if (current >= 1) {
                if (loop) current %= 1;
                else { setProgress(1); setPlaying(false); return; }
            }
            setProgress(current);
            frame = requestAnimationFrame(tick);
        }
        const visibility = () => { if (globalThis.document.hidden) setPlaying(false); };
        globalThis.document.addEventListener('visibilitychange', visibility);
        frame = requestAnimationFrame(tick);
        return () => { cancelAnimationFrame(frame); globalThis.document.removeEventListener('visibilitychange', visibility); };
    }, [playing, duration, loop, speed]);

    useEffect(() => {
        function keyboard(event) {
            if (loading || submissionOpen || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
            if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
                event.preventDefault();
                const type = event.key.toLowerCase() === 'y' || event.shiftKey ? 'redo' : 'undo';
                if (type === 'undo' ? history.past.length : history.future.length) {
                    setPlaying(false); setSaveStatus('saving'); dispatch({ type });
                }
            } else if (event.code === 'Space' && !event.target.closest('button, a')) {
                event.preventDefault(); setPlaying(value => !value);
            } else if (['Delete', 'Backspace'].includes(event.key) && selectedKey && activeTrack.keyframes.length > 1 && (!event.target.closest('button, a') || event.target.classList.contains('editor-key'))) {
                event.preventDefault(); setPlaying(false); setSaveStatus('saving');
                dispatch({ type: 'edit', document: deleteKey(document, selection.channel, selection.t) });
                setSelection({ channel: selection.channel, t: null });
            } else if (!event.ctrlKey && !event.metaKey) {
                const key = event.key.toLowerCase();
                const nextTool = { v: 'select', g: 'translate', r: 'rotate', s: 'scale' }[key];
                if (nextTool) { event.preventDefault(); setTool(nextTool); setPlaying(false); }
                else if (['x', 'y', 'z'].includes(key)) { event.preventDefault(); setAxis(value => value === key.toUpperCase() ? null : key.toUpperCase()); }
            }
        }
        window.addEventListener('keydown', keyboard);
        return () => window.removeEventListener('keydown', keyboard);
    }, [document, selection, selectedKey, activeTrack, loading, submissionOpen, history.past.length, history.future.length]);

    function edit(next, group) {
        if (next === document) return;
        setPlaying(false); setSaveStatus('saving'); setError('');
        dispatch({ type: 'edit', document: next, group });
    }
    function seek(t) { setPlaying(false); setProgress(t); }
    function replaceDocument(next, message) {
        edit(next); setSelection({ channel: 'transform.scale.x', t: null }); setProgress(.7); setNotice(message);
    }
    function insertKey(channelId = selection.channel, t = progress) {
        try {
            const result = addKey(document, channelId, t);
            edit(result.document); setSelection({ channel: channelId, t: result.t }); seek(result.t);
        } catch (failure) { setError(failure.message); }
    }
    function moveKey(channelId, from, t, group) {
        const next = editKey(document, channelId, from, { t });
        if (next === document) return from;
        const newTime = Math.round(t * 100000) / 100000;
        edit(next, group); setSelection({ channel: channelId, t: newTime }); seek(newTime);
        return newTime;
    }
    function changeKey(changes) {
        if (!selectedKey) return;
        edit(editKey(document, selection.channel, selection.t, changes));
    }
    function undo(type) { setPlaying(false); setSaveStatus('saving'); dispatch({ type }); }
    function selectTool(value) { setPlaying(false); setTool(value); }
    function startTransform() {
        setPlaying(false);
        gesture.current = { t: progressRef.current, group: `transform-${++gestureSequence.current}` };
    }
    function transformObject(pose, mode) {
        const active = gesture.current;
        if (!active) return;
        const group = { translate: 'position', rotate: 'rotation', scale: 'scale' }[mode];
        try {
            const next = setTransformKeys(document, group, pose[group], active.t);
            edit(next, active.group); setProgress(active.t);
            const id = `transform.${group}.${axis?.toLowerCase() ?? 'x'}`;
            const key = next.tracks[id].keyframes.find(item => Math.abs(item.t - active.t) < .00002);
            setSelection({ channel: id, t: key.t });
        } catch (failure) { setError(failure.message); }
    }
    function transformAxis(group, component, value) {
        const values = currentPose[group].map(item => group === 'rotation' ? item * 180 / Math.PI : item);
        values[component] = value;
        try {
            const next = setTransformKeys(document, group, values, progress, component);
            edit(next);
            const id = `transform.${group}.${'xyz'[component]}`;
            setSelection({ channel: id, t: next.tracks[id].keyframes.find(key => Math.abs(key.t - progress) < .00002).t });
        } catch (failure) { setError(failure.message); }
    }
    function resetTransform() {
        let next = document;
        for (const group of ['position', 'rotation', 'scale']) next = setTransformKeys(next, group, group === 'scale' ? [1, 1, 1] : [0, 0, 0], progress);
        edit(next);
    }
    function resizeTimeline(event) {
        if (!panelResize.current) return;
        const start = panelResize.current;
        setTimelineHeight(Math.max(180, Math.min(start.max, start.height + start.y - event.clientY)));
    }
    async function importFile(event) {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file) return;
        setPlaying(false); setLoadingFile(true); setError('');
        try {
            if (file.size > MAX_FILE_BYTES) throw new Error('Maximum JSON size is 2 MB.');
            let data;
            try { data = JSON.parse(await file.text()); } catch { throw new Error('The file must contain valid JSON.'); }
            const result = importDocument(data);
            replaceDocument(result.document, result.converted ? conversionNote : 'JSON opened. Tracks are ready to edit.');
        } catch (failure) { setError(`Could not import animation: ${failure.message}`); }
        finally { setLoadingFile(false); }
    }
    function exportJson() {
        try {
            validateDocument(document);
            const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2) + '\n'], { type: 'application/json' }));
            const link = globalThis.document.createElement('a'); link.href = url; link.download = fileName(document);
            link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
            setNotice('JSON exported. Use it in FBA or submit it to the gallery.'); setError('');
        } catch (failure) { setError(`Could not export animation: ${failure.message}`); }
    }

    return <div className="editor-shell">
        <Header />
        <main className="animation-editor" lang="en">
            <div className="editor-heading">
                <div className="editor-heading-title"><ToolIcon name="cube" /><h1>Animation Editor</h1><span className="editor-beta">FBA STUDIO</span></div>
                <div className="editor-save" role="status"><i className={saveStatus} />{saveStatus === 'saved' ? 'Draft saved on this device' : saveStatus === 'saving' ? 'Saving draft…' : 'Storage unavailable — download your JSON'}</div>
            </div>
            <fieldset className="editor-workspace" disabled={loading}>
                <legend className="editor-sr-only">Editor tools</legend>
                <div className="editor-toolbar">
                    <div className="editor-toolbar-group"><span className="editor-file-icon" aria-hidden="true">◇</span>
                        <input className="editor-name" aria-label="Animation name" value={document.name} maxLength={100} onChange={event => edit({ ...document, name: event.target.value })} />
                        <span className="editor-format">.json</span>
                    </div>
                    <div className="editor-toolbar-actions">
                        <button type="button" onClick={() => input.current.click()}>Open JSON</button>
                        <span className="editor-divider" />
                        <button type="button" className="editor-icon-button" aria-label="Undo" title="Undo · Ctrl+Z" disabled={!history.past.length} onClick={() => undo('undo')}>↶</button>
                        <button type="button" className="editor-icon-button" aria-label="Redo" title="Redo · Ctrl+Shift+Z" disabled={!history.future.length} onClick={() => undo('redo')}>↷</button>
                        <input className="editor-sr-only" ref={input} type="file" accept=".json,application/json" aria-label="Import animation file" onChange={importFile} />
                    </div>
                </div>
                {loading && <div className="editor-notice" role="status">Opening animation…</div>}
                {error && <div className="editor-notice is-error" role="alert"><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
                {notice && !error && <div className="editor-notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}

                <div className="editor-desk">
                    <div className="editor-left-column" style={{ '--timeline-height': `${timelineHeight}px` }}>
                        <section className="editor-preview-panel" aria-label="Preview">
                            <div className="editor-preview-top">
                                <div className="editor-scene-mode"><ToolIcon name="cube" /><span>3D Viewport</span><span className="editor-toolbar-separator">/</span><b>Block</b></div>
                                <div className="editor-scene-settings">
                                    <select aria-label="Transform orientation" value={space} onChange={event => setSpace(event.target.value)}><option value="world">World</option><option value="local">Local</option></select>
                                    <button type="button" className="editor-snap-tool" aria-label="Transform snapping" aria-pressed={transformSnap} title="Snap: 0.1 blocks / 15° / 0.1 scale" onClick={() => setTransformSnap(value => !value)}><ToolIcon name="magnet" /></button>
                                    <div className="editor-axis-buttons" aria-label="Axis constraint">{['X', 'Y', 'Z'].map(item => <button type="button" key={item} aria-label={`${item} axis`} aria-pressed={axis === item} onClick={() => setAxis(value => value === item ? null : item)}>{item}</button>)}</div>
                                    <select value={block} onChange={event => setBlock(event.target.value)} aria-label="Preview block"><option value="grass">Grass</option><option value="stone">Stone</option><option value="planks">Planks</option></select>
                                </div>
                            </div>
                            <EditorPreview animation={animation} progress={progress} block={block} tool={tool} onToolChange={selectTool} space={space} transformSnap={transformSnap} axis={axis} disabled={loading || submissionOpen}
                                onTransformStart={startTransform} onTransform={transformObject} onTransformEnd={() => { gesture.current = null; }} />
                        </section>
                        <div className="editor-panel-splitter" role="separator" aria-label="Timeline height" aria-orientation="horizontal" aria-valuenow={Math.round(timelineHeight)} aria-valuemin={180} aria-valuemax={700} tabIndex={0}
                            onPointerDown={event => {
                                if (event.button !== 0) return;
                                event.currentTarget.setPointerCapture(event.pointerId);
                                panelResize.current = { y: event.clientY, height: timelineHeight, max: Math.max(180, event.currentTarget.parentElement.clientHeight - 220) };
                            }} onPointerMove={resizeTimeline} onPointerUp={() => { panelResize.current = null; }} onPointerCancel={() => { panelResize.current = null; }} onLostPointerCapture={() => { panelResize.current = null; }}
                            onKeyDown={event => { if (['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); const max = Math.max(180, event.currentTarget.parentElement.clientHeight - 220); setTimelineHeight(value => Math.min(max, Math.max(180, value + (event.key === 'ArrowUp' ? 20 : -20)))); } }}><i /></div>
                        <section className="editor-timeline" aria-label="Animation timeline">
                            <div className="editor-transport">
                                <div className="editor-timeline-title"><span className="editor-timeline-symbol">≋</span><h2>Timeline</h2><span>{totalKeys} {totalKeys === 1 ? 'keyframe' : 'keyframes'}</span></div>
                                <div className="editor-playback-buttons">
                                    <button type="button" className="editor-icon-button" aria-label="Jump to start" onClick={() => seek(0)}>⏮</button>
                                    <button type="button" className="editor-play-button" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(value => !value)}>{playing ? 'Ⅱ' : '▶'}</button>
                                    <button type="button" className="editor-icon-button" aria-label="Jump to end" onClick={() => seek(1)}>⏭</button>
                                    <button type="button" className={`editor-icon-button${loop ? ' is-on' : ''}`} aria-label="Loop" aria-pressed={loop} onClick={() => setLoop(value => !value)}>↻</button>
                                </div>
                                <output className="editor-time">{(progress * duration / 1000).toFixed(2)} <span>/ {(duration / 1000).toFixed(2)} s</span></output>
                                <select aria-label="Playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}>{[.25, .5, 1, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}</select>
                            </div>
                            <div className="editor-timeline-toolbar">
                                <button type="button" className="editor-add-key" onClick={() => insertKey()}>◇ <span>Add keyframe</span></button>
                                <input className="editor-scrubber" type="range" aria-label="Playback position" min="0" max="1" step="0.00001" value={progress} onChange={event => seek(Number(event.target.value))} />
                                <label className="editor-snap"><input type="checkbox" checked={snap} onChange={event => setSnap(event.target.checked)} /> 30 FPS</label>
                                <select aria-label="Timeline zoom" value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[1, 1.5, 2, 3].map(value => <option key={value} value={value}>{value * 100}%</option>)}</select>
                            </div>
                            <Timeline document={document} animation={animation} progress={progress} selection={selection} onSeek={seek} onSelect={setSelection} onAdd={insertKey} onMove={moveKey} zoom={zoom} snap={snap} />
                            <div className="editor-timeline-footer"><span>Double-click to add a keyframe · Drag a diamond to change its time</span><span>FBA 3 · 30 FPS</span></div>
                        </section>
                    </div>

                    <aside className="editor-right-dock" aria-label="Inspector and export">
                        <div className="editor-dock-tabs"><ToolIcon name="settings" /><h2>Inspector</h2><span>Block</span></div>
                        <section className="editor-dock-section editor-export" aria-label="Export animation">
                            <div className="editor-panel-title"><h2><ToolIcon name="export" /> Export</h2><span>JSON / FBA 3</span></div>
                            <button type="button" className="editor-primary" onClick={exportJson}><ToolIcon name="export" /> Download JSON</button>
                            <button type="button" className="editor-submit" onClick={() => { setPlaying(false); setSubmissionOpen(true); }}>Submit to gallery ↗</button>
                        </section>
                        <section className="editor-dock-section editor-transform" aria-label="Block transforms">
                            <div className="editor-panel-title"><h2><ToolIcon name="translate" /> Transform</h2><span className="editor-auto-key" title="Changes are automatically recorded as keyframes at the current time"><i /> AUTO KEY</span></div>
                            {['position', 'rotation', 'scale'].map((group, index) => <div className="editor-transform-vector" key={group}>
                                <span>{['Position', 'Rotation', 'Scale'][index]}{group === 'rotation' && <small> °</small>}</span>
                                <div>{['X', 'Y', 'Z'].map((item, component) => <div key={item} className={`editor-axis-field axis-${item.toLowerCase()}`}><b aria-hidden="true">{item}</b>
                                    <NumberField label={`${['Position', 'Rotation', 'Scale'][index]} ${item}`} value={Number((currentPose[group][component] * (group === 'rotation' ? 180 / Math.PI : 1)).toFixed(4))} min={-10000} max={10000} step={group === 'rotation' ? 1 : .01} onCommit={value => transformAxis(group, component, value)} />
                                </div>)}</div>
                            </div>)}
                            <button type="button" className="editor-reset-transform" onClick={resetTransform}>↺ Reset transforms</button>
                            <p className="editor-muted">Keyframes are recorded at the current timeline position.</p>
                        </section>
                        <section className="editor-dock-section editor-inspector-key" aria-label="Keyframe properties">
                            <div className="editor-panel-title"><h2><span className="editor-diamond" /> Keyframe</h2><span>{selectedKey ? `${Math.round(selectedKey.t * duration)} ms` : 'None selected'}</span></div>
                            <div className="editor-selected-channel"><i style={{ background: channel.color }} />{channel.label} {channel.axis}</div>
                            {selectedKey ? <>
                                <div className="editor-key-fields"><NumberField label="Keyframe time" value={Number((selectedKey.t * duration).toFixed(3))} min={0} max={duration} step={1} suffix="ms" onCommit={value => moveKey(selection.channel, selectedKey.t, value / duration)} />
                                    <NumberField label="Value" value={Number(selectedKey.value.toFixed(5))} min={channel.group === 'opacity' ? 0 : -10000} max={channel.group === 'opacity' ? 1 : 10000} step={channel.group === 'rotation' ? 1 : .01} suffix={channel.group === 'rotation' ? '°' : undefined} onCommit={value => changeKey({ value })} /></div>
                                <label className="editor-field"><span>Easing to next keyframe</span><select aria-label="Easing to next keyframe" value={selectedKey.easing} onChange={event => changeKey({ easing: event.target.value })}>{Object.keys(easings).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
                                <CurvePreview easing={activeTrack.interpolation === 'step' ? t => t < 1 ? 0 : 1 : easings[selectedKey.easing]} />
                                <button type="button" className="editor-delete" disabled={activeTrack.keyframes.length <= 1} onClick={() => { edit(deleteKey(document, selection.channel, selection.t)); setSelection({ channel: selection.channel, t: null }); }}>Delete keyframe</button>
                            </> : <p className="editor-empty-selection">Select a keyframe on the timeline to edit its time and easing.</p>}
                            <label className="editor-field"><span>Track interpolation</span><select aria-label="Track interpolation" value={activeTrack.interpolation} onChange={event => edit({ ...document, tracks: { ...document.tracks, [selection.channel]: { ...activeTrack, interpolation: event.target.value } } })}><option value="linear">Linear</option><option value="step">Step</option></select></label>
                        </section>
                        <details className="editor-dock-section editor-settings" open>
                            <summary>Animation settings</summary>
                            <NumberField label="Duration" value={duration} min={1} max={2147483647} step={10} suffix="ms" onCommit={value => edit({ ...document, timeline: { duration_source: 'preset', duration_ms: Math.round(value) } })} />
                            <label className="editor-field"><span>Pivot</span><select aria-label="Pivot" value={Array.isArray(document.pivot) ? document.pivot.every((value, index) => value === [.5, 0, .5][index]) ? 'bottom' : 'custom' : 'center'} onChange={event => edit({ ...document, pivot: event.target.value === 'bottom' ? [.5, 0, .5] : event.target.value === 'center' ? 'group_center' : document.pivot })}><option value="center">Block center</option><option value="bottom">Block base</option>{Array.isArray(document.pivot) && <option value="custom">Custom: {document.pivot.join(', ')}</option>}</select></label>
                            <label className="editor-field"><span>Rotation order</span><select value={document.rotation.order} onChange={event => edit({ ...document, rotation: { ...document.rotation, order: event.target.value } })}>{['xyz', 'xzy', 'yxz', 'yzx', 'zxy', 'zyx'].map(order => <option key={order} value={order}>{order.toUpperCase()}</option>)}</select></label>
                            <label className="editor-field"><span>FBA ID</span><input value={document.id} aria-label="Animation ID" maxLength={100} onChange={event => { const value = event.target.value.toLowerCase().replace(/[^a-z0-9_:/.-]/g, ''); if (value.trim()) edit({ ...document, id: value }); }} /></label>
                        </details>
                        <details className="editor-dock-section editor-library" open>
                            <summary>Effect library <span>{PRESETS.length}</span></summary>
                            <div className="editor-presets">{PRESETS.map(preset => <button type="button" className="editor-preset" key={preset.id} onClick={() => replaceDocument(createDocument(preset.id), `Opened preset ${preset.name}. Use Undo to restore the previous animation.`)}>
                                <span className={`editor-preset-symbol ${preset.id}`} aria-hidden="true">{preset.symbol}</span><span><strong>{preset.name}</strong><small>{preset.description}</small></span><span className="editor-preset-arrow">↗</span>
                            </button>)}</div>
                            <button type="button" className="editor-new" onClick={() => replaceDocument(createDocument(), 'New animation ready. Choose a tool or add a keyframe on the timeline.')}>+ Blank animation</button>
                        </details>
                    </aside>
                </div>
            </fieldset>
            <footer className="editor-footer"><span><i /> Block selected <span className="editor-status-divider">|</span> {tool === 'translate' ? 'Move' : tool === 'rotate' ? 'Rotate' : tool === 'scale' ? 'Scale' : 'Select'}</span><span><kbd>G</kbd> move <kbd>R</kbd> rotate <kbd>S</kbd> scale <kbd>V</kbd> orbit <span className="editor-status-divider">|</span> Space — play / pause</span><span>FBA Studio · Draft stored in this browser</span></footer>
        </main>
        {submissionOpen && <ModalWindow modalType="submit" setModalType={() => setSubmissionOpen(false)} initialAnimation={{ name: document.name, file: new File([JSON.stringify(document, null, 2)], fileName(document), { type: 'application/json' }) }} />}
    </div>;
}
