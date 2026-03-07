import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsParent } from "../setup/test-accounts";

test.describe("Phase E - 부모 대시보드", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/");
  });

  test("부모 홈 대시보드 또는 자녀 연결 유도", async ({ page }) => {
    const hasLinkPrompt = await page.getByText("자녀 계정을 연결해주세요").isVisible().catch(() => false);

    if (hasLinkPrompt) {
      await expect(page.getByRole("button", { name: "자녀 검색" })).toBeVisible();
      return;
    }

    await expect(page.getByText(/의 이번 주/)).toBeVisible();
    await expect(page.getByRole("link", { name: /프로필 보기/ })).toBeVisible();
  });

  test("부모 하단 탭 3개(홈/DM/설정)", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "홈", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "DM", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "설정", exact: true })).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(3);
  });
});
