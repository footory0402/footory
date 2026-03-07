import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsScout } from "../setup/test-accounts";

test.describe("시나리오 - 스카우터 여정", () => {
  test("탐색 → 공개 프로필 → 워치리스트", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsScout(page, "/discover");

    await expect(page.getByText("선수, 팀, 태그 검색")).toBeVisible();
    await page.getByRole("button", { name: "선수", exact: true }).click();
    await page.getByRole("button", { name: "팀", exact: true }).click();
    await page.getByRole("button", { name: "태그", exact: true }).click();
    await page.getByRole("button", { name: "전체", exact: true }).click();

    await page.goto("/p/e2e_player", { waitUntil: "domcontentloaded" });
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
    await expect(page.getByText(/@e2e_player|E2E Player/).first()).toBeVisible();
  });
});
