/**
 * 영상 업로드 + 편집 + 재생 E2E 테스트
 *
 * 사용법:
 *   VIDEO_FILE=/path/to/video.mp4 npx playwright test tests/e2e/video/video-upload-flow.spec.ts
 *
 * 환경변수:
 *   VIDEO_FILE  — 테스트할 영상 파일 경로 (필수)
 */

import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { loginAsPlayer } from "../setup/test-accounts";

/* ── 환경변수 ── */
const VIDEO_FILE = process.env.VIDEO_FILE ?? "";
const SCREENSHOT_DIR = path.resolve(
  process.cwd(),
  "test-results/video-screenshots"
);

/* ── 헬퍼 ── */
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

/** 비디오 엘리먼트의 상태를 evaluate로 수집 */
async function getVideoState(page: Page, selector = "video") {
  return page.evaluate((sel) => {
    const v = document.querySelector(sel) as HTMLVideoElement | null;
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
  }, selector);
}

async function dismissCoachMarkIfPresent(page: Page) {
  const dismissBtn = page.getByRole("button", { name: "건너뛰기" });
  if (await dismissBtn.isVisible().catch(() => false)) {
    await dismissBtn.click();
  }
}

/* ── 테스트 ── */

test.describe("영상 업로드 전체 플로우", () => {
  test.beforeEach(() => {
    test.skip(!VIDEO_FILE, "VIDEO_FILE 환경변수가 필요합니다");
    test.skip(
      !fs.existsSync(VIDEO_FILE),
      `영상 파일을 찾을 수 없습니다: ${VIDEO_FILE}`
    );
  });

  test("1. 파일 선택 + 유효성 검사", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });
    await screenshot(page, "01-upload-initial");

    // 파일 업로드
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);

    // 영상 미리보기 로드 대기
    await page.waitForSelector("video", { timeout: 15_000 });

    // 에러 없는지 확인
    const error = page.locator('text="영상 파일이 아닌 것 같아요"');
    const sizeError = page.locator('text="200MB 이내로 선택해주세요"');
    const durationError = page.locator('text="5분 이내로 선택해주세요"');
    await expect(error).not.toBeVisible();
    await expect(sizeError).not.toBeVisible();
    await expect(durationError).not.toBeVisible();

    // 영상 렌더링 확인
    const videoState = await getVideoState(page);
    expect(videoState).not.toBeNull();
    expect(videoState!.error).toBeNull();
    expect(videoState!.duration).toBeGreaterThan(0);

    await screenshot(page, "02-file-selected");

    // 파일 정보 오버레이 (duration + 파일 크기)
    const durationBadge = page.locator(".font-stat").first();
    await expect(durationBadge).toBeVisible();
  });

  test("2. 트림 바 + 구간 선택", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });

    // duration > 2초 → 트림 바 표시
    const videoState = await getVideoState(page);
    if (videoState && videoState.duration > 2) {
      const trimSection = page.locator('text="구간 선택"');
      await expect(trimSection).toBeVisible();
      await screenshot(page, "03-trim-bar-visible");

      // 시작/끝 시간 표시 확인
      await expect(page.locator('text="시작"')).toBeVisible();
      await expect(page.locator('text="끝"')).toBeVisible();
      await expect(page.locator('text="길이"')).toBeVisible();
    }

    // "다음" 버튼 존재 확인
    const nextBtn = page.locator('button:has-text("다음")');
    await expect(nextBtn).toBeVisible();
    await screenshot(page, "04-ready-for-next");
  });

  test("3. 꾸미기 — 선수 지정 저장", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    // 파일 선택 → 다음
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();

    // DecorateView 진입 확인
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);
    await screenshot(page, "05-decorate-view");

    // 선수 탭 기본 활성 안내
    await expect(page.getByText("선수를 화면에서 바로 찍으세요")).toBeVisible();

    // 영상 위를 직접 눌러 선수 지정
    const decorateVideo = page.getByTestId("decorate-video");
    await expect(decorateVideo).toBeVisible();
    await decorateVideo.click({ position: { x: 180, y: 220 } });
    await expect(page.locator('text="선수 지정 완료"')).toBeVisible({ timeout: 3000 });
    await screenshot(page, "06-player-focused");
  });

  test("4. 꾸미기 — 태그 선택", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();

    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);

    // 태그 탭 전환
    await page.locator('button:has-text("태그")').click();
    await page.waitForTimeout(300);

    // "이 장면은?" 텍스트 확인
    await expect(page.locator('text="이 장면은?"')).toBeVisible();
    await screenshot(page, "07-tag-tab");

    // 첫 번째 태그 버튼 클릭
    const goalTagBtn = page.getByRole("button", { name: /골/ }).first();
    if (await goalTagBtn.isVisible().catch(() => false)) {
      await goalTagBtn.click();
      await page.waitForTimeout(300);
      await screenshot(page, "08-tag-selected");
    }
  });

  test("5. 꾸미기 — 효과 토글", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();

    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);

    // 효과 탭 전환
    await page.locator('button:has-text("효과")').click();
    await page.waitForTimeout(300);

    await expect(page.locator('text="영상 효과"')).toBeVisible();
    await screenshot(page, "09-effect-tab");
  });

  test("6. 공유 + 업로드 시작", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });

    // select → decorate
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);

    // decorate → share
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="올리기"', { timeout: 10_000 });
    await screenshot(page, "10-share-view");

    // 메모 입력
    const memo = page.locator('textarea');
    await memo.fill("E2E 테스트 업로드");

    await screenshot(page, "11-share-configured");

    // 올리기 버튼 확인 (실제 업로드는 하지 않음 — R2 비용 방지)
    const uploadBtn = page.locator('button:has-text("올리기")');
    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toBeEnabled();
  });

  test("7. 영상 미리보기 재생 확인", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });

    // 비디오 메타 로드 대기
    await page.waitForFunction(() => {
      const v = document.querySelector("video");
      return v && v.readyState >= 1 && v.duration > 0;
    }, { timeout: 15_000 });

    // 비디오 상태 수집
    const state = await getVideoState(page);
    expect(state).not.toBeNull();
    expect(state!.duration).toBeGreaterThan(0);
    expect(state!.readyState).toBeGreaterThan(0);
    expect(state!.error).toBeNull();

    // 비디오 재생 시도
    await page.evaluate(() => {
      const v = document.querySelector("video") as HTMLVideoElement;
      if (v) v.play().catch(() => {});
    });
    await page.waitForTimeout(1000);

    const afterPlay = await getVideoState(page);
    // muted autoplay는 브라우저에서 보통 허용
    // currentTime이 0보다 크면 재생 중
    if (afterPlay && !afterPlay.paused) {
      expect(afterPlay.currentTime).toBeGreaterThan(0);
    }

    await screenshot(page, "12-video-playing");
  });

  test("8. 줌 버튼 동작 (DecorateView)", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);

    // 줌 + 버튼 찾기
    const zoomInBtn = page.locator('button:has-text("+")');
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click();
      await page.waitForTimeout(300);
      await screenshot(page, "13-zoomed-in");

      // 줌 - 버튼
      const zoomOutBtn = page.locator('button:has-text("−")');
      if (await zoomOutBtn.isVisible()) {
        await zoomOutBtn.click();
        await page.waitForTimeout(300);
        await screenshot(page, "14-zoomed-out");
      }
    }
  });

  test("9. 프레임 탐색기 (DecorateView)", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);

    // FrameNavigator의 스크러버가 보이는지 확인
    const scrubber = page.locator('input[type="range"]');
    if (await scrubber.isVisible()) {
      await screenshot(page, "15-frame-navigator");

      // 스크러버 조작
      await scrubber.fill("50");
      await page.waitForTimeout(300);
      await screenshot(page, "16-frame-scrubbed");
    }
  });

  test("10. 전체 플로우 스크린샷 리포트", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });
    await screenshot(page, "flow-01-initial");

    // Step 1: 파일 선택
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.waitForFunction(() => {
      const v = document.querySelector("video");
      return v && v.readyState >= 1;
    }, { timeout: 10_000 });
    await screenshot(page, "flow-02-file-selected");

    // Step 2: 다음 → 꾸미기
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);
    await screenshot(page, "flow-03-decorate");

    // Step 2a: 마커 배치
    const decorateVideo = page.getByTestId("decorate-video");
    if (await decorateVideo.isVisible().catch(() => false)) {
      await decorateVideo.click({ position: { x: 180, y: 220 } });
      await expect(page.locator('text="선수 지정 완료"')).toBeVisible({ timeout: 3000 });
      await screenshot(page, "flow-04-focus-saved");
    }

    // Step 2b: 태그 탭
    await page.locator('button:has-text("태그")').click();
    await page.waitForTimeout(300);
    const firstTag = page.getByRole("button", { name: /골|어시스트|드리블|세이브|기타/ }).first();
    if (await firstTag.isVisible().catch(() => false)) {
      await firstTag.click();
    }
    await screenshot(page, "flow-05-tag");

    // Step 2c: 효과 탭
    await page.locator('button:has-text("효과")').click();
    await page.waitForTimeout(300);
    await screenshot(page, "flow-06-effects");

    // Step 3: 다음 → 공유
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="올리기"', { timeout: 10_000 });
    await screenshot(page, "flow-07-share");

    // 메모 + 공개범위
    const memo = page.locator("textarea");
    if (await memo.isVisible()) {
      await memo.fill("전체 플로우 테스트");
    }
    await screenshot(page, "flow-08-configured");
  });

  test("11. 실제 업로드 후 프로필/공개 링크 재생", async ({ page }) => {
    test.setTimeout(180_000);

    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });

    // select -> decorate
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await dismissCoachMarkIfPresent(page);

    // 선수 지정 저장
    const decorateVideo = page.getByTestId("decorate-video");
    if (await decorateVideo.isVisible().catch(() => false)) {
      await decorateVideo.click({ position: { x: 180, y: 220 } });
      await expect(page.locator('text="선수 지정 완료"')).toBeVisible({ timeout: 3000 });
    }

    // decorate -> share
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="올리기"', { timeout: 10_000 });
    await page.locator("textarea").fill("E2E 실제 업로드 검증");

    const clipResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/clips") &&
        res.request().method() === "POST" &&
        res.ok(),
      { timeout: 120_000 }
    );

    await page.locator('button:has-text("올리기")').click();

    const clipRes = await clipResponsePromise;
    const clipJson = (await clipRes.json().catch(() => ({}))) as {
      clip?: { id?: string };
    };
    const clipId = clipJson.clip?.id;

    const doneVisible = await page
      .waitForSelector('text="업로드 완료!"', { timeout: 120_000 })
      .then(() => true)
      .catch(() => false);
    if (doneVisible) {
      await screenshot(page, "flow-11-upload-done");
      await page.locator('button:has-text("프로필에서 확인")').click();
      await page.waitForURL("**/profile", { timeout: 20_000 });
    } else {
      await page.goto("/profile");
      await page.waitForLoadState("domcontentloaded");
      await screenshot(page, "flow-11-upload-done-fallback");
    }

    // 프로필 진입 후 재생 확인
    const profileClip = page.locator('[data-testid="clip-card"], .aspect-video, video, [class*="cursor-pointer"]').filter({
      hasText: /0:\d{2}/,
    }).first();
    await expect(profileClip).toBeVisible({ timeout: 20_000 });
    await profileClip.click();
    await page.waitForTimeout(1200);
    const hasProfilePlayer = await page.locator("video").first().isVisible().catch(() => false);
    if (hasProfilePlayer) {
      await screenshot(page, "flow-12-profile-player");
    } else {
      await screenshot(page, "flow-12-profile-clip-open-attempt");
    }

    // 공개 링크 재생 확인 (/p/[handle]/h/[clipId])
    if (clipId) {
      await page.goto(`/p/e2e_player/h/${clipId}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("video").first()).toBeVisible({ timeout: 20_000 });
      await screenshot(page, "flow-13-public-share-player");
    }
  });
});
