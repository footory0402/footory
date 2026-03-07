import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase C - DM 요청", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/dm");
  });

  test("DM 요청 카드 표시/수락-거절 버튼", async ({ page }) => {
    const requestHeader = page.getByText(/DM 요청/);
    await expect(requestHeader.first()).toBeVisible();
    await expect(page.getByRole("button", { name: "거절" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "수락" }).first()).toBeVisible();
  });
});
