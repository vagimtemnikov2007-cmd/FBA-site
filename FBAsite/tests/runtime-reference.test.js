import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Object3D, Vector3 } from "three";
import { compileAnimation } from "../src/animation/compile.js";
import { compileExpression } from "../src/animation/expression.js";
import { applyAnimationPose } from "../src/animation/pose.js";

const reference = JSON.parse(readFileSync(new URL("fixtures/mod/runtime-reference.json", import.meta.url)));
function close(actual, expected, label, tolerance = 3e-6) {
    assert.equal(actual.length, expected.length, label);
    actual.forEach((value, i) => assert(Math.abs(value - expected[i]) <= tolerance, `${label}[${i}]: ${value} != ${expected[i]}`));
}

test("expression results match the original RC3-Hotfix1 Parser classes", () => {
    assert.equal(reference.sourceJarSha256, "d069bf0660546fdb03ba1c6bcfe8ea5fa49c1c308a5b204fea66d7559a122d80");
    const context = { t: .37, e: .9, eased: .9, dx: -.6, directionX: -.6, dy: -.2, directionY: -.2,
        dz: -.8, directionZ: -.8, sx: .8, sideX: .8, sy: 0, sideY: 0, sz: -.6, sideZ: -.6, distance: 0 };
    for (const { source, expected } of reference.expressions) close([compileExpression(source)(context)], [expected], source, 1e-12);
});

test("34 animations at 10 times match original KeyframeDefinition poses, opacity and JOML corners", () => {
    const transform = new Object3D(), block = new Object3D(); transform.add(block);
    for (const item of reference.animations) {
        const animation = compileAnimation(item.data);
        assert.equal(animation.durationMs ?? 1000, item.durationMs, item.name);
        close(animation.pivot, item.samples[0].pivot, item.name);
        reference.times.forEach((t, index) => {
            const pose = animation.sample(t), expected = item.samples[index], label = `${item.name} @ ${t}`;
            close(pose.position, expected.position, `${label} position`);
            close(pose.scale, expected.scale, `${label} scale`);
            close([pose.opacity], [expected.opacity], `${label} opacity`);
            applyAnimationPose(animation, pose, transform, block);
            close(transform.quaternion.toArray(), expected.quaternion, `${label} quaternion`);
            block.updateWorldMatrix(true, false);
            let corner = 0;
            if (expected.corners) for (let x = 0; x <= 1; x++) for (let y = 0; y <= 1; y++) for (let z = 0; z <= 1; z++) {
                const point = new Vector3(x - .5, y - .5, z - .5).applyMatrix4(block.matrixWorld);
                close([point.x + .5, point.y, point.z + .5], expected.corners[corner++], `${label} corner`);
            }
        });
    }
});

test("legacy rotation uses the corner-based native matrix, including its scale pivot offset", () => {
    const animation = compileAnimation({ format: 2, pivot: "bottom", transform: {
        rotation: { z: Math.PI / 2 }, scale: { x: 2, y: .5, z: 1 }, position: { x: .2 },
    } });
    const transform = new Object3D(), block = new Object3D(); transform.add(block);
    applyAnimationPose(animation, animation.sample(.5), transform, block);
    block.updateWorldMatrix(true, false);
    // Native T = (.2,0,0) + (1-S) * (.5,0,.5) = (-.3,0,0).
    const origin = new Vector3(-.5, -.5, -.5).applyMatrix4(block.matrixWorld);
    close([origin.x + .5, origin.y, origin.z + .5], [-.3, 0, 0], "native legacy origin");
    const corner = new Vector3(.5, .5, .5).applyMatrix4(block.matrixWorld);
    close([corner.x + .5, corner.y, corner.z + .5], [-.8, 2, 1], "native legacy rotated corner");
});
