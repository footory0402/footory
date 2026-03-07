import { test, expect } from "@playwright/test";

test.describe("디자인 - 토큰 검증", () => {
  test("글로벌 컬러/폰트 CSS 변수", async ({ page }) => {
    await page.goto("/login");

    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        bg: style.getPropertyValue("--color-bg").trim().toLowerCase(),
        card: style.getPropertyValue("--color-card").trim().toLowerCase(),
        cardAlt: style.getPropertyValue("--color-card-alt").trim().toLowerCase(),
        accent: style.getPropertyValue("--color-accent").trim().toLowerCase(),
        text1: style.getPropertyValue("--color-text-1").trim().toLowerCase(),
        text2: style.getPropertyValue("--color-text-2").trim().toLowerCase(),
        text3: style.getPropertyValue("--color-text-3").trim().toLowerCase(),
        bodyFont: style.getPropertyValue("--font-body"),
        statFont: style.getPropertyValue("--font-stat"),
        radiusLg: style.getPropertyValue("--radius-lg").trim(),
        radiusXl: style.getPropertyValue("--radius-xl").trim(),
      };
    });

    expect(tokens.bg).toBe("#0c0c0e");
    expect(tokens.card).toBe("#161618");
    expect(tokens.cardAlt).toBe("#1e1e22");
    expect(tokens.accent).toBe("#d4a853");
    expect(tokens.text1).toBe("#fafafa");
    expect(tokens.text2).toBe("#a1a1aa");
    expect(tokens.text3).toBe("#71717a");
    expect(tokens.bodyFont).toContain("Noto Sans KR");
    expect(tokens.statFont).toContain("Oswald");
    expect(["10px", "12px", "14px"]).toContain(tokens.radiusLg);
    expect(tokens.radiusXl).toBe("14px");
  });

  test("모바일 뷰포트 430x932", async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(430);
    expect(viewport?.height).toBe(932);
  });
});
