import * as THREE from "three";
import { clamp } from "./easing.js";
import { applyAnimationPose } from "./pose.js";

let shared = null;

function texture(kind) {
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const noise = ((x * 37 + y * 61 + x * y * 13) % 29) - 14;
        let color = kind === "grass" ? [100, 153, 67] : kind === "stone" ? [146, 151, 149] : [139, 103, 65];
        if (kind === "side" && y >= 13 - (x * 7 % 3)) color = [100, 153, 67];
        if (kind === "planks") color = y % 4 === 0 || x % 8 === (Math.floor(y / 4) % 2) * 4 ? [108, 77, 46] : [181, 141, 88];
        const offset = (y * 16 + x) * 4;
        for (let c = 0; c < 3; c++) pixels[offset + c] = clamp(color[c] + noise, 0, 255);
        pixels[offset + 3] = 255;
    }
    const result = new THREE.DataTexture(pixels, 16, 16);
    result.magFilter = THREE.NearestFilter; result.minFilter = THREE.NearestFilter;
    result.colorSpace = THREE.SRGBColorSpace; result.needsUpdate = true;
    return result;
}

class PreviewEngine {
    constructor() {
        this.entries = new Set(); this.raf = null; this.lastFrame = 0; this.lost = false;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(1, 1, false);
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.textures = Object.fromEntries(["grass", "side", "dirt", "stone", "planks"].map(kind => [kind, texture(kind)]));
        this.visibility = () => {
            if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = null; }
            else { for (const entry of this.entries) entry.lastTime = performance.now(); this.schedule(); }
        };
        document.addEventListener("visibilitychange", this.visibility);
        this.observer = new IntersectionObserver(changes => {
            for (const change of changes) {
                const entry = [...this.entries].find(item => item.canvas === change.target);
                if (entry) { entry.visible = change.isIntersecting; entry.dirty = true; entry.lastTime = performance.now(); }
            }
            this.schedule();
        });
        this.resize = new ResizeObserver(changes => {
            for (const entry of this.entries) if (changes.some(change => change.target === entry.canvas)) entry.dirty = true;
            this.schedule();
        });
        this.onLost = event => {
            event.preventDefault(); this.lost = true; cancelAnimationFrame(this.raf); this.raf = null;
            for (const entry of this.entries) entry.onError("The graphics context was interrupted. Waiting for recovery…");
        };
        this.onRestored = () => {
            this.lost = false;
            for (const entry of this.entries) { entry.dirty = true; entry.lastTime = performance.now(); entry.onError(null); }
            this.schedule();
        };
        this.renderer.domElement.addEventListener("webglcontextlost", this.onLost);
        this.renderer.domElement.addEventListener("webglcontextrestored", this.onRestored);
    }

    add(canvas, animation, options = {}) {
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas previews are unavailable in this browser");
        const scene = new THREE.Scene();
        const ambient = new THREE.HemisphereLight(0xffffff, 0x8a9977, 2.4);
        const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(-3, 6, 4);
        scene.add(ambient, light);
        const materials = Array.from({ length: 6 }, () => new THREE.MeshLambertMaterial({ transparent: true }));
        const block = new THREE.Mesh(this.geometry, materials);
        const transform = new THREE.Group(); transform.add(block); scene.add(transform);
        const camera = new THREE.PerspectiveCamera(38, 1, .05, 30);
        const duration = Math.max(.001, (animation.durationMs ?? 1000) / 1000);
        const entry = { canvas, context, scene, block, transform, camera, animation, materials,
            visible: false, dirty: true, paused: true, loop: options.loop ?? true,
            elapsed: duration, duration,
            lastTime: performance.now(), yaw: .78, pitch: .52, distance: 3.8,
            onError: options.onError ?? (() => {}) };
        this.setBlock(entry, "grass");
        this.entries.add(entry); this.observer.observe(canvas); this.resize.observe(canvas); this.schedule();
        return {
            play: () => { entry.elapsed = 0; entry.paused = false; entry.lastTime = performance.now(); entry.dirty = true; this.schedule(); },
            rest: () => { entry.elapsed = entry.duration; entry.paused = true; entry.dirty = true; this.schedule(); },
            dispose: () => this.remove(entry),
        };
    }

    setBlock(entry, name) {
        const maps = name === "grass" ? ["side", "side", "grass", "dirt", "side", "side"] : Array(6).fill(name === "planks" ? "planks" : "stone");
        entry.materials.forEach((material, i) => { material.map = this.textures[maps[i]]; material.needsUpdate = true; });
    }

    schedule() {
        if (this.raf === null && !document.hidden && !this.lost && [...this.entries].some(e => e.visible && (!e.paused || e.dirty))) this.raf = requestAnimationFrame(time => this.render(time));
    }

    render(now) {
        this.raf = null;
        if (document.hidden || this.lost) return;
        if (now - this.lastFrame < 1000 / 30) { this.schedule(); return; }
        this.lastFrame = now;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        for (const entry of this.entries) {
            if (!entry.visible || entry.paused && !entry.dirty) continue;
            try {
                if (!entry.paused) entry.elapsed += Math.max(0, (now - entry.lastTime) / 1000);
                entry.lastTime = now;
                const progress = entry.paused ? 1 : entry.loop ? (entry.elapsed % entry.duration) / entry.duration : Math.min(1, entry.elapsed / entry.duration);
                if (!entry.loop && progress === 1) entry.paused = true;
                const pose = entry.animation.sample(progress);
                applyAnimationPose(entry.animation, pose, entry.transform, entry.block);
                entry.block.visible = pose.opacity > 0;
                for (const material of entry.materials) material.opacity = pose.opacity;
                const { width, height } = entry.canvas.getBoundingClientRect();
                const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
                if (entry.canvas.width !== w || entry.canvas.height !== h) { entry.canvas.width = w; entry.canvas.height = h; }
                if (this.renderer.domElement.width !== w || this.renderer.domElement.height !== h) this.renderer.setSize(w, h, false);
                entry.camera.aspect = w / h; entry.camera.updateProjectionMatrix();
                const horizontal = Math.cos(entry.pitch) * entry.distance;
                entry.camera.position.set(Math.sin(entry.yaw) * horizontal, .8 + Math.sin(entry.pitch) * entry.distance, Math.cos(entry.yaw) * horizontal);
                entry.camera.lookAt(0, .8, 0);
                this.renderer.render(entry.scene, entry.camera);
                entry.context.globalCompositeOperation = "copy";
                entry.context.drawImage(this.renderer.domElement, 0, 0, w, h);
                entry.dirty = false;
            } catch (error) { entry.paused = true; entry.dirty = false; entry.onError(error.message); }
        }
        this.schedule();
    }

    remove(entry) {
        this.observer.unobserve(entry.canvas); this.resize.unobserve(entry.canvas);
        for (const material of entry.materials) material.dispose();
        entry.scene.clear(); this.entries.delete(entry);
        if (!this.entries.size) this.dispose();
    }

    dispose() {
        cancelAnimationFrame(this.raf); this.raf = null;
        document.removeEventListener("visibilitychange", this.visibility);
        this.observer.disconnect(); this.resize.disconnect();
        this.geometry.dispose();
        for (const value of Object.values(this.textures)) value.dispose();
        this.renderer.domElement.removeEventListener("webglcontextlost", this.onLost);
        this.renderer.domElement.removeEventListener("webglcontextrestored", this.onRestored);
        this.renderer.dispose(); this.renderer.forceContextLoss();
        if (shared === this) shared = null;
    }
}

export function getPreviewEngine() {
    if (!shared) shared = new PreviewEngine();
    return shared;
}
