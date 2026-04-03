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
    expect(videoState!.videoWidth).toBeGreaterThan(0);

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

  test("3. 꾸미기 — 선수 위치 마커 배치", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    // 파일 선택 → 다음
    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();

    // DecorateView 진입 확인
    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });
    await screenshot(page, "05-decorate-view");

    // 위치 탭 기본 활성
    await expect(page.locator('text="영상을 탭하여 선수 위치를 표시하세요"')).toBeVisible();

    // 영상 영역 탭하여 마커 배치
    const videoContainer = page.locator("video").first();
    const box = await videoContainer.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);

      // 마커가 배치되었는지 확인 ("선수 위치 설정됨" 텍스트)
      const markerSet = page.locator('text="선수 위치 설정됨"');
      await expect(markerSet).toBeVisible({ timeout: 3000 });
      await screenshot(page, "06-marker-placed");
    }
  });

  test("4. 꾸미기 — 태그 선택", async ({ page }) => {
    await loginAsPlayer(page, "/upload");
    await page.waitForSelector('text="영상을 선택하세요"', { timeout: 10_000 });

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(VIDEO_FILE);
    await page.waitForSelector("video", { timeout: 15_000 });
    await page.locator('button:has-text("다음")').click();

    await page.waitForSelector('text="꾸미기"', { timeout: 10_000 });

    // 태그 탭 전환
    await page.locator('button:has-text("태그")').click();
    await page.waitForTimeout(300);

    // "이 장면은?" 텍스트 확인
    await expect(page.locator('text="이 장면은?"')).toBeVisible();
    await screenshot(page, "07-tag-tab");

    // 첫 번째 태그 버튼 클릭
    const tagButtons = page.locator('.grid button');
    const count = await tagButtons.count();
    if (count > 0) {
      await tagButtons.first().click();
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

    // decorate → share
    await page.locator('button:has-text("다음")').click();
    await page.waitForSelector('text="올리기"', { timeout: 10_000 });
    await screenshot(page, "10-share-view");

    // 메모 입력
    const memo = page.locator('textarea');
    await memo.fill("E2E 테스트 업로드");

    // 공개범위 확인 (4개 옵션)
    await expect(page.locator('text="전체 공개"')).toBeVisible();
    await expect(page.locator('text="팔로워만"')).toBeVisible();
    await expect(page.locator('text="팀원만"')).toBeVisible();
    await expect(page.locator('text="나만 보기"')).toBeVisible();

    // "나만 보기" 선택 (테스트 데이터 오염 방지)
    await page.locator('text="나만 보기"').click();
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
    expect(state!.videoWidth).toBeGreaterThan(0);
    expect(state!.videoHeight).toBeGreaterThan(0);
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
    await screenshot(page, "flow-03-decorate");

    // Step 2a: 마커 배치
    const video = page.locator("video").first();
    const box = await video.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.5);
      await page.waitForTimeout(500);
      await screenshot(page, "flow-04-marker");
    }

    // Step 2b: 태그 탭
    await page.locator('button:has-text("태그")').click();
    await page.waitForTimeout(300);
    const tagBtns = page.locator('.grid button');
    if (await tagBtns.count() > 0) {
      await tagBtns.first().click();
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
    await page.locator('text="나만 보기"').click();
    await screenshot(page, "flow-08-configured");
  });
});
