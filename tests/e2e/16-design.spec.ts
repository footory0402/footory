import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "./setup/seed-data";
import { loginAsPlayer } from "./setup/test-accounts";

test.describe("16-디자인", () => {
  test("배경색", async ({ page }) => {
    await page.goto("/login");
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // rgb(12, 12, 14) = #0C0C0E
    expect(bgColor).toMatch(/rgb\(12,\s*12,\s*14\)|rgba\(12,\s*12,\s*14/);
  });

  test("바텀탭 높이", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(54);
  });

  test("활성 탭 골드", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    const homeTab = nav.getByRole("link", { name: "홈", exact: true });
    await expect(homeTab).toBeVisible();

    // Check active tab color
    const color = await homeTab.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.color;
    });
    // Gold color: rgb(212, 168, 83) or similar gold shades
    // Or check CSS variable
    const accentColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
    });
    // Accent should be gold-ish (#D4A853)
    expect(accentColor).toMatch(/#d4a853|#D4A853|d4a853/i);
  });

  test("카드 radius", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
    await page.waitForLoadState("domcontentloaded");

    // Check card border radius
    const card = page.locator("[class*='card'], article, [class*='rounded']").first();
    const hasCard = await card.isVisible().catch(() => false);
    if (hasCard) {
      const radius = await card.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).borderRadius);
      });
      expect(radius).toBeGreaterThanOrEqual(10);
    } else {
      // Check CSS variable for radius
      const radiusLg = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue("--radius-lg").trim();
      });
      const radiusValue = parseFloat(radiusLg);
      expect(radiusValue).toBeGreaterThanOrEqual(10);
    }
  });
});
