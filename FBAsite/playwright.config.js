import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/browser",
    workers: 1,
    timeout: 30000,
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:5174",
        viewport: { width: 1280, height: 900 },
        screenshot: "only-on-failure",
        launchOptions: {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
            args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        },
    },
    webServer: {
        command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
        url: "http://127.0.0.1:5174",
        reuseExistingServer: true,
    },
});
