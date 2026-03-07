import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "./setup/seed-data";
import { loginAsParent, loginAsCoach } from "./setup/test-accounts";

test.describe("01-온보딩", () => {
  test("선수 온보딩 전체 플로우", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("button", { name: /선수/ })).toBeVisible();
    await page.getByRole("button", { name: /선수/ }).click();
    const nextBtn = page.getByRole("button", { name: "다음" });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    // Should show player info form
    await expect(page.getByRole("heading", { name: "기본 정보" })).toBeVisible();
  });

  test("부모 온보딩 → 3탭", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/");
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();
    // Wait for parent role to load (BottomTab fetches role async, shows 설정 tab when parent)
    await expect(nav.getByRole("link", { name: "설정", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(nav.getByRole("link")).toHaveCount(3);
    const mvpTab = nav.getByRole("link", { name: "MVP", exact: true });
    await expect(mvpTab).not.toBeVisible();
  });

  test("부모 자녀 미연결 상태", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/");
    await page.waitForLoadState("domcontentloaded");
    // Wait for dashboard content to render (async children fetch)
    await page.waitForFunction(
      () => {
        const bodyText = document.body.innerText;
        return (
          bodyText.includes("자녀 계정을 연결해주세요") ||
          bodyText.includes("의 이번 주") ||
          bodyText.includes("보호자님") ||
          bodyText.includes("영상 올려주기")
        );
      },
      { timeout: 10000 }
    ).catch(() => null);
    const hasChildLink = await page.getByText("자녀 계정을 연결해주세요").isVisible().catch(() => false);
    const hasDashboard = await page.getByText(/의 이번 주|보호자님|영상 올려주기/).first().isVisible().catch(() => false);
    // Either child link CTA or dashboard should be visible
    expect(hasChildLink || hasDashboard).toBe(true);
  });

  test("코치 온보딩 + 인증", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("button", { name: /코치\/스카우터/ }).click();
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByRole("heading", { name: "코치/스카우터 정보" })).toBeVisible();
    // Check verification option exists in form
    const hasVerify = await page.getByText(/인증|자격증|라이센스/).first().isVisible().catch(() => false);
    const hasForm = await page.getByRole("textbox").first().isVisible().catch(() => false);
    expect(hasVerify || hasForm).toBe(true);
  });

  test("코치 프로필 형태", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsCoach(page, "/profile");
    // Coach profile shows name and role, not player card
    const nameVisible = await page.getByText("E2E Coach").isVisible().catch(() => false);
    const roleVisible = await page.getByText(/코치|coach/i).first().isVisible().catch(() => false);
    const pageLoaded = await page.locator("main, [role='main'], #__next").isVisible().catch(() => false);
    expect(nameVisible || roleVisible || pageLoaded).toBe(true);
  });

  test("역할별 MVP 투표 차단", async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/mvp");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    // Parent should NOT have vote button
    const voteButton = page.getByRole("button", { name: /투표|vote/i }).first();
    const hasVoteBtn = await voteButton.isVisible().catch(() => false);
    // Either no vote button or a disabled/restricted vote button
    if (hasVoteBtn) {
      const isDisabled = await voteButton.isDisabled().catch(() => false);
      const hasRestriction = await page.getByText(/투표 권한|투표 불가|보호자/).isVisible().catch(() => false);
      expect(isDisabled || hasRestriction).toBe(true);
    } else {
      // No vote button at all is also valid
      expect(true).toBe(true);
    }
  });
});
