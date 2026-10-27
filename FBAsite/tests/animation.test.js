import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { compileAnimation } from "../src/animation/compile.js";
import { compileExpression } from "../src/animation/expression.js";
import { easings } from "../src/animation/easing.js";

function fixture(name) { return JSON.parse(readFileSync(new URL(`fixtures/${name}.json`, import.meta.url))); }

test("all 11 actual catalog JSONs produce finite, distinct motion and settle at identity", () => {
    const firstPoses = new Set();
    for (const name of readdirSync(new URL("fixtures/catalog/", import.meta.url))) {
        const data = fixture(`catalog/${name.slice(0, -5)}`), animation = compileAnimation(data);
        firstPoses.add(JSON.stringify(animation.sample(.23)));
        for (let step = 0; step <= 100; step++) {
            const pose = animation.sample(step / 100);
            assert([...pose.position, ...pose.scale, ...pose.rotation, pose.opacity].every(Number.isFinite), name);
        }
        const end = animation.sample(1);
        for (const value of [...end.position, ...end.rotation]) assert(Math.abs(value) < 1e-10, name);
        for (const value of end.scale) assert(Math.abs(value - 1) < 1e-10, name);
        assert.deepEqual(animation.sample(.5), compileAnimation(JSON.parse(JSON.stringify(data))).sample(.5));
    }
    assert.equal(firstPoses.size, 11);
});

test("expressions preserve FBA lerp argument order, power association and aliases", () => {
    assert.equal(compileExpression("lerp(0.25, 2, 6)")({}), 3);
    assert.equal(compileExpression("2 ^ 3 ^ 2")({}), 512);
    assert.equal(compileExpression("-2 ^ 2")({}), 4);
    assert.equal(compileExpression(".5 + 1e-2 * 50")({}), 1);
    const data = { format: 1, transform: { position: { x: "dx+directionX+sx+sideX", y: "e-eased+sy+sideY+distance", z: "sin(PI)" } } };
    const pose = compileAnimation(data).sample(.5, [0, -1, -1]);
    assert.equal(pose.position[0], 2); assert.equal(pose.position[1], 0);
});

test("untrusted expressions cannot execute JavaScript, access properties or exhaust parser nesting", () => {
    for (const expression of ["window.location", "constructor(1)", "fetch(1)", "t;alert(1)", "sin(1,2)", "1 2", "sin()", "", "(".repeat(1000)]) {
        assert.throws(() => compileExpression(expression), expression);
    }
    assert.throws(() => compileExpression("1 / 0")({}));
    assert.throws(() => compileExpression("sqrt(-1)")({}));
});

test("format 3 uses the starting key's easing, degrees and fixed duration", () => {
    const data = fixture("mod/keyframe_pop"); data.timeline = { duration_source: "preset", duration_ms: 700 };
    const animation = compileAnimation(data);
    assert.equal(animation.durationMs, 700);
    assert(Math.abs(animation.sample(.35).scale[0] - (.15 + (1.08 - .15) * .875)) < 1e-6);
    const rotate = compileAnimation({ format: 3, id: "test:rotate", tracks: {
        "transform.rotation.y": { keyframes: [{ t: 0, value: 0 }, { t: 1, value: 360 }] },
    } });
    assert(Math.abs(rotate.sample(.5).rotation[1] - Math.PI) < 1e-6);
    assert(Math.abs(rotate.sample(1).rotation[1] - Math.PI * 2) < 1e-6);
});

test("step tracks hold until the next timestamp, constants and opacity clamp work", () => {
    const animation = compileAnimation({ format: 3, id: "test:step", transform: { position: [0, 2, 0] }, tracks: {
        "transform.position.x": { interpolation: "step", keyframes: [{ t: .2, value: 0 }, { t: .8, value: 3 }] },
        "material.opacity": { keyframes: [{ t: 0, value: 0, easing: "easeOutBack" }, { t: 1, value: 1 }] },
        "transform.scale": [2, 3, 4],
    } });
    assert.deepEqual(animation.sample(.799).position, [0, 2, 0]);
    assert.deepEqual(animation.sample(.8).position, [3, 2, 0]);
    assert.deepEqual(animation.sample(0).scale, [2, 3, 4]);
    assert.equal(animation.sample(.7).opacity, 1);
});

test("all easing curves have correct endpoints and keyframe time ordering is strict", () => {
    for (const [name, ease] of Object.entries(easings)) {
        assert(Math.abs(ease(0)) < 1e-9, name); assert(Math.abs(ease(1) - 1) < 1e-9, name);
    }
    for (const times of [[.7, .2], [.2, .2], [-.1, .5], [0, 1.1], [.5, .500000001]]) {
        assert.throws(() => compileAnimation({ format: 3, id: "test:invalid", tracks: {
            "material.opacity": { keyframes: times.map(t => ({ t, value: 1 })) },
        } }));
    }
});

test("legacy pivots, partial rotation order, v3 endpoints and source data stay intact", () => {
    const legacy = fixture("mod/grow_up"); const before = JSON.stringify(legacy);
    const animation = compileAnimation(legacy);
    assert.deepEqual(animation.pivot, [.5, 0, .5]); assert(animation.legacy);
    animation.sample(.5); assert.equal(JSON.stringify(legacy), before);
    const partial = compileAnimation({ format: 2, rotation_order: "x", transform: { rotation: { x: 1, y: 2 } } });
    assert.deepEqual(partial.sample(.2).rotation, [1, 0, 0]);
    const fade = compileAnimation(fixture("mod/keyframe_fade_in"));
    assert.equal(fade.sample(0).opacity, 0); assert.equal(fade.sample(1).opacity, 1);
    assert.throws(() => compileAnimation({ format: 42, transform: {} }));
    assert.throws(() => compileAnimation({ format: 3, id: "test:bad", tracks: { "transform.scale": [1, 1, 1], "transform.scale.x": 2 } }));
    assert.throws(() => compileAnimation({ format: 3, id: "test:bad", tracks: { "unsupported.track": 0 } }));
});

test("legacy expression opacity, fallback and vertical direction match RC3 semantics", () => {
    const make = opacity => compileAnimation({ format: 2, transform: { position: { x: "sx", z: "sz" } }, material: { opacity } });
    const fade = make("clamp(t*2,0,1)");
    assert.equal(fade.sample(.25, [0, -1, 0]).opacity, .5);
    assert.deepEqual(fade.sample(.25, [0, -1, 0]).position, [1, 0, 0]);
    assert.equal(fade.sample(1).opacity, 1);
    for (const opacity of ["sqrt(-1)", "1/0", "fetch(1)", {}, null]) assert.equal(make(opacity).sample(.5).opacity, 1);
    assert.equal(make("-2").sample(.5).opacity, 0);
    assert.equal(compileExpression("unknown_variable + 1")({}), 1);
});

test("format 3 rejects unsupported layers and invalid defaults instead of silently changing the animation", () => {
    const base = { format: 3, id: "test:strict", tracks: {} };
    for (const extra of [{ material: { layers: [{ id: "glow", kind: "glint" }] } },
        { material: { opacity: 2 } }, { pivot: "bottom" }, { transform: { position: { x: 1 } } },
        { tracks: { "transform.scale.x": 1e39 } }, { timeline: { duration_source: "settings", duration_ms: -1 } }])
        assert.throws(() => compileAnimation({ ...base, ...extra }));
    assert.equal(compileAnimation({ ...base, timeline: { duration_source: "preset", duration_ms: 2147483647 } }).durationMs, 2147483647);
});
