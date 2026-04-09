import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsParent } from "../setup/test-accounts";

const FIXTURE_VIDEO = path.resolve(process.cwd(), "tests/fixtures/videos/test1.mp4");

async function openQuickUpload(page: Page) {
  const quickUpload = page.getByRole("button", { name: "영상 올려주기" }).first();
  await expect(quickUpload).toBeVisible();
  await quickUpload.click();
  await expect(page.getByText(/에게 영상 올리기/)).toBeVisible();
}

async function prepareToSubmit(page: Page) {
  await page.locator('input[type="file"]').first().setInputFiles(FIXTURE_VIDEO);
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: /슈팅|드리블|패스|스페셜/ }).first().click();
  await expect(page.getByRole("button", { name: "업로드" })).toBeEnabled();
}

test.describe("Phase E - 부모 대신 업로드", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsParent(page, "/");
    test.skip(!fs.existsSync(FIXTURE_VIDEO), `영상 파일을 찾을 수 없습니다: ${FIXTURE_VIDEO}`);
  });

  test("빠른 업로드 모달 진입", async ({ page }) => {
    await openQuickUpload(page);
    await expect(page.getByText("영상 선택")).toBeVisible();
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
  });

  test("부모 업로드 성공 시 완료 화면을 본다", async ({ page, baseURL }) => {
    const clipId = "clip-parent-success";
    const uploadUrl = `${baseURL}/__e2e__/parent-upload-target`;

    await page.route("**/api/upload/presign", async (route) => {
      const body = route.request().postDataJSON() as { type?: string };
      const isThumb = body?.type === "thumbnail";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: uploadUrl,
          key: isThumb ? `thumbs/${clipId}.jpg` : `originals/${clipId}.mp4`,
          clipId,
        }),
      });
    });

    await page.route("**/__e2e__/parent-upload-target", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/api/parent/upload", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ clip: { id: clipId } }),
      });
    });

    await openQuickUpload(page);
    await prepareToSubmit(page);
    await page.getByRole("button", { name: "업로드" }).click();

    await expect(page.getByText("업로드 완료!")).toBeVisible();
    await page.getByRole("button", { name: "확인" }).click();
    await expect(page.getByText(/에게 영상 올리기/)).not.toBeVisible();
  });

  test("부모 업로드 저장 실패 시 오류를 보여준다", async ({ page, baseURL }) => {
    const clipId = "clip-parent-fail";
    const uploadUrl = `${baseURL}/__e2e__/parent-upload-target-fail`;

    await page.route("**/api/upload/presign", async (route) => {
      const body = route.request().postDataJSON() as { type?: string };
      const isThumb = body?.type === "thumbnail";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: uploadUrl,
          key: isThumb ? `thumbs/${clipId}.jpg` : `originals/${clipId}.mp4`,
          clipId,
        }),
      });
    });

    await page.route("**/__e2e__/parent-upload-target-fail", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/api/parent/upload", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "클립 저장 실패(테스트)" }),
      });
    });

    await openQuickUpload(page);
    await prepareToSubmit(page);
    await page.getByRole("button", { name: "업로드" }).click();

    await expect(page.getByText("클립 저장 실패(테스트)")).toBeVisible();
  });

  test("부모 업로드 모달에서 취소할 수 있다", async ({ page }) => {
    await openQuickUpload(page);
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page.getByText(/에게 영상 올리기/)).not.toBeVisible();
  });
});
