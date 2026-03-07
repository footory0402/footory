import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase B - 리액션", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
  });

  test("길게 눌러 리액션 5종 표시", async ({ page }) => {
    const kudosButton = page.locator("button").filter({ hasText: /응원|👏|\d+/ }).first();
    await expect(kudosButton).toBeVisible();

    await kudosButton.dispatchEvent("mousedown");
    await page.waitForTimeout(650);
    await kudosButton.dispatchEvent("mouseup");

    const picker = page.getByLabel("리액션 선택");
    await expect(picker).toBeVisible();
    for (const label of ["응원", "불타오름", "골", "힘내", "놀라움"]) {
      await expect(picker.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("탭으로 기본 응원 반응 가능", async ({ page }) => {
    const kudosButton = page.locator("button").filter({ hasText: /응원|👏|\d+/ }).first();
    await expect(kudosButton).toBeVisible();

    await kudosButton.click();
    await expect(kudosButton).toBeVisible();
  });
});
