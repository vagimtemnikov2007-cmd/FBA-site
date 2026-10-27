export const API_URL = (import.meta.env?.VITE_API_URL || "https://fba-server.onrender.com").replace(/\/+$/, "");

export function resolveApiUrl(value) {
    if (!value) return value;
    const url = new URL(value, `${API_URL}/`);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid animation URL");
    return url.href;
}

export function normalizeCatalog(data) {
    if (!Array.isArray(data)) throw new Error("Invalid animation catalog");
    return data.map(row => {
        if (!row || typeof row.id !== "string" || typeof row.name !== "string") throw new Error("Invalid animation card");
        return { ...row, animation_url: resolveApiUrl(row.animation_url || row.json_url), download_url: resolveApiUrl(row.download_url) };
    });
}
