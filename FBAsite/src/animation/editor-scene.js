import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

/** Editor-only scene additions; gallery previews never load these controls. */
export function attachEditorScene(entry, options, invalidate) {
    const controls = new TransformControls(entry.camera, entry.canvas);
    controls.setSize(.85);
    controls.attach(entry.transform);
    const helper = controls.getHelper();
    const grid = new THREE.GridHelper(40, 40, 0x62646a, 0x494b50);
    grid.material.transparent = true; grid.material.opacity = .55;
    const lines = new THREE.Group();
    for (const [points, color] of [
        [[-20, 0, 0, 20, 0, 0], 0x9d4b4d], [[0, 0, -20, 0, 0, 20], 0x4e688f],
    ]) {
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        lines.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .65 })));
    }
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(entry.block.geometry), new THREE.LineBasicMaterial({ color: 0xf1a947 }));
    entry.block.add(outline);
    entry.scene.add(grid, lines, helper);
    entry.scene.background = new THREE.Color(0x36383c);

    let lastRotation = [0, 0, 0];
    const changed = () => { entry.dirty = true; invalidate(); };
    const dragging = event => {
        if (event.value) {
            lastRotation = [entry.transform.rotation.x, entry.transform.rotation.y, entry.transform.rotation.z].map(value => value * 180 / Math.PI);
            options.onStart?.(controls.mode);
        }
        else options.onEnd?.();
        changed();
    };
    const objectChanged = () => {
        const { position, rotation, scale } = entry.transform;
        const pivot = entry.animation.pivot;
        // Keep rotation continuous through ±180°, including imported multi-turn keys.
        const angles = [rotation.x, rotation.y, rotation.z].map((value, axis) => {
            const degrees = value * 180 / Math.PI;
            return controls.mode === 'rotate' ? degrees + 360 * Math.round((lastRotation[axis] - degrees) / 360) : degrees;
        });
        if (controls.mode === 'rotate') lastRotation = angles;
        options.onChange?.({
            position: [position.x - pivot[0] + .5, position.y - pivot[1], position.z - pivot[2] + .5],
            rotation: angles,
            scale: scale.toArray(),
        }, controls.mode);
        changed();
    };
    controls.addEventListener('change', changed);
    controls.addEventListener('dragging-changed', dragging);
    controls.addEventListener('objectChange', objectChanged);
    const cancel = () => { if (controls.dragging) controls.pointerUp({ button: 0 }); };
    entry.canvas.addEventListener('pointercancel', cancel);

    return {
        controls,
        configure({ tool = 'translate', space = 'world', snap = false, axis = null, enabled = true }) {
            controls.enabled = enabled && tool !== 'select';
            if (controls.enabled) controls.attach(entry.transform);
            else { cancel(); controls.detach(); }
            controls.setMode(tool === 'select' ? 'translate' : tool);
            controls.setSpace(tool === 'scale' ? 'local' : space);
            controls.showX = !axis || axis === 'X'; controls.showY = !axis || axis === 'Y'; controls.showZ = !axis || axis === 'Z';
            controls.setTranslationSnap(snap ? .1 : null);
            controls.setRotationSnap(snap ? Math.PI / 12 : null);
            controls.setScaleSnap(snap ? .1 : null);
            changed();
        },
        dispose() {
            controls.removeEventListener('change', changed);
            controls.removeEventListener('dragging-changed', dragging);
            controls.removeEventListener('objectChange', objectChanged);
            entry.canvas.removeEventListener('pointercancel', cancel);
            controls.dispose();
            entry.scene.remove(grid, lines, helper); entry.block.remove(outline);
            for (const object of [grid, outline, ...lines.children]) { object.geometry.dispose(); object.material.dispose(); }
            entry.scene.background = null;
        },
    };
}
