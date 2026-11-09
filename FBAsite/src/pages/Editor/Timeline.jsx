import { useRef } from 'react';
import { CHANNELS, channelValue } from '../../animation/editor.js';

export default function Timeline({ document, animation, progress, selection, onSeek, onSelect, onAdd, onMove, zoom, snap }) {
    const drag = useRef(null);
    const duration = document.timeline.duration_ms;
    const ticks = Array.from({ length: 11 }, (_, i) => i / 10);

    function timeAt(event, element) {
        const rect = element.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        return snap ? Math.min(1, Math.round(t * duration / 1000 * 30) / (duration / 1000 * 30)) : t;
    }
    function startDrag(event, channel, key) {
        if (event.button !== 0) return;
        event.stopPropagation();
        const lane = event.currentTarget.closest('.editor-track-lane');
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { channel, t: key.t, lane, group: `drag-${event.pointerId}-${event.timeStamp}` };
        onSelect({ channel, t: key.t }); onSeek(key.t);
    }
    function moveDrag(event) {
        if (!drag.current) return;
        const value = drag.current;
        value.t = onMove(value.channel, value.t, timeAt(event, value.lane), value.group);
    }
    function keyDown(event, channel, key) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault(); event.stopPropagation();
        const delta = (event.shiftKey ? .1 : 1 / 30) * 1000 / duration * (event.key === 'ArrowLeft' ? -1 : 1);
        onMove(channel, key.t, Math.min(1, Math.max(0, key.t + delta)));
    }

    return <div className="editor-timeline-scroll">
        <div className="editor-timeline-inner" style={{ minWidth: `${Math.max(640, 640 * zoom)}px` }}>
            <div className="editor-ruler-label">CHANNEL <span>VALUE</span></div>
            <div className="editor-ruler" onPointerDown={event => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId); onSeek(timeAt(event, event.currentTarget));
            }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) onSeek(timeAt(event, event.currentTarget)); }}
            onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
                {ticks.map(t => <span key={t} style={{ left: `${t * 100}%` }}>{(t * duration / 1000).toFixed(duration < 2000 ? 2 : 1)}s</span>)}
                <i className="editor-ruler-head" style={{ left: `${progress * 100}%` }} />
            </div>
            {CHANNELS.map(channel => <div className={`editor-track-row${selection.channel === channel.id ? ' is-selected' : ''}`} key={channel.id} style={{ '--track-color': channel.color }}>
                <button type="button" className="editor-track-label" onClick={() => onSelect({ channel: channel.id, t: null })}>
                    <i /> <span>{channel.label} <b>{channel.axis}</b></span>
                    <output>{channelValue(animation, channel, progress).toFixed(2)}</output>
                </button>
                <div className="editor-track-lane" onPointerDown={event => { if (event.button === 0) { onSelect({ channel: channel.id, t: null }); onSeek(timeAt(event, event.currentTarget)); } }}
                    onDoubleClick={event => onAdd(channel.id, timeAt(event, event.currentTarget))}>
                    {ticks.map(t => <span className="editor-track-grid" key={t} style={{ left: `${t * 100}%` }} />)}
                    <div className="editor-track-span" style={{ left: `${document.tracks[channel.id].keyframes[0].t * 100}%`, width: `${(document.tracks[channel.id].keyframes.at(-1).t - document.tracks[channel.id].keyframes[0].t) * 100}%` }} />
                    {document.tracks[channel.id].keyframes.map((key, index) => <button type="button" key={index}
                        className={`editor-key${selection.channel === channel.id && selection.t === key.t ? ' is-selected' : ''}`}
                        style={{ left: `${key.t * 100}%` }}
                        aria-label={`${channel.label} ${channel.axis}: ${(key.t * duration).toFixed(0)} ms, ${key.value.toFixed(2)}`}
                        title={`${(key.t * duration).toFixed(0)} ms · ${key.value.toFixed(3)} · ${key.easing}`}
                        onPointerDown={event => startDrag(event, channel.id, key)} onPointerMove={moveDrag}
                        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
                        onClick={event => { event.stopPropagation(); onSelect({ channel: channel.id, t: key.t }); onSeek(key.t); }}
                        onDoubleClick={event => event.stopPropagation()}
                        onFocus={() => onSelect({ channel: channel.id, t: key.t })} onKeyDown={event => keyDown(event, channel.id, key)} />)}
                    <i className="editor-playhead" style={{ left: `${progress * 100}%` }} />
                </div>
            </div>)}
        </div>
    </div>;
}
