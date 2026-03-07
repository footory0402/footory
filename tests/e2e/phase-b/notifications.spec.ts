import { test, expect } from "@playwright/test";
import { gotoProtectedOrSkip } from "../utils/auth";

test.describe("Phase B - 알림", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtectedOrSkip(page, "/notifications");
  });

  test("알림 센터 렌더링", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "알림" })).toBeVisible();

    const hasEmpty = await page.getByText("아직 알림이 없습니다").isVisible().catch(() => false);
    if (!hasEmpty) {
      await expect(page.locator("button").filter({ hasText: /님|분 전|시간 전/ }).first()).toBeVisible();
    }
  });

  test("알림 설정 진입", async ({ page }) => {
    const pageHeaderButtons = page.locator(".sticky").last().locator("button");
    await pageHeaderButtons.nth(1).click();

    await expect(page.getByRole("heading", { name: "알림 설정" })).toBeVisible();
    await expect(page.getByText("조용한 시간")).toBeVisible();
    await expect(page.getByText("카테고리별 설정")).toBeVisible();
  });
});
