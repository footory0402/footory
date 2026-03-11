import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// .env.local 자동 로드
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

// 역할별 인증 상태 파일 경로
export const AUTH_FILES = {
  player: path.resolve(process.cwd(), ".tmp/e2e/auth-player.json"),
  parent: path.resolve(process.cwd(), ".tmp/e2e/auth-parent.json"),
  scout: path.resolve(process.cwd(), ".tmp/e2e/auth-scout.json"),
} as const;

const BASE_URL = process.env.E2E_BASE_URL ?? "https://footory.vercel.app";
const e2eServerCommand = process.env.E2E_SERVER_COMMAND;

// Galaxy S21 커스텀 UA (Galaxy S III 기반)
const GALAXY_S21_UA =
  "Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

// Galaxy S24 커스텀 UA
const GALAXY_S24_UA =
  "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

// Galaxy Tab S9 커스텀 UA
const GALAXY_TAB_S9_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-X716B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 모든 디바이스 프로젝트가 의존하는 setup 프로젝트 목록
const AUTH_SETUP_DEPS = ["setup:player", "setup:parent", "setup:scout"];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: Number(process.env.E2E_WORKERS ?? 1),
  reporter: [["html", { outputFolder: "playwright-report" }]],

  use: {
    baseURL: BASE_URL,
    screenshot: "on",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // ──────────────────────────────────────────────
    // 역할별 인증 Setup (3개)
    // 테스트 실행 전 storageState를 .tmp/e2e/auth-{role}.json 에 저장
    // ──────────────────────────────────────────────
    {
      name: "setup:player",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        extraHTTPHeaders: { "x-e2e-role": "player" },
      },
    },
    {
      name: "setup:parent",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        extraHTTPHeaders: { "x-e2e-role": "parent" },
      },
    },
    {
      name: "setup:scout",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        extraHTTPHeaders: { "x-e2e-role": "scout" },
      },
    },

    // ──────────────────────────────────────────────
    // 데스크톱 (3개)
    // ──────────────────────────────────────────────
    {
      name: "Desktop Chrome",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "Desktop Firefox",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "Desktop Safari",
      dependencies: AUTH_SETUP_DEPS,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 },
      },
    },

    // ──────────────────────────────────────────────
    // Android 기기 (4개) — Chromium 엔진
    // ──────────────────────────────────────────────
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
        ...devices["Galaxy S III"],
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: GALAXY_S21_UA,
      },
    },

    // ──────────────────────────────────────────────
    // iOS 기기 (4개) — WebKit 엔진
    // ──────────────────────────────────────────────
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
  ],

  // 로컬 개발 시에만 dev 서버 실행 (E2E_SERVER_COMMAND 환경변수로 제어)
  ...(e2eServerCommand
    ? {
        webServer: {
          command: e2eServerCommand,
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 240_000,
        },
      }
    : {}),
});
