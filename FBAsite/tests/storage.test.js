import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { animationUrl, JSON_CACHE_KEY, loadAnimation, MAX_FILE_BYTES, storeAnimation } from "../src/animation/assets.js";
import { readCatalog, storeCatalog } from "../src/animation/storage.js";
import { normalizeCatalog, API_URL } from "../src/service/config.js";

const data = { format: 1, id: "test:pop", transform: { scale: { x: "t", y: "t", z: "t" } } };
const originalFetch = globalThis.fetch;
let values;
beforeEach(() => {
    values = new Map();
    globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
});
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; });

test("Google Drive share URLs become actual downloadable JSON URLs", () => {
    assert.equal(animationUrl("https://drive.google.com/file/d/abc-123/view?usp=sharing"), "https://drive.usercontent.google.com/download?id=abc-123&export=download");
    assert.equal(animationUrl("https://drive.google.com/open?id=abc"), "https://drive.usercontent.google.com/download?id=abc&export=download");
    assert.throws(() => animationUrl("javascript:alert(1)"));
    assert.throws(() => animationUrl("https://drive.google.com/file/d/"));
});

test("Cloudflare proxy addresses resolve against the API origin and keep revisions", () => {
    const [row] = normalizeCatalog([{ id: "one", name: "Pop", animation_url: "/animations/one/json?v=revision", download_url: "/animations/one/json?download=1" }]);
    assert.equal(row.animation_url, API_URL + "/animations/one/json?v=revision");
    assert.equal(row.download_url, API_URL + "/animations/one/json?download=1");
    assert.throws(() => normalizeCatalog([{ id: "one", name: "Pop", animation_url: "javascript:alert(1)" }]));
});

test("concurrent previews share one request; reload and offline playback use actual cached JSON", async () => {
    let requests = 0;
    globalThis.fetch = async () => { requests++; await new Promise(resolve => setTimeout(resolve, 10)); return new Response(JSON.stringify(data)); };
    const [a, b] = await Promise.all([loadAnimation("https://example.test/a.json"), loadAnimation("https://example.test/a.json")]);
    assert.equal(requests, 1); assert.deepEqual(a.sample(.5), b.sample(.5));
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.deepEqual((await loadAnimation("https://example.test/a.json")).sample(.5), a.sample(.5));
    const cached = JSON.parse(values.get(JSON_CACHE_KEY)); cached["https://example.test/a.json"].updatedAt = 0;
    values.set(JSON_CACHE_KEY, JSON.stringify(cached));
    assert.deepEqual((await loadAnimation("https://example.test/a.json")).sample(.5), a.sample(.5));
    await assert.rejects(loadAnimation("https://example.test/a.json", { refresh: true }), /offline/);
});

test("full or disabled localStorage does not prevent catalog or JSON loading", async () => {
    globalThis.localStorage = { getItem() { throw new Error("disabled"); }, setItem() { throw new Error("quota"); } };
    assert.deepEqual(readCatalog(), []); assert.equal(storeCatalog([{ id: "a" }]), false);
    globalThis.fetch = async () => new Response(JSON.stringify(data));
    assert.equal((await loadAnimation("https://example.test/blocked.json")).sample(.5).scale[0], .5);
});

test("invalid, HTML and oversized downloads fail without poisoning the cache", async () => {
    for (const content of ["<!doctype html>Sign in", JSON.stringify({ format: 999, transform: {} }), " ".repeat(MAX_FILE_BYTES + 1)]) {
        globalThis.fetch = async () => new Response(content);
        await assert.rejects(loadAnimation("https://example.test/invalid.json"));
        assert.equal(values.has(JSON_CACHE_KEY), false);
    }
    globalThis.fetch = async () => new Response("{}", { status: 404 });
    await assert.rejects(loadAnimation("https://example.test/missing.json"), /404/);
});

test("manual JSON overrides persist, stay bounded and survive invalid storage data", async () => {
    values.set(JSON_CACHE_KEY, "null");
    storeAnimation("https://example.test/own.json", data, true);
    globalThis.fetch = async () => { throw new Error("should not fetch"); };
    assert(Math.abs((await loadAnimation("https://example.test/own.json")).sample(.4).scale[0] - .4) < 1e-6);
    for (let i = 0; i < 100; i++) storeAnimation(`https://example.test/${i}.json`, { ...data, editor: { note: "x".repeat(20000) } });
    assert(values.get(JSON_CACHE_KEY).length <= 750000);
    assert(Object.keys(JSON.parse(values.get(JSON_CACHE_KEY))).length <= 48);
    values.set("fba_animations", "{broken"); assert.deepEqual(readCatalog(), []);
    storeCatalog([{ id: "catalog" }]); assert.deepEqual(readCatalog(), [{ id: "catalog" }]);
});

test("gallery hover previews replace overrides imported through the retired settings UI", async () => {
    storeAnimation("https://example.test/catalog.json", { ...data, id: "test:old-override" }, true);
    let requests = 0;
    globalThis.fetch = async () => { requests++; return new Response(JSON.stringify(data)); };
    const original = await loadAnimation("https://example.test/catalog.json", { allowImported: false });
    assert.equal(original.id, data.id); assert.equal(requests, 1);
    await loadAnimation("https://example.test/catalog.json", { allowImported: false });
    assert.equal(requests, 1);
});
