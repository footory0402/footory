import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsParent } from "../setup/test-accounts";

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  const link = nav.getByRole("link", { name: label, exact: true });
  await link.click({ force: true });
}

test.describe("시나리오 - 부모 여정", () => {
  test("부모 홈 → DM → 설정", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/");

    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav.getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "영상 올려주기" }).first()).toBeVisible();

    await page.getByRole("button", { name: "영상 올려주기" }).first().click();
    await expect(page.getByText(/에게 영상 올리기/)).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();

    await clickTab(page, "DM");
    await expect(page).toHaveURL(/\/dm/);
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible();

    await clickTab(page, "설정");
    await expect(page).toHaveURL(/\/profile\/settings/);
    await expect(page.getByText("알림 설정")).toBeVisible();

    await clickTab(page, "홈");
    await expect(page).toHaveURL("/");
  });
});
