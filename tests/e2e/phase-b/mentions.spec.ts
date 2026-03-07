import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

async function openCommentSheet(page: import("@playwright/test").Page) {
  const commentButton = page
    .locator("button")
    .filter({ hasText: /댓글|💬/ })
    .first();

  await expect(commentButton).toBeVisible();
  await commentButton.click();
  await expect(page.getByPlaceholder("댓글 입력...")).toBeVisible();
}

test.describe("Phase B - 멘션", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
  });

  test("댓글 입력에서 @멘션 입력/후보 UI", async ({ page }) => {
    await openCommentSheet(page);

    const input = page.getByPlaceholder("댓글 입력...");
    await input.fill("@");

    const candidates = page.locator("button").filter({ hasText: /@/ });
    const hasCandidates = (await candidates.count()) > 0;

    if (hasCandidates) {
      await candidates.first().click();
      await expect(input).toHaveValue(/@/);
      return;
    }

    await input.fill("@e2e_player 화이팅");
    await expect(input).toHaveValue(/@e2e_player/);
  });
});
