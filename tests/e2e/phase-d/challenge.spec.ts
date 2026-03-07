import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase D - 챌린지", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
  });

  test("챌린지 배너 및 랭킹 시트", async ({ page }) => {
    const banner = page.getByText("이번 주 챌린지");
    await expect(banner.first()).toBeVisible();
    await banner.first().click();

    await expect(page.getByText("챌린지 랭킹")).toBeVisible();
    await expect(page.getByLabel("챌린지 랭킹 닫기").first()).toBeVisible();
  });
});
