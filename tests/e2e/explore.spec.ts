import { test, expect } from "@playwright/test";
import { gotoProtectedOrSkip } from "./utils/auth";

test.describe("탐색 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtectedOrSkip(page, "/discover");
  });

  test("검색 바 렌더링", async ({ page }) => {
    const searchBar = page.getByText("선수, 팀, 태그 검색");
    await expect(searchBar).toBeVisible();
  });

  test("필터 탭 4개 렌더링 (전체/선수/팀/태그)", async ({ page }) => {
    for (const label of ["전체", "선수", "팀", "태그"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("필터 탭 전환 — 선수", async ({ page }) => {
    await page.getByRole("button", { name: "선수", exact: true }).click({ force: true });
    await expect(page.getByText("떠오르는 선수")).not.toBeVisible();
  });

  test("필터 탭 전환 — 팀", async ({ page }) => {
    await page.getByRole("button", { name: "팀", exact: true }).click({ force: true });
    await expect(page.getByText("떠오르는 선수")).not.toBeVisible();
  });

  test("필터 탭 전환 — 태그", async ({ page }) => {
    await page.getByRole("button", { name: "태그", exact: true }).click({ force: true });
    await expect(page.getByText("떠오르는 선수")).not.toBeVisible();
  });

  test("검색 오버레이 열기", async ({ page }) => {
    await page.getByText("선수, 팀, 태그 검색").click();
    // 오버레이가 열려야 함 (검색 입력 필드 등장)
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible({ timeout: 3000 });
  });

  test("검색 오버레이 닫기 (ESC)", async ({ page }) => {
    await page.getByText("선수, 팀, 태그 검색").click();
    await page.keyboard.press("Escape");
    // 오버레이가 닫히면 input이 사라짐
    await expect(page.getByRole("textbox")).not.toBeVisible({ timeout: 3000 });
  });

  test("전체 탭: 섹션 렌더링 확인", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    // "전체" 탭에서 "떠오르는 선수" 섹션 확인
    await expect(page.getByText("떠오르는 선수")).toBeVisible();
  });
});
