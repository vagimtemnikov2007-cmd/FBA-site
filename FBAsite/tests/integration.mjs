import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = path.resolve(process.env.FBA_SERVER_ROOT || path.join(root, "../../FBA-server"));
const children = [];
function start(args, cwd, env, pattern) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, args, { cwd, env: { ...process.env, NO_COLOR: "1", ...env }, stdio: ["ignore", "pipe", "pipe"] });
        children.push(child); let output = "", settled = false;
        const timer = setTimeout(() => reject(new Error(`Test server startup timed out: ${output}`)), 12000);
        function data(chunk) {
            output = (output + chunk.toString().replace(/\u001b\[[0-9;]*m/g, "")).slice(-8000);
            const match = pattern.exec(output);
            if (match && !settled) { settled = true; clearTimeout(timer); resolve(match[1]); }
        }
        child.stdout.on("data", data); child.stderr.on("data", data);
        child.once("error", error => { clearTimeout(timer); reject(error); });
        child.once("exit", code => { if (!settled) { clearTimeout(timer); reject(new Error(`Test server exited (${code}): ${output}`)); } });
    });
}
let browser;
try {
    const api = await start(["tests/preview-api.js", path.join(root, "tests/fixtures/catalog")], backend, {}, /FBA_TEST_API_URL=(http:\/\/127\.0\.0\.1:\d+)/);
    const frontend = await start([path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", "0"], root, { VITE_API_URL: api }, /Local:\s+(http:\/\/127\.0\.0\.1:\d+)/);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
        args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [], disallowed = []; let jsonRequests = 0;
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.origin !== api && url.origin !== frontend) { disallowed.push(url.href); return route.abort(); }
        if (url.origin === api && /\/json$/.test(url.pathname)) jsonRequests++;
        return route.continue();
    });
    await page.goto(frontend + "/animations");
    await page.locator('.card .animation-preview[data-state="ready"]').first().waitFor({ state: "visible" });
    assert.equal(await page.locator(".card").count(), 11);
    const rows = await (await fetch(api + "/animations")).json();
    assert(rows.every(row => row.animation_url.startsWith(api + "/animations/") && row.json_status === "ready"));
    const preview = await (await fetch(rows[0].animation_url)).json();
    assert(preview.id && preview.transform);
    const download = await fetch(rows[0].download_url);
    assert.match(download.headers.get("content-disposition"), /attachment/);
    assert.deepEqual(await download.json(), preview);
    await page.waitForTimeout(150); assert(jsonRequests > 0);
    jsonRequests = 0; await page.reload();
    await page.locator('.card .animation-preview[data-state="ready"]').first().waitFor({ state: "visible" });
    assert.equal(jsonRequests, 0, "Repeat opening did not reuse JSON from localStorage");
    assert.deepEqual(errors, []); assert.deepEqual(disallowed, []);
    mkdirSync(path.join(root, "docs"), { recursive: true });
    await page.screenshot({ path: path.join(root, "docs/live-json-preview.png") });
    console.log("PASS: original catalog JSON → R2 adapter → real Express API → Three.js → browser cache; download preserved; no video or external requests");
} finally {
    await browser?.close();
    await Promise.all(children.map(async child => {
        if (child.exitCode !== null) return;
        const exited = once(child, "exit"); child.kill("SIGTERM");
        const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
        await exited; clearTimeout(timer);
    }));
}
