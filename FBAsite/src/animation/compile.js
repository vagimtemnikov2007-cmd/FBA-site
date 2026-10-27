import { clamp, easings } from "./easing.js";
import { compileExpression } from "./expression.js";

const axes = ["x", "y", "z"];
const vectors = { position: [0, 0, 0], scale: [1, 1, 1], rotation: [0, 0, 0] };
const floatMax = 3.4028234663852886e38;
const pivots = { center: [.5, .5, .5], group_center: [.5, .5, .5], bottom: [.5, 0, .5],
    top: [.5, 1, .5], north: [.5, .5, 0], south: [.5, .5, 1], west: [0, .5, .5], east: [1, .5, .5] };

function number(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Animation values must be finite numbers");
    return value;
}
function vector(value) {
    if (!Array.isArray(value) || value.length !== 3) throw new Error("Animation vector must contain three numbers");
    return value.map(number);
}
function float(value) {
    if (Math.abs(number(value)) > floatMax) throw new Error("Animation values must fit a finite float");
    return Math.fround(value);
}
function floatVector(value) { return vector(value).map(float); }
function pivot(value = "center") {
    if (typeof value === "string" && Object.hasOwn(pivots, value)) return [...pivots[value]];
    if (value && typeof value === "object" && !Array.isArray(value)) return axes.map(axis => number(value[axis]));
    return vector(value);
}
function baseVector(value, fallback, legacy) {
    if (value === undefined) return fallback;
    if (Array.isArray(value)) {
        if (value.length !== 3) throw new Error("Animation vector must have three axes");
        return value;
    }
    if (value && typeof value === "object") return axes.map((axis, i) => value[axis] ?? fallback[i]);
    if (legacy && (typeof value === "number" || typeof value === "string")) return [value, value, value];
    throw new Error("Invalid animation transform");
}

function compileTrack(track, dimensions) {
    const read = dimensions === 3 ? floatVector : float;
    if (typeof track === "number" || Array.isArray(track)) {
        const constant = read(track); return () => constant;
    }
    if (!track || !Array.isArray(track.keyframes) || !track.keyframes.length || track.keyframes.length > 2048) throw new Error("Invalid animation keyframes");
    if (track.clock !== undefined && track.clock !== "motion") throw new Error("This preview supports the motion clock");
    const interpolation = track.interpolation ?? "linear";
    if (!["linear", "step"].includes(interpolation)) throw new Error("Unknown keyframe interpolation");
    let previous = -1;
    const points = track.keyframes.map(key => {
        const rawTime = number(key.t), time = float(rawTime);
        if (rawTime < 0 || rawTime > 1 || time <= previous) throw new Error("Keyframe times must increase from 0 to 1");
        previous = time;
        const easing = key.easing ?? "linear";
        if (!Object.hasOwn(easings, easing)) throw new Error(`Unknown easing: ${easing}`);
        return { time, value: read(key.value), easing: easings[easing] };
    });
    return t => {
        if (t <= points[0].time) return points[0].value;
        let low = 0, high = points.length - 1;
        while (low < high) {
            const middle = Math.ceil((low + high) / 2);
            if (points[middle].time <= t) low = middle; else high = middle - 1;
        }
        const a = points[low], b = points[low + 1];
        if (!b || interpolation === "step") return a.value;
        const q = a.easing((t - a.time) / (b.time - a.time));
        const mix = (a, b) => Math.fround(Math.max(-floatMax, Math.min(floatMax, a * (1 - q) + b * q)));
        return dimensions === 3 ? a.value.map((v, i) => mix(v, b.value[i])) : mix(a.value, b.value);
    };
}

export function compileAnimation(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Select an FBA animation JSON file");
    const format = data.format ?? (data.transform ? 1 : undefined);
    if (![1, 2, 3].includes(format)) throw new Error(`Unsupported animation format: ${String(format)}`);
    const legacy = format !== 3;
    if (legacy && (!data.transform || typeof data.transform !== "object")) throw new Error("Animation has no transform");
    if (!legacy && (typeof data.id !== "string" || !data.id.trim() || !data.tracks || typeof data.tracks !== "object" || Array.isArray(data.tracks))) throw new Error("Format 3 requires an id and tracks");
    const order = legacy ? data.rotation_order ?? "xyz" : data.rotation?.order ?? "xyz";
    if (typeof order !== "string" || !/^[xyz]{1,3}$/.test(order) || new Set(order).size !== order.length || !legacy && order.length !== 3) throw new Error("Invalid animation rotation order");
    const unit = legacy ? "radians" : data.rotation?.unit ?? "degrees";
    if (!["degrees", "radians"].includes(unit)) throw new Error("Invalid rotation unit");
    const durationSource = legacy ? "settings" : data.timeline?.duration_source ?? "settings";
    if (!["settings", "preset"].includes(durationSource)) throw new Error("Unknown animation duration source");
    const durationValue = !legacy && data.timeline?.duration_ms !== undefined ? number(data.timeline.duration_ms) : null;
    if (durationValue !== null && (!Number.isInteger(durationValue) || durationValue < 1 || durationValue > 2147483647)) throw new Error("Invalid preset duration");
    if (durationSource === "preset" && durationValue === null) throw new Error("A preset duration is required");
    const durationMs = durationSource === "preset" ? durationValue : null;
    if (!legacy && data.pivot !== undefined && data.pivot !== "group_center" && !Array.isArray(data.pivot)) throw new Error("Format 3 pivot requires group_center or three numbers");
    const origin = pivot(data.pivot ?? (legacy ? "center" : "group_center")).map(float);
    const compiled = Object.fromEntries(Object.entries(vectors).map(([key, fallback]) => {
        const values = legacy ? baseVector(data.transform?.[key], fallback, true) : floatVector(data.transform?.[key] ?? fallback);
        return [key, legacy ? values.map(compileExpression) : values];
    }));
    const tracks = [];
    if (!legacy) {
        if ((data.requires ?? []).some(feature => !["keyframes", "alpha_channels"].includes(feature))) throw new Error("This preview does not support this animation's extra material layers");
        if (data.secondary_animation || data.material?.layers?.length || data.material?.overlays?.length) throw new Error("Secondary animations and material layers are not supported in this preview yet");
        for (const [target, value] of Object.entries(data.tracks)) {
            if (target === "material.opacity") { tracks.push({ channel: "opacity", sample: compileTrack(value, 1) }); continue; }
            const match = /^transform\.(position|scale|rotation)(?:\.([xyz]))?$/.exec(target);
            if (!match) throw new Error(`Unsupported animation track: ${target}`);
            const [, channel, axis] = match;
            if (axis && Object.hasOwn(data.tracks, `transform.${channel}`)) throw new Error("A vector track cannot overlap its component tracks");
            tracks.push({ channel, axis: axis ? axes.indexOf(axis) : null, sample: compileTrack(value, axis ? 1 : 3) });
        }
    }
    let alpha = () => 1;
    if (legacy) {
        // RC3 logs invalid legacy opacity and falls back to opaque, including non-finite results.
        try { if (data.material?.opacity !== undefined) alpha = compileExpression(data.material.opacity); }
        catch { /* Keep the runtime's opaque fallback. */ }
    } else if (data.material?.opacity !== undefined) {
        const value = float(data.material.opacity);
        if (value < 0 || value > 1) throw new Error("Material opacity must be in [0, 1]");
        alpha = () => value;
    }
    return {
        format, legacy, id: data.id, name: data.name, pivot: origin, rotationOrder: (order + axes.filter(axis => !order.includes(axis)).join("")).toUpperCase(), durationMs,
        sample(progress, direction = [-.65, -.25, -.717635]) {
            const t = Math.fround(clamp(number(progress)));
            const eased = Math.fround(1 - Math.fround(Math.fround(1 - t) ** 5));
            const [dx, dy, dz] = direction;
            const horizontal = Math.hypot(dx, dz), sx = horizontal < 1e-4 ? 1 : -dz / horizontal, sz = horizontal < 1e-4 ? 0 : dx / horizontal;
            const context = { t, eased, e: eased, directionX: dx, directionY: dy, directionZ: dz, dx, dy, dz,
                sideX: sx, sideY: 0, sideZ: sz, sx, sy: 0, sz, distance: 0 };
            const pose = { opacity: 1 };
            try { pose.opacity = Math.fround(clamp(alpha(context))); } catch { /* Legacy runtime fallback. */ }
            for (const key of Object.keys(vectors)) pose[key] = legacy ? compiled[key].map(fn => Math.fround(fn(context))) : [...compiled[key]];
            for (const track of tracks) {
                const value = track.sample(t);
                if (track.channel === "opacity") pose.opacity = value;
                else if (track.axis === null) pose[track.channel] = [...value];
                else pose[track.channel][track.axis] = value;
            }
            pose.rotation = pose.rotation.map((value, i) => legacy && !order.includes(axes[i]) ? 0 : Math.fround(value * (unit === "degrees" ? Math.fround(Math.PI / 180) : 1)));
            pose.opacity = clamp(pose.opacity);
            if ([...pose.position, ...pose.rotation, ...pose.scale].some(value => !Number.isFinite(value) || Math.abs(value) > 100000)) throw new Error("Animation transform is outside the preview range");
            return pose;
        },
    };
}
