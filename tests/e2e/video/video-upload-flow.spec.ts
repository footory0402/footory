/**
 * 영상 업로드 두 번째 세로 슬라이스 E2E 테스트
 *
 * 사용법:
 *   VIDEO_FILE=/path/to/video.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { loginAsPlayer } from "../setup/test-accounts";

const VIDEO_FILE = process.env.VIDEO_FILE ?? "";
const SMOKE_VIDEO_FILE = fs.existsSync(VIDEO_FILE)
  ? VIDEO_FILE
  : path.resolve(process.cwd(), "tests/fixtures/videos/test1.mp4");
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-results/video-screenshots");

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function screenshot(page: Page, name: string) {
  ensureScreenshotDir();
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: false,
  });
}

test.describe("영상 업로드 두 번째 세로 슬라이스", () => {
  test.beforeEach(() => {
    test.skip(!VIDEO_FILE, "VIDEO_FILE 환경변수가 필요합니다");
    test.skip(!fs.existsSync(VIDEO_FILE), `영상 파일을 찾을 수 없습니다: ${VIDEO_FILE}`);
  });

  test("1. 파일 선택 전에 형식과 제한을 이해할 수 있다", async ({ page }) => {
    await loginAsPlayer(page, "/upload");

    await expect(page.getByText("영상을 선택하세요")).toBeVisible();
    await expect(page.getByText(/MP4, MOV/i)).toBeVisible();
    await expect(page.getByText(/5분 이내/i)).toBeVisible();
    await expect(page.getByText(/200MB 이내/i)).toBeVisible();

    await screenshot(page, "upload-slice-01-select");
  });

  test("2. 유효한 파일을 선택하면 업로드 시작 버튼과 미리보기가 보인다", async ({ page }) => {
    await loginAsPlayer(page, "/upload");

    await page.locator('input[type="file"]').setInputFiles(VIDEO_FILE);

    await expect(page.locator("video")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "업로드 시작" })).toBeVisible();
    await expect(page.getByText("구간 선택")).toBeVisible();

    await screenshot(page, "upload-slice-02-preview");
  });

  test("3. 업로드를 시작하면 처리 상태를 단계별로 확인할 수 있다", async ({ page }) => {
    await loginAsPlayer(page, "/upload");

    await page.locator('input[type="file"]').setInputFiles(VIDEO_FILE);
    await expect(page.locator("video")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "업로드 시작" }).click();

    await expect(page.getByText("업로드 처리")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("메타데이터 확인")).toBeVisible();
    await expect(page.getByText("원본 업로드")).toBeVisible();
    await expect(page.getByText("편집 화면 준비")).toBeVisible();

    await screenshot(page, "upload-slice-03-processing");
  });

  test("4. 업로드가 끝나면 single clip 편집 화면에서 주요 도구를 확인할 수 있다", async ({ page }) => {
    await loginAsPlayer(page, "/upload");

    await page.locator('input[type="file"]').setInputFiles(VIDEO_FILE);
    await expect(page.locator("video")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "업로드 시작" }).click();

    await expect(page.getByText("클립 편집")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("single-clip-editor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Trim" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Spotlight" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Overlay" })).toBeVisible();

    await page.getByRole("button", { name: "Spotlight" }).click();
    await expect(page.getByTestId("single-clip-spotlight-panel")).toBeVisible();

    await page.getByRole("button", { name: "Highlight" }).click();
    await expect(page.getByTestId("single-clip-highlight-panel")).toBeVisible();
    await expect(page.getByTestId("single-clip-save-panel")).toBeVisible();
    await expect(page.getByText("프로필 Featured로 공개")).toBeVisible();

    await screenshot(page, "upload-slice-04-review");
  });
});

test.describe("영상 업로드 편집 진입 smoke", () => {
  test.beforeEach(() => {
    test.skip(!fs.existsSync(SMOKE_VIDEO_FILE), `영상 파일을 찾을 수 없습니다: ${SMOKE_VIDEO_FILE}`);
  });

  test("업로드 완료 후 편집 route로 진입할 수 있다", async ({ page, baseURL }) => {
    const clipId = "clip-upload-smoke";
    const uploadUrl = `${baseURL}/__e2e__/upload-target`;

    await page.route("**/api/upload/presign", async (route) => {
      const body = route.request().postDataJSON() as { type?: string; clipId?: string };
      const isThumbnail = body?.type === "thumbnail";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: uploadUrl,
          key: isThumbnail ? `thumbs/${clipId}.jpg` : `originals/${clipId}.mp4`,
          clipId,
        }),
      });
    });

    await page.route("**/__e2e__/upload-target", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/api/clips", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ clip: { id: clipId } }),
      });
    });

    await page.route(`**/api/clips/${clipId}`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            clip: {
              id: clipId,
              video_url: "/test-upload.mp4",
              duration_seconds: 12,
              duration_sec: 12,
              trim_start: 0,
              trim_end: 12,
              highlight_start: 0,
              highlight_end: 12,
              spotlight_x: null,
              spotlight_y: null,
              freeze_at: null,
              effects: {
                intro: false,
                showLowerThird: true,
                focusZoom: 1.8,
              },
              tags: ["shooting"],
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route("**/api/video-projects", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          project: {
            id: "project-upload-smoke",
            kind: "single_clip",
            status: "draft",
            clip_id: clipId,
            highlight_id: null,
            title: null,
            payload: {},
            last_opened_at: null,
            published_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    });

    await loginAsPlayer(page, "/");
    await page.getByRole("button", { name: /^업로드$/ }).click();
    await expect(page).toHaveURL(/\/upload$/);

    await page.locator('input[type="file"]').setInputFiles(SMOKE_VIDEO_FILE);
    await expect(page.locator("video")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "업로드 시작" }).click();

    await expect(page.getByText("업로드 처리")).toBeVisible();
    await expect(page.getByRole("button", { name: "편집 화면으로 이동" })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "편집 화면으로 이동" }).click();

    await expect(page).toHaveURL(new RegExp(`/edit/${clipId}(?:\\?|$)`));
    await expect(page.getByText("클립 편집")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("single-clip-editor")).toBeVisible();

    await screenshot(page, "upload-smoke-edit-route");
  });
});
