import { test, expect } from "@playwright/test";
import { gotoProtectedOrSkip } from "../utils/auth";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsScout } from "../setup/test-accounts";

test.describe("디자인 - 빈 상태", () => {
  test("알림 빈 상태", async ({ page }) => {
    await page.route("**/api/notifications**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [], hasMore: false, nextCursor: null }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await gotoProtectedOrSkip(page, "/notifications");
    await expect(page.getByText("아직 알림이 없습니다")).toBeVisible();
  });

  test("검색 결과 없음 상태", async ({ page }) => {
    await page.route("**/api/discover/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ players: [], teams: [] }),
      });
    });

    await gotoProtectedOrSkip(page, "/discover");
    await page.getByText("선수, 팀, 태그 검색").click();
    await page.getByPlaceholder("선수, 팀, 태그 검색").fill("zzzz-no-result-query");
    await page.waitForTimeout(400);

    await expect(page.getByText("검색 결과가 없어요")).toBeVisible();
  });

  test("워치리스트 빈 상태", async ({ page }) => {
    await ensureSeedDataOrSkip();

    await page.route("**/api/watchlist", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ watchlist: [] }),
      });
    });

    await loginAsScout(page, "/profile/watchlist");
    await expect(page.getByText("관심 선수를 추가해보세요")).toBeVisible();
  });
});
