import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase D - 성장 타임라인", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/profile");
  });

  test("기록 탭 타임라인 섹션 표시", async ({ page }) => {
    await page.getByRole("button", { name: /기록/ }).click();
    await expect(page.getByText("성장 타임라인")).toBeVisible();

    const empty = page.getByText("아직 기록된 성장 이벤트가 없습니다");
    const hasEmpty = await empty.isVisible().catch(() => false);
    if (!hasEmpty) {
      await expect(page.locator("div").filter({ hasText: /전|\./ }).first()).toBeVisible();
    }
  });
});
