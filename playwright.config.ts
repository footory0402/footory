import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (fs.existsSync(envLocalPath)) {
  const raw = fs.readFileSync(envLocalPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const storageState = process.env.E2E_AUTH_STATE;
const e2eServerCommand = process.env.E2E_SERVER_COMMAND ?? "npm run start:e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: Number(process.env.E2E_WORKERS ?? 1),
  reporter: [["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    ...(storageState ? { storageState } : {}),
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["iPhone 15 Pro Max"],
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: e2eServerCommand,
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
