import { compileAnimation } from './compile.js';
import { clamp } from './easing.js';

export const DRAFT_KEY = 'fba_editor_draft_v1';
export const CHANNELS = [
    ...['position', 'rotation', 'scale'].flatMap((group, index) => ['x', 'y', 'z'].map((axis, component) => ({
        id: `transform.${group}.${axis}`, group, component, axis: axis.toUpperCase(),
        label: ['Position', 'Rotation', 'Scale'][index],
        color: ['#438b69', '#a57bca', '#ce9851'][index],
        fallback: group === 'scale' ? 1 : 0,
    }))),
    { id: 'material.opacity', group: 'opacity', label: 'Opacity', axis: 'α', color: '#5f95bd', fallback: 1 },
];

const track = points => ({ interpolation: 'linear', keyframes: points.map(([t, value, easing = 'linear']) => ({ t, value, easing })) });

// The Pop and Fade In keys match the existing FBA keyframe presets.
export const PRESETS = [
    { id: 'pop', name: 'Pop', description: 'Appear with an overshoot', symbol: '↗', tracks: {
        'transform.scale': track([[0, [.15, .15, .15], 'easeOutCubic'], [.7, [1.08, 1.08, 1.08], 'easeInOutCubic'], [1, [1, 1, 1]]]),
        'material.opacity': track([[0, 0, 'easeInOutCubic'], [.25, 1]]),
    } },
    { id: 'fade', name: 'Fade In', description: 'Fade into view', symbol: '◐', tracks: {
        'material.opacity': track([[0, 0, 'easeInOutCubic'], [1, 1]]),
    } },
    { id: 'grow', name: 'Grow', description: 'Grow from the base', symbol: '↑', pivot: [.5, 0, .5], tracks: {
        'transform.scale.y': track([[0, 0, 'easeOutBack'], [1, 1]]),
    } },
    { id: 'spin', name: 'Spin', description: 'One full turn', symbol: '↻', tracks: {
        'transform.rotation.y': track([[0, -360, 'easeOutQuint'], [1, 0]]),
    } },
    { id: 'bounce', name: 'Bounce', description: 'Drop and bounce', symbol: '↟', tracks: {
        'transform.position.y': track([[0, 1.5, 'easeInQuad'], [.45, 0, 'easeOutQuad'], [.65, .35, 'easeInQuad'], [.85, 0, 'easeOutQuad'], [.93, .07, 'easeInQuad'], [1, 0]]),
    } },
];

export function createDocument(presetId) {
    const preset = PRESETS.find(item => item.id === presetId);
    return importDocument({
        format: 3, id: 'fba:my_animation', name: preset ? `My ${preset.name}` : 'My animation',
        timeline: { duration_source: 'preset', duration_ms: 1000 },
        rotation: { unit: 'degrees', order: 'xyz' }, pivot: preset?.pivot ?? 'group_center',
        tracks: preset?.tracks ?? {},
    }).document;
}

function rotatePivot(vector, angles, order) {
    let [x, y, z] = vector;
    for (const axis of [...order.toLowerCase()].reverse()) {
        const a = angles['xyz'.indexOf(axis)], c = Math.cos(a), s = Math.sin(a);
        if (axis === 'x') [y, z] = [y * c - z * s, y * s + z * c];
        if (axis === 'y') [x, z] = [x * c + z * s, -x * s + z * c];
        if (axis === 'z') [x, y] = [x * c - y * s, x * s + y * c];
    }
    return [x, y, z];
}

/** Canonical editor documents use scalar tracks, preserving v3 easing and interpolation. */
export function importDocument(source) {
    const compiled = compileAnimation(source);
    const document = {
        format: 3, id: source.id || 'fba:my_animation', name: source.name || 'My animation',
        timeline: { duration_source: 'preset', duration_ms: compiled.durationMs ?? 1000 },
        pivot: compiled.legacy ? [...compiled.pivot] : source.pivot ?? 'group_center',
        rotation: { unit: 'degrees', order: compiled.rotationOrder.toLowerCase() }, tracks: {},
    };
    if (typeof source.author === 'string') document.author = source.author;
    if (compiled.legacy) {
        // Legacy rotates about the block corner after scale compensation. Adjust the
        // position when baking into v3, which rotates and scales about a shared pivot.
        for (const channel of CHANNELS) document.tracks[channel.id] = track([]);
        for (let i = 0; i <= 120; i++) {
            const t = i / 120, pose = compiled.sample(t);
            const scaledPivot = compiled.pivot.map((v, axis) => v * pose.scale[axis]);
            const rotatedPivot = rotatePivot(scaledPivot, pose.rotation, compiled.rotationOrder);
            pose.position = pose.position.map((v, axis) => v + rotatedPivot[axis] - scaledPivot[axis]);
            for (const channel of CHANNELS) {
                const value = channel.group === 'opacity' ? pose.opacity : pose[channel.group][channel.component];
                document.tracks[channel.id].keyframes.push({ t, value: channel.group === 'rotation' ? value * 180 / Math.PI : value, easing: 'linear' });
            }
        }
    } else {
        for (const channel of CHANNELS) {
            const vectorTrack = source.tracks[`transform.${channel.group}`];
            const input = source.tracks[channel.id] ?? vectorTrack;
            const component = vectorTrack !== undefined && source.tracks[channel.id] === undefined ? channel.component : null;
            const convert = value => {
                const v = component === null ? value : value[component];
                return channel.group === 'rotation' && source.rotation?.unit === 'radians' ? v * 180 / Math.PI : v;
            };
            if (input && typeof input === 'object' && !Array.isArray(input)) {
                document.tracks[channel.id] = {
                    interpolation: input.interpolation ?? 'linear',
                    keyframes: input.keyframes.map(key => ({ t: key.t, value: convert(key.value), easing: key.easing ?? 'linear' })),
                };
            } else {
                const base = channel.group === 'opacity' ? source.material?.opacity ?? 1
                    : source.transform?.[channel.group]?.[channel.component] ?? channel.fallback;
                const value = input === undefined ? (channel.group === 'rotation' && source.rotation?.unit === 'radians' ? base * 180 / Math.PI : base) : convert(input);
                document.tracks[channel.id] = track([[0, value], [1, value]]);
            }
        }
    }
    validateDocument(document);
    return { document, converted: compiled.legacy };
}

export function validateDocument(document) {
    const compiled = compileAnimation(document);
    // Reject unsafe preview ranges before a file replaces the current draft.
    for (let i = 0; i <= 120; i++) compiled.sample(i / 120);
    return compiled;
}

export function channelValue(compiled, channel, t) {
    const pose = compiled.sample(t);
    return channel.group === 'opacity' ? pose.opacity : pose[channel.group][channel.component] * (channel.group === 'rotation' ? 180 / Math.PI : 1);
}

export function editKey(document, channelId, time, changes) {
    const source = document.tracks[channelId];
    const t = changes.t === undefined ? time : Math.round(clamp(changes.t) * 100000) / 100000;
    if (source.keyframes.some(key => key.t !== time && Math.abs(key.t - t) < .00001)) return document;
    const keyframes = source.keyframes.map(key => key.t === time ? { ...key, ...changes, t } : key).sort((a, b) => a.t - b.t);
    return { ...document, tracks: { ...document.tracks, [channelId]: { ...source, keyframes } } };
}

export function addKey(document, channelId, progress) {
    const t = Math.round(clamp(progress) * 100000) / 100000;
    const source = document.tracks[channelId];
    const existing = source.keyframes.find(key => Math.abs(key.t - t) < .00001);
    if (existing) return { document, t: existing.t };
    if (source.keyframes.length >= 2048) throw new Error('A track can contain no more than 2048 keyframes.');
    const channel = CHANNELS.find(item => item.id === channelId);
    const value = channelValue(compileAnimation(document), channel, t);
    return { t, document: { ...document, tracks: { ...document.tracks, [channelId]: {
        ...source, keyframes: [...source.keyframes, { t, value, easing: 'linear' }].sort((a, b) => a.t - b.t),
    } } } };
}

export function deleteKey(document, channelId, t) {
    const source = document.tracks[channelId];
    if (source.keyframes.length <= 1) return document;
    return { ...document, tracks: { ...document.tracks, [channelId]: { ...source, keyframes: source.keyframes.filter(key => key.t !== t) } } };
}

/** Record a viewport/inspector transform as keys at the current playhead. */
export function setTransformKeys(document, group, values, progress, component) {
    if (!['position', 'rotation', 'scale'].includes(group) || !Array.isArray(values) || values.length !== 3 || values.some(value => !Number.isFinite(value) || Math.abs(value) > 10000)) {
        throw new Error('A transform must contain three finite values within ±10000.');
    }
    let next = document;
    for (const axis of component === undefined ? [0, 1, 2] : [component]) {
        const id = `transform.${group}.${'xyz'[axis]}`;
        const result = addKey(next, id, progress);
        next = editKey(result.document, id, result.t, { value: values[axis] });
    }
    return next;
}

export function historyReducer(state, action) {
    if (action.type === 'undo') return state.past.length ? {
        past: state.past.slice(0, -1), present: state.past.at(-1), future: [state.present, ...state.future], group: null,
    } : state;
    if (action.type === 'redo') return state.future.length ? {
        past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1), group: null,
    } : state;
    if (action.document === state.present) return state;
    return {
        past: action.group && action.group === state.group ? state.past : [...state.past, state.present].slice(-60),
        present: action.document, future: [], group: action.group ?? null,
    };
}
