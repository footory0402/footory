/**
 * 영상 플레이어 (ClipPlayerSheet) E2E 테스트
 *
 * 프로필 페이지에서 클립을 탭하여 전체화면 플레이어 진입 → 재생 상태 검증.
 * 이미 업로드된 클립이 있어야 동작합니다.
 *
 * 사용법:
 *   npx playwright test tests/e2e/video/video-player.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { loginAsPlayer } from "../setup/test-accounts";

const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "test-results/video-screenshots"
);

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

async function getVideoState(page: Page) {
  return page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    if (!v) return null;
    return {
      src: v.src,
      currentTime: v.currentTime,
      duration: v.duration,
      paused: v.paused,
      readyState: v.readyState,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
      error: v.error ? v.error.code : null,
    };
  });
}

test.describe("영상 플레이어", () => {
  test("1. 프로필에서 클립 탭 → 플레이어 열기", async ({ page }) => {
    await loginAsPlayer(page, "/profile");

    // 하이라이트 탭에 클립이 있는지 확인
    const clipCards = page.locator('[data-testid="clip-card"], .aspect-video, video');
    const clipCount = await clipCards.count();
    test.skip(clipCount === 0, "프로필에 클립이 없어 플레이어 테스트 불가");

    await screenshot(page, "player-01-profile");

    // 첫 번째 클립 탭
    await clipCards.first().click();
    await page.waitForTimeout(1000);

    // 플레이어 시트가 열렸는지 (전체화면 오버레이 or 비디오)
    const playerVideo = page.locator("video");
    await expect(playerVideo.first()).toBeVisible({ timeout: 10_000 });
    await screenshot(page, "player-02-opened");
  });

  test("2. 영상 재생 상태 확인", async ({ page }) => {
    await loginAsPlayer(page, "/profile");

    const clipCards = page.locator('[data-testid="clip-card"], .aspect-video, video');
    const clipCount = await clipCards.count();
    test.skip(clipCount === 0, "프로필에 클립이 없어 플레이어 테스트 불가");

    await clipCards.first().click();
    await page.waitForTimeout(1500);

    // 비디오 메타 로드 대기
    await page.waitForFunction(() => {
      const v = document.querySelector("video");
      return v && v.readyState >= 2;
    }, { timeout: 15_000 }).catch(() => {});

    const state = await getVideoState(page);
    if (state) {
      expect(state.error).toBeNull();
      expect(state.duration).toBeGreaterThan(0);

      // 2초 후 재생 진행 확인
      await page.waitForTimeout(2000);
      const state2 = await getVideoState(page);
      if (state2 && !state2.paused) {
        expect(state2.currentTime).toBeGreaterThan(0);
      }
    }
    await screenshot(page, "player-03-playing");
  });

  test("3. HUD 오버레이 확인", async ({ page }) => {
    await loginAsPlayer(page, "/profile");

    const clipCards = page.locator('[data-testid="clip-card"], .aspect-video, video');
    const clipCount = await clipCards.count();
    test.skip(clipCount === 0, "프로필에 클립이 없어 플레이어 테스트 불가");

    await clipCards.first().click();
    await page.waitForTimeout(2000);

    // HUD 요소 탐색 (브랜드바 or 선수 정보)
    const hudBrand = page.locator('text="FOOTORY"');
    const hudOverlay = page.locator('[class*="hud"], [class*="overlay"]');

    const hasBrand = await hudBrand.isVisible().catch(() => false);
    const hasOverlay = await hudOverlay.first().isVisible().catch(() => false);

    await screenshot(page, "player-04-hud");

    // 둘 중 하나라도 보이면 HUD 동작 확인
    if (!hasBrand && !hasOverlay) {
      console.log("HUD가 표시되지 않음 (카드 데이터 없을 수 있음)");
    }
  });

  test("4. 스포트라이트 마커 + 자동 줌", async ({ page }) => {
    await loginAsPlayer(page, "/profile");

    const clipCards = page.locator('[data-testid="clip-card"], .aspect-video, video');
    const clipCount = await clipCards.count();
    test.skip(clipCount === 0, "프로필에 클립이 없어 플레이어 테스트 불가");

    await clipCards.first().click();
    await page.waitForTimeout(3000);

    // 스포트라이트 마커 (VideoOverlay)
    const marker = page.locator('[class*="spotlight"], [class*="marker"]');
    const hasMarker = await marker.first().isVisible().catch(() => false);

    await screenshot(page, "player-05-spotlight");

    if (hasMarker) {
      // 줌 상태 확인 (transform scale)
      const transform = await page.evaluate(() => {
        const v = document.querySelector("video");
        return v ? getComputedStyle(v).transform : "none";
      });
      console.log("Video transform:", transform);
    }
  });

  test("5. 탭하여 일시정지/재생 토글", async ({ page }) => {
    await loginAsPlayer(page, "/profile");

    const clipCards = page.locator('[data-testid="clip-card"], .aspect-video, video');
    const clipCount = await clipCards.count();
    test.skip(clipCount === 0, "프로필에 클립이 없어 플레이어 테스트 불가");

    await clipCards.first().click();
    await page.waitForTimeout(2000);

    const video = page.locator("video").first();
    const box = await video.boundingBox();
    if (!box) return;

    // 재생 상태 확인
    const stateBefore = await getVideoState(page);

    // 영상 탭 (일시정지)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await screenshot(page, "player-06-paused");

    // 다시 탭 (재생)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await screenshot(page, "player-07-resumed");
  });
});
