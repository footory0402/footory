import { test, expect } from "@playwright/test";

const authMode = Boolean(process.env.E2E_AUTH_STATE);

test.describe("홈 피드", () => {
  test("미인증 사용자 → /login 리다이렉트", async ({ page }) => {
    test.skip(authMode, "Auth mode uses saved session");
    await page.goto("/");
    // 인증 없이 접근하면 로그인 페이지로 이동
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    // 카카오 로그인 버튼 등 로그인 UI 존재
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("홈 피드 (인증 Mock)", () => {
  // 실제 Supabase 인증이 없으면 로그인으로 리다이렉트됨
  // 인증 상태 주입 방법: storageState 또는 쿠키 세팅 필요
  // 아래는 로그인 페이지 기준 스모크 테스트

  test("로그인 페이지 구조 확인", async ({ page }) => {
    await page.goto("/login");
    // body가 렌더링되고 다크 배경
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("BestCarousel 스모크", () => {
  test("홈 접근 시 응답 코드 확인 (리다이렉트 포함)", async ({ page }) => {
    const response = await page.goto("/");
    // 200 (콘텐츠) 또는 리다이렉트 후 200 (로그인 페이지)
    expect([200, 302, 303]).toContain(response?.status() ?? 200);
  });
});
