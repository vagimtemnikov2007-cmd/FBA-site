/** Browser storage is optional: privacy settings/quota must not break playback. */
export function readStored(key, fallback = null) {
    try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
    catch { return fallback; }
}

export function writeStored(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
}

export const CATALOG_KEY = "fba_animations";
export function readCatalog() {
    const cached = readStored(CATALOG_KEY);
    return cached?.version === 1 && Array.isArray(cached.data) ? cached.data : [];
}
export function storeCatalog(data) {
    return writeStored(CATALOG_KEY, { version: 1, updatedAt: Date.now(), data });
}
