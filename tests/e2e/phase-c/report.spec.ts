import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip, type SeededData } from "../setup/seed-data";
import { loginAsCoach } from "../setup/test-accounts";

test.describe("Phase C - 신고", () => {
  let seeded: SeededData | null = null;

  test.beforeEach(async ({ page }) => {
    seeded = await ensureSeedDataOrSkip();
    test.skip(!seeded, "시드 데이터가 없습니다.");
    await loginAsCoach(page, "/dm");
  });

  test("대화방에서 신고 모달 제출", async ({ page }) => {
    const conversationLink = page.locator(`a[href="/dm/${seeded!.conversationId}"]`).first();
    await expect(conversationLink).toBeVisible();
    await conversationLink.click();
    test.skip(!/\/dm\/.+/.test(page.url()), "대화방 상세 라우트가 DM 목록으로 되돌아옵니다.");
    await expect(page).toHaveURL(/\/dm\//);

    const headerButtons = page.locator(".sticky button");
    await headerButtons.nth(1).click();
    await page.getByRole("button", { name: "신고하기" }).click();

    await expect(page.getByText("이 사용자를 신고하시겠어요?")).toBeVisible();
    await page.getByRole("button", { name: "괴롭힘/욕설" }).click();
    await page.getByRole("button", { name: "신고하기" }).click();

    await expect(page.getByText("신고가 접수되었습니다")).toBeVisible();
    await expect(page.getByRole("button", { name: "확인" })).toBeVisible();
  });
});
