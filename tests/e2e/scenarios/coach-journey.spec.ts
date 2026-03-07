import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip, type SeededData } from "../setup/seed-data";
import { loginAsCoach } from "../setup/test-accounts";

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  const link = nav.getByRole("link", { name: label, exact: true });
  await link.click({ force: true });
}

test.describe("시나리오 - 코치 여정", () => {
  test("코치 홈 → 팀 → DM", async ({ page }) => {
    const seeded: SeededData | null = await ensureSeedDataOrSkip();
    await loginAsCoach(page, "/");

    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav.getByRole("link")).toHaveCount(5);

    await clickTab(page, "MVP");
    await expect(page).toHaveURL(/\/mvp/);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("주간 MVP")).toBeVisible();

    await clickTab(page, "홈");
    await expect(page).toHaveURL("/");

    await clickTab(page, "팀");
    await expect(page).toHaveURL(/\/team/);
    await expect(page.getByText(/내 팀|아직 팀이 없어요/)).toBeVisible();

    await clickTab(page, "DM");
    await expect(page).toHaveURL(/\/dm/);
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible();

    test.skip(!seeded, "시드 데이터가 없습니다.");
    const conversationLink = page.locator(`a[href="/dm/${seeded!.conversationId}"]`).first();
    await expect(conversationLink).toBeVisible();
    await conversationLink.click();
    await expect(page.getByPlaceholder("메시지 입력...")).toBeVisible();
  });
});
