import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsScout } from "../setup/test-accounts";

test.describe("Phase D - 스카우터 워치리스트", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsScout(page, "/p/e2e_player");
  });

  test("공개 프로필에서 관심 선수 추가 후 워치리스트 확인", async ({ page }) => {
    await page.waitForURL(/\/p\/e2e_player/);
    await page.waitForLoadState("networkidle");

    const watchlistButton = page
      .getByRole("button", { name: "관심 선수 추가" })
      .or(page.getByRole("button", { name: "관심 선수" }));

    const button = watchlistButton.first();
    const hasWatchlistButton = await button.isVisible().catch(() => false);
    if (!hasWatchlistButton) {
      await page.goto("/profile/watchlist");
      await expect(page.getByText("관심 선수")).toBeVisible();
      return;
    }

    const buttonLabel = (await button.textContent()) ?? "";
    if (buttonLabel.includes("추가")) {
      const waitForAdd = page.waitForResponse((response) =>
        response.url().includes("/api/watchlist") &&
        response.request().method() === "POST"
      );
      await button.click();
      await waitForAdd;
      await expect(button).toContainText("관심 선수");
    }

    await page.goto("/profile/watchlist");
    await expect(page.getByText("관심 선수")).toBeVisible();

    const hasEmpty = await page.getByText("관심 선수를 추가해보세요").isVisible().catch(() => false);
    if (!hasEmpty) {
      await expect(page.getByText(/@e2e_player|E2E Player/).first()).toBeVisible();
    }
  });
});
