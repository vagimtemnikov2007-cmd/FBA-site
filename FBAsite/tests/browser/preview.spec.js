import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";

const directory = new URL("../fixtures/catalog/", import.meta.url);
const fixtures = readdirSync(directory).map(file => JSON.parse(readFileSync(new URL(file, directory))));
const catalog = fixtures.map((json, i) => ({ id: `card-${i}`, name: json.name, author: "FBA", created_at: "2026-09-15T19:00:00Z",
    animation_url: `https://fba-server.onrender.com/animations/fixture-${i}/json?v=one`,
    download_url: `https://fba-server.onrender.com/animations/fixture-${i}/json?download=1`, preview_url: "https://example.invalid/old.webm" }));

async function setup(page, rows = catalog, definition) {
    const requests = { json: 0, video: 0 }, errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (/\.webm|\.mp4/.test(request.url())) requests.video++; });
    await page.addInitScript(() => {
        window.__webglContexts = 0; window.__drawCalls = 0; window.__lostContexts = 0;
        for (const name of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"]) {
            const draw = WebGL2RenderingContext.prototype[name];
            WebGL2RenderingContext.prototype[name] = function (...args) { window.__drawCalls++; return draw.apply(this, args); };
        }
        const original = HTMLCanvasElement.prototype.getContext, seen = new WeakSet();
        HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
            const result = original.call(this, kind, ...args);
            if ((kind === "webgl" || kind === "webgl2") && result && !seen.has(this)) {
                seen.add(this); window.__webglContexts++;
                this.addEventListener("webglcontextlost", () => window.__lostContexts++);
            }
            return result;
        };
    });
    await page.route("https://fba-server.onrender.com/**", async route => {
        const path = new URL(route.request().url()).pathname;
        const match = /\/animations\/fixture-(\d+)\/json$/.exec(path);
        if (match) {
            requests.json++;
            return route.fulfill({ json: definition ?? fixtures[Number(match[1]) % fixtures.length], headers: { "Access-Control-Allow-Origin": "*" } });
        }
        return route.fulfill({ json: path === "/animations" ? rows : { admin: false, success: true }, headers: { "Access-Control-Allow-Origin": "*" } });
    });
    return { requests, errors };
}

async function ready(page) {
    await page.mouse.move(1, 1);
    await page.goto("/animations");
    const card = page.locator(".card").first();
    await expect(card.locator(".animation-preview")).toHaveAttribute("data-state", "ready");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    return card;
}

test("cards have centered information, a transparent protruding block and no playback settings", async ({ page }) => {
    const { errors, requests } = await setup(page); const card = await ready(page);
    await expect(page.locator("video")).toHaveCount(0);
    await expect(card.locator("select, input, .animation-preview-controls, .animation-preview-options")).toHaveCount(0);
    const geometry = await card.evaluate(element => {
        const canvas = element.querySelector("canvas"), rect = canvas.getBoundingClientRect();
        const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let top = canvas.height, opaque = 0;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pixels[(y * canvas.width + x) * 4 + 3] > 128) { top = Math.min(top, y); opaque++; }
        const box = element.getBoundingClientRect(), title = element.querySelector("h2").getBoundingClientRect();
        return { objectTop: rect.top + top * rect.height / canvas.height, panelTop: box.top + parseFloat(getComputedStyle(element, "::before").top),
            titleTop: title.top, previewBottom: rect.bottom, centerError: Math.abs(title.x + title.width / 2 - box.x - box.width / 2),
            transparentCorner: pixels[3] === 0, opaque };
    });
    expect(geometry.opaque).toBeGreaterThan(1000); expect(geometry.transparentCorner).toBe(true);
    expect(geometry.objectTop).toBeLessThan(geometry.panelTop - 8);
    expect(geometry.titleTop).toBeGreaterThanOrEqual(geometry.previewBottom);
    expect(geometry.centerError).toBeLessThan(1); expect(requests.video).toBe(0); expect(errors).toEqual([]);
    await page.screenshot({ path: "test-results/animation-gallery.png" });
});

test("idle cards stay still, hovering plays motion, leaving restores the final pose", async ({ page }) => {
    const { errors } = await setup(page); const card = await ready(page), canvas = card.locator("canvas");
    const idle = await canvas.screenshot(); const before = await page.evaluate(() => window.__drawCalls);
    await page.waitForTimeout(180); expect(await canvas.screenshot()).toEqual(idle);
    expect(await page.evaluate(() => window.__drawCalls)).toBe(before);
    await card.hover(); await expect(card).toHaveAttribute("data-playing", "true");
    await page.waitForTimeout(80); const moving = await canvas.screenshot();
    await page.waitForTimeout(130); expect(await canvas.screenshot()).not.toEqual(moving);
    await page.mouse.move(1, 1); await expect(card).toHaveAttribute("data-playing", "false");
    await page.waitForTimeout(250); expect(await canvas.screenshot()).toEqual(idle);
    expect(errors).toEqual([]);
});

for (const format of [2, 3]) test(`format ${format} opacity reaches actual preview pixels`, async ({ page }) => {
    const definition = format === 2
        ? { format, id: "test:alpha", transform: {}, material: { opacity: "0.35+0*t" } }
        : { format, id: "test:alpha", tracks: { "material.opacity": .35 } };
    const { errors } = await setup(page, [catalog[0]], definition), card = await ready(page);
    const alpha = await card.locator("canvas").evaluate(element => {
        const pixels = element.getContext("2d").getImageData(0, 0, element.width, element.height).data;
        let max = 0, transparent = 0, translucent = 0;
        for (let i = 3; i < pixels.length; i += 4) {
            max = Math.max(max, pixels[i]);
            if (pixels[i] === 0) transparent++;
            else if (pixels[i] < 240) translucent++;
        }
        return { max, transparent, translucent };
    });
    expect(alpha.max).toBeGreaterThan(50); expect(alpha.max).toBeLessThan(240);
    expect(alpha.translucent).toBeGreaterThan(1000); expect(alpha.transparent).toBeGreaterThan(1000);
    expect(errors).toEqual([]);
});

for (const duration of [1000, 1600]) test(`hover playback uses native duration at 1x: ${duration}ms`, async ({ page }) => {
    const definition = { format: 3, id: "test:duration",
        timeline: duration === 1000 ? { duration_source: "settings" } : { duration_source: "preset", duration_ms: duration },
        tracks: { "transform.position.x": { keyframes: [{ t: 0, value: -.7 }, { t: 1, value: .7 }] } } };
    await setup(page, [catalog[0]], definition); const card = await ready(page), canvas = card.locator("canvas");
    await card.hover(); const started = Date.now(), samples = [];
    while (Date.now() - started < duration + 350) {
        const x = await canvas.evaluate(element => {
            const data = element.getContext("2d").getImageData(0, 0, element.width, element.height).data;
            let sum = 0, count = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] > 128) { sum += ((i - 3) / 4) % element.width; count++; }
            return sum / count;
        });
        samples.push({ time: Date.now() - started, x }); await page.waitForTimeout(65);
    }
    // Ignore the initial replacement of the resting pose after mouseenter.
    const resets = samples.slice(1).filter((sample, i) => sample.time > 200 && sample.x < samples[i].x - 20);
    expect(resets).toHaveLength(1); expect(resets[0].time).toBeGreaterThan(duration - 250); expect(resets[0].time).toBeLessThan(duration + 250);
});

test("repeat opening and unavailable API use JSON and card metadata in localStorage", async ({ page }) => {
    const { requests, errors } = await setup(page); await ready(page);
    await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("fba_animation_json_v1") || "{}")).length)).toBeGreaterThan(0);
    requests.json = 0; await page.route("https://fba-server.onrender.com/**", route => route.abort()); await page.reload();
    await expect(page.locator(".card").first().locator(".animation-preview")).toHaveAttribute("data-state", "ready");
    expect(requests.json).toBe(0); expect(errors).toEqual([]);
});

test("popularity is the default, sorting and search work without visible download counts", async ({ page }) => {
    const rows = [
        { ...catalog[0], name: "Gamma", popularity_rank: 3, created_at: "2026-10-27" },
        { ...catalog[1], name: "Beta", popularity_rank: 1, created_at: "2026-09-01" },
        { ...catalog[2], name: "Alpha", popularity_rank: 2, created_at: "2026-10-01" },
    ];
    const { errors } = await setup(page, rows); await ready(page);
    const titles = page.locator(".card h2"), sort = page.getByRole("combobox", { name: "Sort by" });
    await expect(sort).toHaveValue("popular"); await expect(titles).toHaveText(["Beta", "Alpha", "Gamma"]);
    await expect(page.locator(".animations-container")).not.toContainText(/\bdownloads\b|\brank\b/i);
    await sort.selectOption("newest"); await expect(titles).toHaveText(["Gamma", "Alpha", "Beta"]);
    await sort.selectOption("name"); await expect(titles).toHaveText(["Alpha", "Beta", "Gamma"]);
    await sort.selectOption("popular"); await page.getByPlaceholder("Search...").fill("a");
    await expect(titles).toHaveText(["Beta", "Alpha", "Gamma"]);
    await page.getByPlaceholder("Search...").fill("alp"); await expect(titles).toHaveText(["Alpha"]);
    expect(errors).toEqual([]);
});

test("blocked storage still opens the gallery and keyboard focus plays the preview", async ({ page }) => {
    const { errors } = await setup(page);
    await page.addInitScript(() => {
        for (const key of ["localStorage", "sessionStorage"]) Object.defineProperty(window, key, { get() { throw new DOMException("Storage disabled", "SecurityError"); } });
    });
    const card = await ready(page); await card.focus(); await expect(card).toHaveAttribute("data-playing", "true");
    expect(errors).toEqual([]);
});

test("100 cards share one context, hidden tabs stop drawing, leaving the page frees the context", async ({ page }) => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ ...catalog[i % catalog.length], id: `many-${i}` }));
    const { requests, errors } = await setup(page, rows); await ready(page);
    await expect(page.locator(".card")).toHaveCount(100); expect(requests.json).toBeLessThan(15);
    const last = page.locator(".card").last(); await last.scrollIntoViewIfNeeded();
    await expect(last.locator(".animation-preview")).toHaveAttribute("data-state", "ready"); await last.hover();
    expect(await page.evaluate(() => window.__webglContexts)).toBe(1);
    const hiddenDraws = await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); return window.__drawCalls;
    });
    await page.waitForTimeout(200); expect(await page.evaluate(() => window.__drawCalls)).toBe(hiddenDraws);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
    await page.getByRole("link", { name: /^home$/i }).click();
    await expect.poll(() => page.evaluate(() => window.__lostContexts)).toBe(1); expect(errors).toEqual([]);
});

test("reduced motion keeps the block static during hover", async ({ page }) => {
    const { errors } = await setup(page); await page.emulateMedia({ reducedMotion: "reduce" });
    const card = await ready(page); await card.hover(); await page.waitForTimeout(150);
    const before = await card.locator("canvas").screenshot(); await page.waitForTimeout(150);
    expect(await card.locator("canvas").screenshot()).toEqual(before); expect(errors).toEqual([]);
});

test("a failed JSON has a compact retry action and recovers without playback settings", async ({ page }) => {
    const { errors } = await setup(page, [catalog[0]]); let failures = 1;
    await page.route("https://fba-server.onrender.com/animations/*/json*", route => route.fulfill(failures-- > 0
        ? { status: 404, body: "missing", headers: { "Access-Control-Allow-Origin": "*" } }
        : { json: fixtures[0], headers: { "Access-Control-Allow-Origin": "*" } }));
    await page.goto("/animations"); await expect(page.getByText("Preview unavailable")).toBeVisible();
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.locator(".animation-preview")).toHaveAttribute("data-state", "ready"); expect(errors).toEqual([]);
});

test("mobile cards fit the screen and tapping a card starts its preview", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); const { errors } = await setup(page); const card = await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await card.dispatchEvent("pointerdown", { pointerType: "touch", button: 0 }); await expect(card).toHaveAttribute("data-playing", "true");
    expect(errors).toEqual([]); await page.screenshot({ path: "test-results/animation-gallery-mobile.png", fullPage: true });
});

test("deployed catalog loads Cloudflare JSON through the public server API", async ({ page }) => {
    test.skip(!process.env.FBA_LIVE_NETWORK, "Optional read-only live network check"); test.setTimeout(60000);
    const errors = [], videos = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (/\.webm|\.mp4/.test(request.url())) videos.push(request.url()); });
    await page.route("https://fba-server.onrender.com/**", route => new URL(route.request().url()).pathname === "/animations" && route.request().method() === "GET"
        ? route.continue() : route.fulfill({ json: { admin: false, success: true }, headers: { "Access-Control-Allow-Origin": "*" } }));
    await page.goto("/animations");
    await expect(page.locator(".card").first().locator(".animation-preview")).toHaveAttribute("data-state", "ready", { timeout: 45000 });
    expect(errors).toEqual([]); expect(videos).toEqual([]);
});
