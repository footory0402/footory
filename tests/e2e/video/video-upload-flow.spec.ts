import { expect, test, type Page } from "@playwright/test";
import {
  installMockVideoFlow,
  openUpload,
  selectFixtureVideo,
  uploadFixtureAndOpenEditor,
} from "./video-test-helpers";

async function dismissGuideIfVisible(page: Page) {
  const dismissCandidates = [
    page.getByRole("button", { name: "닫기" }),
    page.getByRole("button", { name: "다시 보지 않기" }),
    page.getByRole("button", { name: "건너뛰기" }),
  ];

  for (const button of dismissCandidates) {
    if (await button.isVisible().catch(() => false)) {
      await button.evaluate((element) => {
        (element as HTMLButtonElement).click();
      });
      return;
    }
  }
}

async function applySingleClipDraftChanges(page: Page) {
  await dismissGuideIfVisible(page);
  await page.getByTestId("single-clip-pick-toggle").click();
  await expect
    .poll(() =>
      page.locator("video").first().evaluate((element) => {
        const video = element as HTMLVideoElement;
        return video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0;
      }),
    )
    .toBe(true);
  await page.getByTestId("single-clip-focus-target").click({
    force: true,
    position: { x: 120, y: 72 },
  });
  await expect(page.getByText("주인공 선택됨")).toBeVisible();
  await expect(page.getByTestId("single-clip-zoom-preset-0")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("single-clip-freeze-value")).toHaveText("0:00");
  await page.getByTestId("single-clip-lower-third-toggle").click();
  await expect(page.getByTestId("single-clip-lower-third-toggle")).toHaveAttribute("aria-pressed", "false");
}

async function expectRestoredDraft(page: Page) {
  await dismissGuideIfVisible(page);
  await expect(page.getByText("영상 편집")).toBeVisible();
  await expect(page.getByTestId("single-clip-editor")).toBeVisible();
  await expect(page.getByText("주인공 선택됨")).toBeVisible();
  await expect(page.getByTestId("single-clip-zoom-preset-0")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("single-clip-freeze-value")).toHaveText("0:00");
  await expect(page.getByTestId("single-clip-lower-third-toggle")).toHaveAttribute("aria-pressed", "false");
}

test.describe("영상 핵심 플로우", () => {
  test("업로드 뒤 바로 편집에 들어갈 수 있다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context());

    await uploadFixtureAndOpenEditor(page);

    await expect(page).toHaveURL(/\/upload(?:\?.*)?$/);
    await expect(page.getByText("영상 편집")).toBeVisible();
    await expect(page.getByTestId("single-clip-editor")).toBeVisible();
    await expect(page.getByTestId("single-clip-pick-toggle")).toBeVisible();
    await expect(page.getByTestId("single-clip-profile-card-toggle")).toBeVisible();
    await expect(page.getByTestId("single-clip-lower-third-toggle")).toBeVisible();
  });

  test("편집 값을 바꾸면 draft가 저장되고 다시 들어와 복구할 수 있다", async ({ page, context }) => {
    const flow = await installMockVideoFlow(context);

    await uploadFixtureAndOpenEditor(page);
    await applySingleClipDraftChanges(page);

    await expect
      .poll(() => {
        const latestPayload = flow.getProjectPayloads().at(-1) as
          | {
              playback?: {
                trimStart?: number;
                freezeAt?: number | null;
                zoom?: number;
              };
              overlay?: {
                showLowerThird?: boolean;
              };
            }
          | undefined;
        if (!latestPayload?.playback) return null;
        return {
          trimStart: latestPayload.playback.trimStart ?? null,
          freezeAt: latestPayload.playback.freezeAt ?? null,
          zoom: latestPayload.playback.zoom ?? null,
          showLowerThird: latestPayload.overlay?.showLowerThird ?? null,
        };
      })
      .toEqual({
        trimStart: 0,
        freezeAt: 0,
        zoom: 1,
        showLowerThird: false,
      });

    const restoredPage = await context.newPage();
    await openUpload(restoredPage);

    await expect(restoredPage.getByText("최근 편집 이어서 하기")).toBeVisible();
    await restoredPage.getByRole("button", { name: /최근 편집 이어서 하기/ }).click();

    await expect(restoredPage).toHaveURL(/\/upload(?:\?.*)?$/);
    await expect(restoredPage.getByText("영상 편집")).toBeVisible();
    await expect(restoredPage.getByTestId("single-clip-editor")).toBeVisible();
    await expectRestoredDraft(restoredPage);
  });

  test("저장하면 프로필 대표 영상에 반영된다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context());

    await uploadFixtureAndOpenEditor(page);
    await page.getByRole("button", { name: "저장" }).click();

    await expect(page).toHaveURL(new RegExp(`/(profile|p/${flow.profileHandle})(?:\\?|$)`), {
      timeout: 20_000,
    });
    await expect.poll(() => flow.getFeatured().length).toBe(1);
  });
});

test.describe("영상 업로드 fixture smoke", () => {
  test("fixture 비디오로 업로드 선택 화면을 항상 열 수 있다", async ({ page }) => {
    await installMockVideoFlow(page.context());

    await openUpload(page);

    await expect(page.getByText("영상을 골라요")).toBeVisible();
    await expect(page.getByText(/MP4, MOV/i)).toBeVisible();

    await selectFixtureVideo(page);
    await expect(page.getByRole("button", { name: "영상 올리기" })).toBeVisible();
  });
});
