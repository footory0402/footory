import { test, expect } from "@playwright/test";
import { gotoProtectedOrSkip } from "../utils/auth";

test.describe("Phase A - 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtectedOrSkip(page, "/");
  });

  test("헤더 검색 버튼으로 오버레이 열고 닫기", async ({ page }) => {
    await page.getByRole("button", { name: "검색" }).click();
    await expect(page.getByPlaceholder("선수, 팀, 태그 검색")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("선수, 팀, 태그 검색")).not.toBeVisible();
  });

  test("헤더 알림 버튼으로 알림 센터 이동", async ({ page }) => {
    await page.locator('a[href="/notifications"]').last().click();
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.getByRole("heading", { name: "알림" })).toBeVisible();
  });

  test("하단 탭 3개 또는 5개 렌더링", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();

    const count = await nav.getByRole("link").count();
    expect([3, 5]).toContain(count);

    await expect(nav.getByRole("link", { name: "홈", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "DM", exact: true })).toBeVisible();
  });
});
