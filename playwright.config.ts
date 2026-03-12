import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const raw = fs.readFileSync(envLocalPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export const AUTH_FILES = {
  player: path.resolve(process.cwd(), "tests/fixtures/auth/player.json"),
  parent: path.resolve(process.cwd(), "tests/fixtures/auth/parent.json"),
  scout: path.resolve(process.cwd(), "tests/fixtures/auth/scout.json"),
} as const;

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const LOCAL_SERVER_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost):3000$/;
const SHOULD_START_LOCAL_SERVER = LOCAL_SERVER_PATTERN.test(BASE_URL);
const WEB_SERVER_COMMAND =
  process.env.E2E_SERVER_COMMAND ?? "npm run dev -- --hostname 127.0.0.1";

const GALAXY_S24_UA =
  "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";
const GALAXY_TAB_S9_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-X716B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const GALAXY_S21_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";

const AUTH_SETUP_DEPS = ["setup:player", "setup:parent", "setup:scout"];
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };

export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "**/e2e/seed.spec.ts",
    "**/e2e/auth.spec.ts",
    "**/e2e/player.spec.ts",
    "**/e2e/parent.spec.ts",
    "**/e2e/scout.spec.ts",
    "**/e2e/cross-role.spec.ts",
    "**/e2e/mobile.spec.ts",
    "**/e2e/ui.spec.ts",
    "**/visual/*.spec.ts",
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: Number(process.env.E2E_WORKERS ?? 1),
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],

  use: {
    baseURL: BASE_URL,
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "setup:player",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "setup:parent",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "setup:scout",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "Desktop Chrome",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Desktop Chrome"],
        viewport: DESKTOP_VIEWPORT,
      },
    },
    {
      name: "Desktop Firefox",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Desktop Firefox"],
        viewport: DESKTOP_VIEWPORT,
      },
    },
    {
      name: "Desktop Safari",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Desktop Safari"],
        viewport: DESKTOP_VIEWPORT,
      },
    },
    {
      name: "iPhone 15",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["iPhone 15"],
      },
    },
    {
      name: "iPhone SE",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["iPhone SE"],
      },
    },
    {
      name: "iPad Pro 11",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["iPad Pro 11"],
      },
    },
    {
      name: "iPad Mini",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["iPad Mini"],
      },
    },
    {
      name: "Galaxy S24",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: GALAXY_S24_UA,
      },
    },
    {
      name: "Galaxy Tab S9",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        browserName: "chromium",
        viewport: { width: 800, height: 1280 },
        deviceScaleFactor: 2.25,
        isMobile: true,
        hasTouch: true,
        userAgent: GALAXY_TAB_S9_UA,
      },
    },
    {
      name: "Pixel 7",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "Galaxy S21",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        browserName: "chromium",
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: GALAXY_S21_UA,
      },
    },
  ],

  ...(SHOULD_START_LOCAL_SERVER
    ? {
        webServer: {
          command: WEB_SERVER_COMMAND,
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 240_000,
        },
      }
    : {}),
});
