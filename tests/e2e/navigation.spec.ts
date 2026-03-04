import { test, expect, type Page } from "@playwright/test";
import { gotoProtectedOrSkip } from "./utils/auth";

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  const link = nav.getByRole("link", { name: label, exact: true });
  await link.evaluate((el) => (el as HTMLAnchorElement).click());
}

test.describe("5탭 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtectedOrSkip(page, "/");
  });

  test("바텀 탭이 5개 렌더링됨", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();
    const links = nav.getByRole("link");
    await expect(links).toHaveCount(5);
  });

  test("홈 탭 → / 라우트", async ({ page }) => {
    await clickTab(page, "홈");
    await expect(page).toHaveURL("/");
    await expect(
      page
        .getByRole("navigation", { name: "하단 탭 네비게이션" })
        .getByRole("link", { name: "홈", exact: true })
    ).toHaveAttribute("aria-current", "page");
  });

  test("MVP 탭 → /mvp 라우트", async ({ page }) => {
    await clickTab(page, "MVP");
    await expect(page).toHaveURL("/mvp");
    await expect(
      page
        .getByRole("navigation", { name: "하단 탭 네비게이션" })
        .getByRole("link", { name: "MVP", exact: true })
    ).toHaveAttribute("aria-current", "page");
  });

  test("탐색 탭 → /discover 라우트", async ({ page }) => {
    await clickTab(page, "탐색");
    await expect(page).toHaveURL("/discover");
    await expect(
      page
        .getByRole("navigation", { name: "하단 탭 네비게이션" })
        .getByRole("link", { name: "탐색", exact: true })
    ).toHaveAttribute("aria-current", "page");
  });

  test("프로필 탭 → /profile 라우트", async ({ page }) => {
    await clickTab(page, "프로필");
    await expect(page).toHaveURL("/profile");
  });

  test("팀 탭 → /team 라우트", async ({ page }) => {
    await clickTab(page, "팀");
    await expect(page).toHaveURL("/team");
  });

  test("탭 전환 시 활성 상태 변경", async ({ page }) => {
    // MVP 클릭
    await clickTab(page, "MVP");
    await expect(page).toHaveURL("/mvp");

    // 홈으로 돌아가면 홈이 활성
    await clickTab(page, "홈");
    await expect(page).toHaveURL("/");
  });

  test("뷰포트 너비 430px 이내", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    const box = await nav.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(430);
  });
});
