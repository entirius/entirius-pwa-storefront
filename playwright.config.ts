import { defineConfig, devices } from "@playwright/test";
import app_config from "./_CONFIG/app.config.json";

// E2E runs against a live backend (see AGENTS.md → Testing). The storefront is
// started on demand, or reused when `pnpm dev` is already up on SITE_URL.
const BASE_URL = app_config.SITE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      // The locally installed Google Chrome — no bundled browser download.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
