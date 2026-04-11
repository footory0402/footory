import { expect, test } from "@playwright/test";
import { installMockVideoFlow } from "./video-test-helpers";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("영상 플레이어", () => {
  test("프로필 대표 영상에서 플레이어를 열 수 있다", async ({ page }) => {
    await installMockVideoFlow(page.context(), {
      initialProjectStatus: "published",
    });

    await loginAsPlayer(page, "/profile");

    await page.getByLabel("대표 영상 재생").click();

    await expect(page.locator("video").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("E2E Player").first()).toBeVisible();
  });

  test("프로필 릴 카드는 trim 기반 재생 길이를 표시하고 재생할 수 있다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context(), {
      initialProjectStatus: "published",
      clipOverrides: {
        trim_start: 1,
        trim_end: 8,
        duration_sec: 7,
        spotlight_x: 0.48,
        spotlight_y: 0.35,
        freeze_at: 2.5,
        effects: {
          intro: true,
          showLowerThird: true,
          focusZoom: 2.2,
          trackingMode: "fixed",
          trackingPoints: [],
        },
      },
    });

    await loginAsPlayer(page, "/profile");

    await page.getByLabel("대표 영상 재생").click();
    await expect(page.locator("video").first()).toBeVisible({ timeout: 10_000 });
    expect(flow.getClip().trim_end - flow.getClip().trim_start).toBe(7);
  });
});
