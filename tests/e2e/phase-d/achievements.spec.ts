import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase D - 수상/성과", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/profile");
  });

  test("기록 탭에서 수상/성과 섹션 렌더링", async ({ page }) => {
    await page.getByRole("button", { name: /기록/ }).click();
    await expect(page.getByText("수상/성과")).toBeVisible();
  });

  test("수상/성과 추가 시트 열기", async ({ page }) => {
    await page.getByRole("button", { name: /기록/ }).click();
    await page.getByRole("button", { name: "수상/성과 편집" }).click();

    await expect(page.getByRole("heading", { name: "수상/성과 추가" })).toBeVisible();
    await expect(page.getByText("대회명")).toBeVisible();
  });
});
