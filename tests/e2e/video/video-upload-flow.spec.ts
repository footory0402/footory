import { test, expect, type Locator, type Page } from "@playwright/test";
import {
  installMockVideoFlow,
  openUpload,
  selectFixtureVideo,
  uploadFixtureAndOpenEditor,
} from "./video-test-helpers";

async function setRangeValue(locator: Locator, value: number) {
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, String(nextValue));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(locator).toHaveValue(String(value));
}

async function dismissGuideIfVisible(page: Page) {
  const dismissButton = page.getByRole("button", { name: "닫기" });
  if (await dismissButton.isVisible().catch(() => false)) {
    await dismissButton.click();
  }
}

async function applySingleClipDraftChanges(page: Page) {
  await dismissGuideIfVisible(page);
  const trimPanel = page.getByTestId("single-clip-trim-panel");
  await expect(trimPanel).toBeVisible();
  const previewSeek = page.getByLabel("편집 미리보기 이동");
  await setRangeValue(previewSeek, 1);
  await trimPanel.getByRole("button", { name: "지금 장면을 시작점으로" }).click();

  await page.getByRole("button", { name: /주인공/ }).click();
  await dismissGuideIfVisible(page);
  const spotlightPanel = page.getByTestId("single-clip-spotlight-panel");
  await expect(spotlightPanel).toBeVisible();
  await spotlightPanel.scrollIntoViewIfNeeded();
  await page.locator("video").first().click({ position: { x: 120, y: 72 } });
  await expect(spotlightPanel.getByText("정해짐")).toBeVisible();
  await setRangeValue(previewSeek, 2);
  await spotlightPanel.getByRole("button", { name: "지금 장면 고정" }).click();
  await expect(page.getByTestId("single-clip-freeze-value")).toHaveText("0:02");
  await page.getByTestId("single-clip-zoom-panel").getByRole("button", { name: /강하게/ }).click();

  await page.getByRole("button", { name: /정보/ }).click();
  await dismissGuideIfVisible(page);
  await page.getByRole("button", { name: /재생 중 하단 정보/ }).click();

  await page.getByRole("button", { name: /^4 저장$/ }).click();
  const savePanel = page.getByTestId("single-clip-save-panel");
  await expect(savePanel).toBeVisible();
  await savePanel.getByRole("button", { name: /대표 장면만 짧게 다시 보여주기/ }).click();
  await setRangeValue(previewSeek, 2);
  await savePanel.getByRole("button", { name: "지금 장면으로" }).nth(0).click();
  await setRangeValue(previewSeek, 4);
  await savePanel.getByRole("button", { name: "지금 장면으로" }).nth(1).click();
  await savePanel.getByRole("button", { name: /기술 묶음으로 저장/ }).click();
}

async function expectRestoredDraft(page: Page) {
  await dismissGuideIfVisible(page);
  await expect(page.getByTestId("single-clip-profile-card-toggle")).toHaveText("보임");
  await expect(page.getByTestId("single-clip-trim-panel").getByText("0:01")).toBeVisible();

  await page.getByRole("button", { name: /주인공/ }).click();
  await dismissGuideIfVisible(page);
  await expect(page.getByTestId("single-clip-spotlight-panel").getByText("정해짐")).toBeVisible();
  await expect(page.getByTestId("single-clip-freeze-value")).toHaveText("0:02");
  await page.getByRole("button", { name: /^4 저장$/ }).click();
  const savePanel = page.getByTestId("single-clip-save-panel");
  await expect(savePanel.getByText("0:02")).toBeVisible();
  await expect(savePanel.getByText("2.2x")).toBeVisible();
  await expect(savePanel.getByText("태그 고르기")).toBeVisible();
  await page.getByRole("button", { name: /정보/ }).click();
  await expect(page.getByTestId("single-clip-overlay-panel").getByText("선수 카드 보임")).toBeVisible();
  await expect(page.getByTestId("single-clip-overlay-panel").getByText("하단 정보 꺼짐")).toBeVisible();
}

test.describe("영상 핵심 플로우", () => {
  test("업로드 화면에서 프로필 카드를 먼저 편집하고 저장할 수 있다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context());

    await openUpload(page);
    await selectFixtureVideo(page);

    await expect(page.getByTestId("upload-profile-card-editor")).toBeVisible();
    await expect(page.getByRole("button", { name: "카드 저장" })).toBeVisible();

    await page.getByLabel("업로드 카드 이름").fill("민준");
    await page.getByLabel("업로드 카드 소속 팀").fill("분당 드림 FC");
    await page.getByLabel("업로드 카드 등번호").fill("11");
    await page.getByLabel("업로드 카드 포지션").selectOption("RW");
    await page.getByRole("button", { name: "Gilded" }).click();
    await page.getByRole("button", { name: "카드 저장" }).click();

    await expect(page.getByText("프로필 카드에 바로 저장했어요.")).toBeVisible();
    await expect
      .poll(() => {
        const latestBody = flow.getPlayerCardBodies().at(-1) as
          | {
              clubName?: string;
              mainColor?: string;
              cardData?: {
                name?: string;
                number?: string;
                position?: string;
              };
            }
          | undefined;

        if (!latestBody) return null;
        return {
          clubName: latestBody.clubName ?? null,
          mainColor: latestBody.mainColor ?? null,
          name: latestBody.cardData?.name ?? null,
          number: latestBody.cardData?.number ?? null,
          position: latestBody.cardData?.position ?? null,
        };
      })
      .toEqual({
        clubName: "분당 드림 FC",
        mainColor: "#5C2D00",
        name: "민준",
        number: "11",
        position: "RW",
      });
  });

  test("업로드 뒤 바로 편집에 들어갈 수 있다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context());

    await uploadFixtureAndOpenEditor(page);

    await expect(page).toHaveURL(new RegExp(`/edit/${flow.clipId}(?:\\?|$)`));
    await expect(page.getByText("영상 편집")).toBeVisible();
    await expect(page.getByTestId("single-clip-editor")).toBeVisible();
    await expect(page.getByTestId("single-clip-profile-card-toggle")).toBeVisible();
    await expect(page.getByTestId("single-clip-profile-card-toggle")).toHaveText("보임");
    await expect(page.getByRole("button", { name: /구간/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /주인공/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /정보/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^4 저장$/ })).toBeVisible();
  });

  test("편집 값을 바꾸면 draft가 저장되고 다시 들어와 복구할 수 있다", async ({
    page,
    context,
  }) => {
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
                highlightStart?: number;
                highlightEnd?: number;
              };
              overlay?: {
                showLowerThird?: boolean;
              };
              saveTarget?: {
                profileTarget?: string;
              };
            }
          | undefined;
        if (!latestPayload?.playback) return null;
        return {
          trimStart: latestPayload.playback.trimStart ?? null,
          freezeAt: latestPayload.playback.freezeAt ?? null,
          zoom: latestPayload.playback.zoom ?? null,
          highlightStart: latestPayload.playback.highlightStart ?? null,
          highlightEnd: latestPayload.playback.highlightEnd ?? null,
          showLowerThird: latestPayload.overlay?.showLowerThird ?? null,
          profileTarget: latestPayload.saveTarget?.profileTarget ?? null,
        };
      })
      .toEqual({
        trimStart: 1,
        freezeAt: 2,
        zoom: 2.2,
        highlightStart: 2,
        highlightEnd: 4,
        showLowerThird: false,
        profileTarget: "tag_portfolio",
      });

    const restoredPage = await context.newPage();
    await openUpload(restoredPage);

    await expect(restoredPage.getByText("최근 편집 이어서 하기")).toBeVisible();
    await restoredPage.getByRole("button", { name: /최근 편집 이어서 하기/ }).click();

    await expect(restoredPage.getByText("영상 편집")).toBeVisible();
    await expect(restoredPage.getByTestId("single-clip-editor")).toBeVisible();
    await expectRestoredDraft(restoredPage);
  });

  test("/edit 재진입에서도 최근 single-clip draft를 복구한다", async ({ page, context }) => {
    const flow = await installMockVideoFlow(context);

    await uploadFixtureAndOpenEditor(page);
    await applySingleClipDraftChanges(page);

    await expect.poll(() => flow.getProjectPayloads().length).toBeGreaterThan(0);

    const restoredPage = await context.newPage();
    await restoredPage.goto(`/edit/${flow.clipId}`);

    await expect(restoredPage.getByText("영상 편집")).toBeVisible();
    await expect(restoredPage.getByTestId("single-clip-editor")).toBeVisible();
    await expectRestoredDraft(restoredPage);
  });

  test("저장하면 프로필 대표 영상에 반영된다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context());

    await uploadFixtureAndOpenEditor(page);

    await page.getByRole("button", { name: /^4 저장$/ }).click();
    await expect(page.getByTestId("single-clip-save-panel")).toBeVisible();
    await expect(page.getByText("프로필 대표로 저장")).toBeVisible();

    await page.getByRole("button", { name: "내 영상으로 저장" }).click();
    await expect(page).toHaveURL(new RegExp(`/(profile|p/${flow.profileHandle})(?:\\?|$)`), {
      timeout: 20_000,
    });
    await expect(page.getByText("대표 영상")).toBeVisible();
    await expect.poll(() => flow.getFeatured().length).toBe(1);
  });
});

test.describe("영상 업로드 fixture smoke", () => {
  test("fixture 비디오로 업로드 선택 화면을 항상 열 수 있다", async ({ page }) => {
    await installMockVideoFlow(page.context());

    await openUpload(page);

    await expect(page.getByText("영상을 골라요")).toBeVisible();
    await expect(page.getByText(/MP4, MOV/i)).toBeVisible();
    await expect(page.getByText(/5분 이내/i)).toBeVisible();
    await expect(page.getByText(/200MB 이내/i)).toBeVisible();

    await selectFixtureVideo(page);
    await expect(page.getByRole("button", { name: "영상 올리기" })).toBeVisible();
  });

  test("320px 화면에서도 업로드 후 편집과 저장 버튼이 보인다", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await installMockVideoFlow(page.context());

    await uploadFixtureAndOpenEditor(page);

    await expect(page.getByTestId("single-clip-editor")).toBeVisible();
    await page.getByRole("button", { name: /^4 저장$/ }).click();
    const savePanel = page.getByTestId("single-clip-save-panel");
    await expect(savePanel).toBeVisible();
    const saveButton = page.getByRole("button", { name: "내 영상으로 저장" });
    await saveButton.scrollIntoViewIfNeeded();
    await expect(saveButton).toBeVisible();
  });

  test("지연 네트워크 조건에서도 업로드 후 저장까지 완료된다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context(), {
      delayMs: {
        presign: 1200,
        clipsPost: 1200,
        projectPost: 800,
        clipPatch: 800,
        featuredPost: 800,
      },
    });

    await openUpload(page);
    await selectFixtureVideo(page);
    await page.getByRole("button", { name: "영상 올리기" }).click();

    await expect(page.getByText("영상을 올리고 있어요")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "편집하고 저장" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "편집하고 저장" }).click();
    await expect(page).toHaveURL(/\/edit\/.+(?:\?|$)/, { timeout: 20_000 });

    await page.getByRole("button", { name: /^4 저장$/ }).click();
    await page.getByRole("button", { name: "내 영상으로 저장" }).click();
    await expect(page).toHaveURL(new RegExp(`/(profile|p/${flow.profileHandle})(?:\\?|$)`), {
      timeout: 30_000,
    });
    await expect.poll(() => flow.getFeatured().length).toBe(1);
  });

  test("iPhone 15 지연 조건에서도 업로드 후 저장까지 완료된다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context(), {
      delayMs: {
        presign: 1200,
        clipsPost: 1200,
        projectPost: 800,
        clipPatch: 800,
        featuredPost: 800,
      },
    });

    await openUpload(page);
    await selectFixtureVideo(page);
    await page.getByRole("button", { name: "영상 올리기" }).click();

    await expect(page.getByText("영상을 올리고 있어요")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "편집하고 저장" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "편집하고 저장" }).click();
    await expect(page).toHaveURL(/\/edit\/.+(?:\?|$)/, { timeout: 20_000 });

    await page.getByRole("button", { name: /^4 저장$/ }).click();
    await page.getByRole("button", { name: "내 영상으로 저장" }).click();
    await expect(page).toHaveURL(new RegExp(`/(profile|p/${flow.profileHandle})(?:\\?|$)`), {
      timeout: 30_000,
    });
    await expect.poll(() => flow.getFeatured().length).toBe(1);
  });
});
