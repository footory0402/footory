import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  const link = nav.getByRole("link", { name: label, exact: true });
  await link.click({ force: true });
}

test.describe("시나리오 - 신규 선수 여정", () => {
  test("홈 → 탐색 → 업로드 → DM → 프로필", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");

    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();

    await page.getByRole("button", { name: "검색" }).click();
    await expect(page.getByPlaceholder("선수, 팀, 태그 검색")).toBeVisible();
    await page.keyboard.press("Escape");

    await clickTab(page, "MVP");
    await expect(page).toHaveURL(/\/mvp/);
    await expect(page.getByText("주간 MVP")).toBeVisible();

    await clickTab(page, "홈");
    await expect(page).toHaveURL("/");

    await clickTab(page, "DM");
    await expect(page).toHaveURL(/\/dm/);
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible();

    await clickTab(page, "프로필");
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("button", { name: "PDF 내보내기" })).toBeVisible();

    await page.getByRole("button", { name: /🏷스킬|스킬/ }).click();
    await page.getByRole("link", { name: "영상 추가" }).click();
    await expect(page.getByText("영상 업로드")).toBeVisible();
  });
});
