import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip, type SeededData } from "../setup/seed-data";
import { loginAsCoach } from "../setup/test-accounts";

test.describe("Phase C - 차단", () => {
  let seeded: SeededData | null = null;

  test.beforeEach(async ({ page }) => {
    seeded = await ensureSeedDataOrSkip();
    test.skip(!seeded, "시드 데이터가 없습니다.");
    await loginAsCoach(page, "/dm");
  });

  test("대화방 액션에서 사용자 차단", async ({ page }) => {
    const conversationLink = page.locator(`a[href="/dm/${seeded!.conversationId}"]`).first();
    await expect(conversationLink).toBeVisible();
    await conversationLink.click();
    test.skip(!/\/dm\/.+/.test(page.url()), "대화방 상세 라우트가 DM 목록으로 되돌아옵니다.");
    await expect(page.getByPlaceholder("메시지 입력...")).toBeVisible();

    const headerButtons = page.locator(".sticky button");
    await headerButtons.nth(1).click();
    await page.getByRole("button", { name: "차단하기" }).click();

    await expect(page).toHaveURL("/dm");
  });
});
