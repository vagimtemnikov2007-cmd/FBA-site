export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const easeIn = {
    Quad: t => t * t,
    Cubic: t => t ** 3,
    Quart: t => t ** 4,
    Quint: t => t ** 5,
    Sine: t => 1 - Math.cos(t * Math.PI / 2),
    Expo: t => t === 0 ? 0 : 2 ** (10 * t - 10),
    Circ: t => 1 - Math.sqrt(Math.max(0, 1 - t * t)),
    Back: t => 2.70158 * t ** 3 - 1.70158 * t * t,
};

export const easings = { linear: t => t };
for (const [name, incoming] of Object.entries(easeIn)) {
    easings[`easeIn${name}`] = incoming;
    easings[`easeOut${name}`] = t => 1 - incoming(1 - t);
    easings[`easeInOut${name}`] = t => t < .5 ? incoming(t * 2) / 2 : 1 - incoming(2 - t * 2) / 2;
}
// Penner's InOutBack uses a different overshoot constant from In/OutBack.
easings.easeInOutBack = t => {
    const c = 1.70158 * 1.525;
    return t < .5 ? (2 * t) ** 2 * ((c + 1) * 2 * t - c) / 2
        : ((2 * t - 2) ** 2 * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
};
