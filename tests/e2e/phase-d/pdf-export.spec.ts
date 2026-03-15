import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("Phase D - PDF 내보내기", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/profile");
  });

  test("PDF 옵션 시트 열기", async ({ page }) => {
    await page.getByRole("button", { name: "PDF 내보내기" }).click();

    await expect(page.getByRole("heading", { name: "프로필 내보내기 (PDF)" })).toBeVisible();
    await expect(page.getByText("기본 정보 (사진, 이름, 포지션, 신체)")).toBeVisible();
    await expect(page.getByRole("button", { name: "PDF 생성" })).toBeVisible();
  });

  test("PDF 다운로드 시작", async ({ page }) => {
    await page.getByRole("button", { name: "PDF 내보내기" }).click();

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.getByRole("button", { name: "PDF 생성" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("e2e_player_profile.pdf");
  });
});
