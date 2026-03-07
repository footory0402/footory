import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");

const QA_BASE_URL = "https://footory.vercel.app";

// Set E2E_BASE_URL so test-accounts.ts applies cookies to the correct domain
if (!process.env.E2E_BASE_URL) {
  process.env.E2E_BASE_URL = QA_BASE_URL;
}

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

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/footory-qa-test.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "qa-report", open: "never" }],
  ],
  use: {
    baseURL: QA_BASE_URL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
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
  // No webServer block — testing against deployed app
});
