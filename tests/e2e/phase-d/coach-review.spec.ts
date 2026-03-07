import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip, type SeededData } from "../setup/seed-data";
import { loginAsCoach } from "../setup/test-accounts";

test.describe("Phase D - 코치 리뷰", () => {
  let seeded: SeededData | null = null;

  test.beforeEach(async ({ page }) => {
    seeded = await ensureSeedDataOrSkip();
    if (!seeded) return;
    await loginAsCoach(page, "/profile");
  });

  test("코치 리뷰 작성 API 동작", async ({ page }) => {
    test.skip(!seeded, "시드 데이터가 없습니다.");

    const clipId = seeded!.clipIds[0];

    const postResult = await page.evaluate(async (id) => {
      const res = await fetch("/api/coach-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip_id: id,
          rating: "great",
          comment: "E2E 코치 리뷰",
          private_note: "E2E private",
        }),
      });
      const body = await res.json();
      return { status: res.status, body };
    }, clipId);

    expect([200, 201]).toContain(postResult.status);

    const getResult = await page.evaluate(async (id) => {
      const res = await fetch(`/api/coach-reviews?clip_id=${id}`);
      const body = await res.json();
      return { status: res.status, body };
    }, clipId);

    expect(getResult.status).toBe(200);
    expect(Array.isArray(getResult.body.reviews)).toBe(true);
  });
});
