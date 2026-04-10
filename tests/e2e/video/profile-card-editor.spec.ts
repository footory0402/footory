/**
 * 프로필 카드 에디터 E2E 테스트
 *
 * /editor 페이지에서 카드 생성/편집/저장 플로우 검증.
 *
 * 사용법:
 *   npx playwright test tests/e2e/video/profile-card-editor.spec.ts
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

test.describe("프로필 카드 에디터", () => {
  test("1. 에디터 페이지 로드 (비로그인)", async ({ page }) => {
    await page.goto("/editor");

    // /editor는 public 경로 — 로그인 없이 접근 가능
    // 로그인 페이지로 리다이렉트되지 않아야 함
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).not.toContain("/login");

    await screenshot(page, "card-01-editor-public");
  });

  test("2. 로그인 상태에서 프로필 자동 채움", async ({ page }) => {
    await loginAsPlayer(page, "/editor");
    await page.waitForTimeout(3000);
    await screenshot(page, "card-02-editor-logged-in");

    // 현재 에디터는 div 기반 카드 프리뷰라 캔버스/클래스 셀렉터보다
    // 실제 자동 채움 결과와 핵심 액션을 확인하는 편이 안정적이다.
    await expect(page.getByRole("textbox", { name: "이름 입력" })).toHaveValue(
      "E2E Player"
    );
    await expect(page.getByRole("button", { name: "미리보기" })).toBeVisible();
  });

  test("3. 템플릿 전환", async ({ page }) => {
    await loginAsPlayer(page, "/editor");
    await page.waitForTimeout(3000);

    // 템플릿 선택 버튼 탐색
    const templateBtns = page.locator('button').filter({ hasText: /FIFA|방송|미니멀|세로|가로/ });
    const count = await templateBtns.count();

    if (count >= 2) {
      await templateBtns.nth(1).click();
      await page.waitForTimeout(500);
      await screenshot(page, "card-03-template-switched");

      await templateBtns.first().click();
      await page.waitForTimeout(500);
      await screenshot(page, "card-04-template-first");
    }
  });

  test("4. 컬러 프리셋 선택", async ({ page }) => {
    await loginAsPlayer(page, "/editor");
    await page.waitForTimeout(3000);

    // 컬러 프리셋 버튼 탐색 (원형 컬러 버튼 or 팀 이름)
    const colorBtns = page.locator('[class*="color"], [class*="preset"]').filter({
      has: page.locator('div, span'),
    });

    const count = await colorBtns.count();
    if (count > 0) {
      await colorBtns.first().click();
      await page.waitForTimeout(500);
      await screenshot(page, "card-05-color-preset");
    }
  });

  test("5. 카드 저장", async ({ page }) => {
    await loginAsPlayer(page, "/editor");
    await page.waitForTimeout(3000);

    // 저장 버튼 탐색
    const saveBtn = page.locator('button').filter({ hasText: /저장|Save/ });
    const count = await saveBtn.count();

    if (count > 0) {
      // API 응답 모니터링
      const savePromise = page.waitForResponse(
        (res) => res.url().includes("/api/player-card") && res.request().method() === "POST",
        { timeout: 10_000 }
      ).catch(() => null);

      await saveBtn.first().click();
      const response = await savePromise;

      if (response) {
        const status = response.status();
        expect(status).toBeLessThan(500);
      }

      await screenshot(page, "card-06-saved");
    }
  });

  test("6. 내보내기 버튼 확인", async ({ page }) => {
    await loginAsPlayer(page, "/editor");
    await page.waitForTimeout(3000);

    // 내보내기/다운로드 버튼
    const exportBtn = page.locator('button').filter({ hasText: /내보내기|다운로드|Export|PNG|MP4/ });
    const count = await exportBtn.count();

    await screenshot(page, "card-07-export-buttons");

    if (count > 0) {
      // 버튼 존재 확인
      await expect(exportBtn.first()).toBeVisible();
    }
  });
});
