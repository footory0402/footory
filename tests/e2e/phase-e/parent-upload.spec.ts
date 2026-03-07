import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsParent } from "../setup/test-accounts";

test.describe("Phase E - 부모 대신 업로드", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/");
  });

  test("빠른 업로드 모달 진입", async ({ page }) => {
    const quickUpload = page.getByRole("button", { name: "영상 올려주기" }).first();
    await expect(quickUpload).toBeVisible();
    await quickUpload.click();

    await expect(page.getByText(/에게 영상 올리기/)).toBeVisible();
    await expect(page.getByText("영상 선택")).toBeVisible();
    await expect(page.getByText("태그 선택")).toBeVisible();
    await expect(page.getByText("완료")).toBeVisible();
  });
});
