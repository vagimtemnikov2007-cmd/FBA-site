import { useEffect, useRef, useState } from 'react';
import ToolIcon from './ToolIcon.jsx';

const tools = [
    { id: 'select', name: 'Select and orbit', key: 'V' },
    { id: 'translate', name: 'Move', key: 'G' },
    { id: 'rotate', name: 'Rotate', key: 'R' },
    { id: 'scale', name: 'Scale', key: 'S' },
];

export default function EditorPreview({ animation, progress, block, tool, onToolChange, space, transformSnap, axis, disabled, onTransformStart, onTransform, onTransformEnd }) {
    const canvas = useRef(null), controller = useRef(null), latest = useRef(null), orbit = useRef(null);
    const [error, setError] = useState(null), [ready, setReady] = useState(false), [attempt, setAttempt] = useState(0);
    const [view, setView] = useState({ yaw: .78, pitch: .52, distance: 5.2 });

    useEffect(() => {
        latest.current = { animation, progress, block, view, tool, space, transformSnap, axis, disabled, onTransformStart, onTransform, onTransformEnd };
    }, [animation, progress, block, view, tool, space, transformSnap, axis, disabled, onTransformStart, onTransform, onTransformEnd]);
    useEffect(() => { controller.current?.setAnimation(animation); }, [animation]);
    useEffect(() => { controller.current?.seek(progress); }, [progress]);
    useEffect(() => { controller.current?.setBlock(block); }, [block]);
    useEffect(() => { controller.current?.setView(view.yaw, view.pitch, view.distance); }, [view]);
    useEffect(() => { controller.current?.configureEditor({ tool, space, snap: transformSnap, axis, enabled: !disabled }); }, [tool, space, transformSnap, axis, disabled]);

    useEffect(() => {
        let cancelled = false, handle;
        (async () => {
            const { getPreviewEngine } = await import('../../animation/engine.js');
            if (cancelled) return;
            handle = getPreviewEngine().add(canvas.current, latest.current.animation, { onError: message => { if (!cancelled) setError(message); } });
            controller.current = handle;
            const value = latest.current;
            handle.seek(value.progress); handle.setBlock(value.block); handle.setView(value.view.yaw, value.view.pitch, value.view.distance);
            await handle.enableEditor({
                onStart: mode => latest.current.onTransformStart(mode),
                onChange: (pose, mode) => latest.current.onTransform(pose, mode),
                onEnd: () => latest.current.onTransformEnd(),
            });
            if (cancelled) return;
            const current = latest.current;
            handle.configureEditor({ tool: current.tool, space: current.space, snap: current.transformSnap, axis: current.axis, enabled: !current.disabled });
            setReady(true); setError(null);
        })().catch(failure => { if (!cancelled) setError(failure.message); });
        return () => { cancelled = true; handle?.dispose(); controller.current = null; };
    }, [attempt]);

    useEffect(() => {
        const element = canvas.current;
        const zoom = event => {
            if (latest.current.disabled) return;
            event.preventDefault();
            setView(value => ({ ...value, distance: Math.max(2, Math.min(12, value.distance * Math.exp(event.deltaY * .001))) }));
        };
        element.addEventListener('wheel', zoom, { passive: false });
        return () => element.removeEventListener('wheel', zoom);
    }, []);

    function pointerDown(event) {
        if (disabled || event.button === 0 && tool !== 'select') return;
        event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
        orbit.current = { x: event.clientX, y: event.clientY, ...view };
    }
    function pointerMove(event) {
        if (!orbit.current) return;
        const start = orbit.current;
        setView({ ...view, yaw: start.yaw - (event.clientX - start.x) * .008, pitch: Math.min(1.4, Math.max(-.5, start.pitch + (event.clientY - start.y) * .008)) });
    }

    return <div className="editor-viewport" data-state={ready ? 'ready' : 'loading'} data-tool={tool}>
        <canvas ref={canvas} aria-label="3D animation preview" onPointerDown={pointerDown} onPointerMove={pointerMove}
            onContextMenu={event => event.preventDefault()} onPointerUp={() => { orbit.current = null; }} onPointerCancel={() => { orbit.current = null; }} onLostPointerCapture={() => { orbit.current = null; }} />
        <div className="editor-scene-tools" role="toolbar" aria-label="Scene tools">{tools.map(item => <button type="button" key={item.id}
            aria-label={item.name} aria-pressed={tool === item.id} title={`${item.name} · ${item.key}`} onClick={() => onToolChange(item.id)}>
            <ToolIcon name={item.id} /><kbd>{item.key}</kbd>
        </button>)}</div>
        <div className="editor-scene-caption"><span>User Perspective</span><span className="editor-object-name">(1) Scene | Block</span></div>
        <div className="editor-view-tools">
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setView({ ...view, distance: Math.max(2, view.distance - .5) })}>+</button>
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setView({ ...view, distance: Math.min(12, view.distance + .5) })}>−</button>
            <button type="button" aria-label="Reset camera" title="Reset camera" onClick={() => setView({ yaw: .78, pitch: .52, distance: 5.2 })}><ToolIcon name="home" /></button>
        </div>
        <span className="editor-view-hint">{tool === 'select' ? 'Drag to orbit the camera' : 'Drag an axis to transform the block'} <span>· Right / middle mouse — orbit · Scroll — zoom</span></span>
        <div className="editor-axes" aria-hidden="true"><span>Y</span><span>Z</span><span>X</span></div>
        {!ready && !error && <div className="editor-preview-message" role="status">Preparing 3D preview…</div>}
        {error && <div className="editor-preview-message" role="alert"><strong>Preview unavailable</strong><span>{error}</span>
            <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
    </div>;
}
