import { defineConfig } from "@playwright/test";

const baseURL = process.env.BREEZEFILL_BASE_URL || "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "node scripts/test-server.mjs --port 4173",
    url: `${baseURL}/test-form.html`,
    reuseExistingServer: true,
    timeout: 20_000
  }
});
