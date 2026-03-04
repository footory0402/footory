import { test, expect } from "@playwright/test";

const authMode = Boolean(process.env.E2E_AUTH_STATE);

test.describe("프로필 페이지", () => {
  test("미인증 시 /profile → 로그인 리다이렉트", async ({ page }) => {
    test.skip(authMode, "Auth mode uses saved session");
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("공개 프로필 URL 구조 확인 (/p/[handle])", async ({ page }) => {
    // 존재하지 않는 핸들은 404 또는 오류 UI
    const response = await page.goto("/p/nonexistent-handle-12345");
    const status = response?.status() ?? 200;
    // 404 또는 200 (빈 상태) 모두 허용
    expect([200, 404]).toContain(status);
  });

  test("공개 프로필 페이지 기본 구조", async ({ page }) => {
    await page.goto("/p/nonexistent-handle-12345");
    // 페이지가 크래시 없이 렌더링됨
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("팀 상세 페이지", () => {
  test("존재하지 않는 팀 ID → 오류 없이 렌더링", async ({ page }) => {
    const response = await page.goto("/team/nonexistent-team-id");
    const status = response?.status() ?? 200;
    expect([200, 404]).toContain(status);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("온보딩 페이지", () => {
  test("/onboarding 접근 가능", async ({ page }) => {
    await page.goto("/onboarding");
    // 미인증이면 리다이렉트, 인증이면 온보딩 UI
    const url = page.url();
    expect(url).toMatch(/\/(onboarding|login)/);
  });
});
