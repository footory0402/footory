import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase B - 공유", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
  });

  test("피드 카드 공유 시트 4개 액션", async ({ page }) => {
    const shareButton = page.getByLabel("공유").first();
    await expect(shareButton).toBeVisible();

    await shareButton.click();

    await expect(page.getByText("공유")).toBeVisible();
    await expect(page.getByRole("button", { name: "DM으로 보내기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카카오톡" })).toBeVisible();
    await expect(page.getByRole("button", { name: "인스타 스토리" })).toBeVisible();
    await expect(page.getByRole("button", { name: "링크 복사" })).toBeVisible();
  });
});
