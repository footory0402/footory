import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase D - 퀘스트", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
  });

  test("퀘스트 카드 표시 또는 완료 상태", async ({ page }) => {
    const questHeader = page.getByText("퀘스트");
    const hasQuestCard = await questHeader.isVisible().catch(() => false);

    if (!hasQuestCard) {
      await expect(page.getByRole("button", { name: "참여하기 →" }).first()).toBeVisible();
      return;
    }

    await expect(questHeader).toBeVisible();
    await expect(page.getByRole("button", { name: "초보자" })).toBeVisible();
    await expect(page.getByRole("button", { name: "주간" })).toBeVisible();
  });
});
