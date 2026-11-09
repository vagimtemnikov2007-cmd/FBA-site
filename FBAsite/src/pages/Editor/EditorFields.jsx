import { useState } from 'react';

export function NumberField({ label, value, onCommit, min, max, step = .01, suffix }) {
    const [focused, setFocused] = useState(false), [text, setText] = useState('');
    return <label className="editor-field"><span>{label}</span><div className="editor-number-wrap">
        <input type="number" aria-label={label} value={focused ? text : value} min={min} max={max} step={step}
            onFocus={() => { setText(String(value)); setFocused(true); }} onChange={event => setText(event.target.value)}
            onBlur={() => {
                const parsed = Number(text);
                if (text.trim() && Number.isFinite(parsed) && parsed !== value) onCommit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed)));
                setFocused(false);
            }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
        {suffix && <span aria-hidden="true">{suffix}</span>}
    </div></label>;
}

export function CurvePreview({ easing }) {
    const points = Array.from({ length: 61 }, (_, i) => `${8 + i / 60 * 144},${65 - easing(i / 60) * 50}`).join(' ');
    return <svg className="editor-curve" viewBox="0 0 160 78" aria-label="Easing curve">
        <path d="M8 15H152M8 40H152M8 65H152M8 15V65M80 15V65M152 15V65" stroke="#dce5dc" strokeWidth=".6" />
        <path d="M8 65 152 15" stroke="#ccd8ca" strokeWidth="1" strokeDasharray="3 4" />
        <polyline points={points} fill="none" stroke="#448862" strokeWidth="2.5" />
        <circle cx="8" cy="65" r="3" fill="#448862" /><circle cx="152" cy="15" r="3" fill="#448862" />
    </svg>;
}
