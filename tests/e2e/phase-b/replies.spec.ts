import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

async function openCommentSheet(page: Page) {
  const commentButton = page
    .locator("button")
    .filter({ hasText: /댓글|💬/ })
    .first();

  await expect(commentButton).toBeVisible();
  await commentButton.click();
  await expect(page.getByPlaceholder("댓글 입력...")).toBeVisible();
}

test.describe("Phase B - 대댓글", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
  });

  test("답글달기 진입과 입력 상태 전환", async ({ page }) => {
    await openCommentSheet(page);

    const replyButton = page.getByRole("button", { name: "답글달기" }).first();
    await expect(replyButton).toBeVisible();

    await replyButton.click();
    await expect(page.getByText(/에게 답글/)).toBeVisible();

    const replyInput = page.getByPlaceholder(/답글/);
    await replyInput.fill("좋은 플레이네요!");
    await page.getByRole("button", { name: "전송" }).click();

    await expect(page.getByPlaceholder("댓글 입력...")).toBeVisible();
  });
});
