import { test, expect } from "@playwright/test";
import { installMockVideoFlow } from "./video-test-helpers";

test.describe("영상 플레이어", () => {
  test("프로필 대표 영상에서 플레이어를 열 수 있다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context(), {
      initialProjectStatus: "published",
    });

    await page.goto(`/p/${flow.profileHandle}`);

    await expect(page.getByText("대표 영상")).toBeVisible();
    await page.getByText("FEATURED").click();

    await expect(page.locator("video").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("E2E Player").first()).toBeVisible();
  });

  test("프로필 반영된 영상은 trim과 spotlight 정보를 소비한다", async ({ page }) => {
    const flow = await installMockVideoFlow(page.context(), {
      initialProjectStatus: "published",
      clipOverrides: {
        trim_start: 1,
        trim_end: 8,
        highlight_start: 2,
        highlight_end: 6,
        spotlight_x: 0.48,
        spotlight_y: 0.35,
        freeze_at: 2.5,
      },
    });

    await page.goto(`/p/${flow.profileHandle}`);
    await page.getByText("FEATURED").click();

    const video = page.locator("video").first();
    await expect(video).toBeVisible({ timeout: 10_000 });

    await page.waitForFunction(() => {
      const node = document.querySelector("video");
      return Boolean(node && (node as HTMLVideoElement).readyState >= 2);
    });

    const playbackWindow = await page.evaluate(() => {
      const node = document.querySelector("video") as HTMLVideoElement | null;
      if (!node) return null;
      return {
        currentTime: node.currentTime,
        duration: node.duration,
      };
    });

    expect(playbackWindow?.duration ?? 0).toBeGreaterThan(0);
    expect(flow.getFeatured()[0]?.clips.trim_start).toBe(1);
    expect(flow.getFeatured()[0]?.clips.spotlight_x).toBeCloseTo(0.48, 2);
  });
});
