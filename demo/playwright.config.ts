import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 0.0.0.0",
    url: "http://127.0.0.1:5173/signup",
    reuseExistingServer: !process.env.CI,
  },
});
