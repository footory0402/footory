import { test, expect, type Page } from "@playwright/test";
import { gotoProtectedOrSkip } from "./utils/auth";

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  const link = nav.getByRole("link", { name: label, exact: true });
  await link.dispatchEvent("click");
}

async function hasTab(page: Page, label: string): Promise<boolean> {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  return (await nav.getByRole("link", { name: label, exact: true }).count()) > 0;
}

test.describe("역할별 하단 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtectedOrSkip(page, "/");
  });

  test("역할별 탭 구성 렌더링", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();
    const links = nav.getByRole("link");

    const isParent = await hasTab(page, "설정");
    if (isParent) {
      await expect(links).toHaveCount(3);
      await expect(nav.getByRole("link", { name: "홈", exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: "DM", exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: "설정", exact: true })).toBeVisible();
      return;
    }

    await expect(links).toHaveCount(5);
    await expect(nav.getByRole("link", { name: "홈", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "MVP", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "DM", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "프로필", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "팀", exact: true })).toBeVisible();
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

  test("MVP 탭 → /mvp 라우트 (선수/코치)", async ({ page }) => {
    test.skip(await hasTab(page, "설정"), "부모 역할에는 MVP 탭이 없습니다.");

    await clickTab(page, "MVP");
    await expect(page).toHaveURL("/mvp");
    await expect(
      page
        .getByRole("navigation", { name: "하단 탭 네비게이션" })
        .getByRole("link", { name: "MVP", exact: true })
    ).toHaveAttribute("aria-current", "page");
  });

  test("DM 탭 → /dm 라우트", async ({ page }) => {
    await clickTab(page, "DM");
    await expect(page).toHaveURL("/dm");
    await expect(
      page
        .getByRole("navigation", { name: "하단 탭 네비게이션" })
        .getByRole("link", { name: "DM", exact: true })
    ).toHaveAttribute("aria-current", "page");
  });

  test("프로필 탭 → /profile 라우트 (선수/코치)", async ({ page }) => {
    test.skip(await hasTab(page, "설정"), "부모 역할은 설정 탭을 사용합니다.");

    await clickTab(page, "프로필");
    await expect(page).toHaveURL("/profile");
  });

  test("팀 탭 → /team 라우트 (선수/코치)", async ({ page }) => {
    test.skip(await hasTab(page, "설정"), "부모 역할에는 팀 탭이 없습니다.");

    await clickTab(page, "팀");
    await expect(page).toHaveURL("/team");
  });

  test("탭 전환 시 활성 상태 변경", async ({ page }) => {
    const isParent = await hasTab(page, "설정");
    if (isParent) {
      await clickTab(page, "설정");
      await expect(page).toHaveURL("/profile/settings");
      await clickTab(page, "홈");
      await expect(page).toHaveURL("/");
      return;
    }

    await clickTab(page, "MVP");
    await expect(page).toHaveURL("/mvp");
    await clickTab(page, "홈");
    await expect(page).toHaveURL("/");
  });

  test("뷰포트 너비 430px 이내", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    const box = await nav.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(430);
  });
});
