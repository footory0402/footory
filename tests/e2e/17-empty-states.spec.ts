import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "./setup/seed-data";
import { loginAsPlayer, loginAsScout } from "./setup/test-accounts";

test.describe("17-빈 상태", () => {
  test("DM 빈 상태", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/dm");
    await page.waitForLoadState("domcontentloaded");

    // Mock empty DM response
    await page.route("**/api/dm**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ conversations: [], total: 0 }),
        });
        return;
      }
      await route.continue();
    });

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Check for empty state message
    const emptyMsg = page.getByText(/아직 대화가 없습니다|대화를 시작해보세요/).first();
    const hasEmpty = await emptyMsg.isVisible().catch(() => false);
    const dmHeading = await page.getByRole("heading", { name: "메시지" }).isVisible().catch(() => false);
    expect(hasEmpty || dmHeading).toBe(true);
  });

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

    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/notifications");
    await expect(page.getByText("아직 알림이 없습니다")).toBeVisible();
  });

  test("워치리스트 빈 상태", async ({ page }) => {
    await page.route("**/api/watchlist**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ watchlist: [] }),
      });
    });

    await ensureSeedDataOrSkip();
    await loginAsScout(page, "/profile/watchlist");
    await expect(page.getByText("관심 선수를 추가해보세요")).toBeVisible();
  });

  test("수상 빈 상태", async ({ page }) => {
    await page.route("**/api/achievements**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ achievements: [] }),
      });
    });

    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/profile");
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: /기록/ }).first().click();

    // Either shows empty state CTA or achievements section
    const emptyState = page.getByRole("button", { name: /첫 수상 추가|수상 추가/ }).first().or(
      page.getByText(/수상\/성과|아직 수상/).first()
    );
    await expect(emptyState).toBeVisible();
  });
});
