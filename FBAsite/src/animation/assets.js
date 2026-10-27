import { compileAnimation } from "./compile.js";
import { readStored, writeStored } from "./storage.js";

export const JSON_CACHE_KEY = "fba_animation_json_v1";
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const CACHE_CHARS = 750000; // UTF-16 storage budget: ~1.5 MB, separate from card metadata.
const pending = new Map();

export function animationUrl(source) {
    const url = new URL(source, globalThis.location?.href ?? "https://freshblockanimations.com/");
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Animation URL must use HTTP or HTTPS");
    if (url.hostname === "drive.google.com") {
        const id = /^\/file\/d\/([\w-]+)/.exec(url.pathname)?.[1] ?? url.searchParams.get("id");
        if (!id || !/^[\w-]+$/.test(id)) throw new Error("Invalid Google Drive animation link");
        return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`;
    }
    return url.href;
}

export function storeAnimation(source, json, imported = false) {
    const url = animationUrl(source);
    const compiled = compileAnimation(json);
    const cached = readStored(JSON_CACHE_KEY, {});
    const entries = cached && typeof cached === "object" && !Array.isArray(cached) ? cached : {};
    entries[url] = { json, updatedAt: Date.now(), imported };
    const sorted = Object.entries(entries).sort((a, b) => b[1]?.updatedAt - a[1]?.updatedAt).slice(0, 48);
    const result = {}; let size = 2;
    for (const [key, value] of sorted) {
        const length = JSON.stringify([key, value]).length;
        if (size + length > CACHE_CHARS) continue;
        result[key] = value; size += length;
    }
    writeStored(JSON_CACHE_KEY, result);
    return compiled;
}

async function readResponse(response) {
    if (!response.ok) throw new Error(`Could not load animation (${response.status})`);
    if (Number(response.headers.get("Content-Length")) > MAX_FILE_BYTES) throw new Error("Maximum JSON size is 2 MB");
    if (!response.body?.getReader) {
        const text = await response.text();
        if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error("Maximum JSON size is 2 MB");
        return JSON.parse(text);
    }
    const reader = response.body.getReader(), chunks = []; let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_FILE_BYTES) throw new Error("Maximum JSON size is 2 MB");
            chunks.push(value);
        }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; }
    finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); }
    catch { throw new Error("The download link did not return an animation JSON file"); }
}

export async function loadAnimation(source, { refresh = false, localOnly = false, allowImported = true } = {}) {
    const url = animationUrl(source);
    let cached = null;
    if (!refresh) {
        const entry = readStored(JSON_CACHE_KEY, {})?.[url];
        if (entry?.json && (allowImported || !entry.imported)) {
            try { cached = compileAnimation(entry.json); } catch { /* Replace invalid cached data from the actual file. */ }
            if (cached && (entry.imported || Date.now() - entry.updatedAt < 86400000)) return cached;
        }
    }
    if (localOnly) throw new Error("This animation needs a JSON download link or a local JSON file");
    const request = pending.get(url) ?? (async () => {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        return storeAnimation(url, await readResponse(response));
    })();
    pending.set(url, request);
    try { return await request; }
    catch (error) { if (cached && !refresh) return cached; throw error; }
    finally { if (pending.get(url) === request) pending.delete(url); }
}
