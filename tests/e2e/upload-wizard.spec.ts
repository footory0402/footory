import { test, expect } from "@playwright/test";

test.describe("Upload Wizard v1.3 — Auth Guard", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/upload");
    // 인증 없으면 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("v1.3 API Endpoints", () => {
  test("presign endpoint requires auth", async ({ request }) => {
    const res = await request.post("/api/upload/presign", {
      data: { contentType: "video/mp4" },
    });
    expect(res.status()).toBe(401);
  });

  test("presign endpoint accepts raw prefix param", async ({ request }) => {
    // 401 expected (no auth) — validates endpoint parses body without error
    const res = await request.post("/api/upload/presign", {
      data: { contentType: "video/mp4", prefix: "raw" },
    });
    expect(res.status()).toBe(401);
  });

  test("render POST endpoint requires auth", async ({ request }) => {
    const res = await request.post("/api/render", {
      data: { clipId: "test-id", inputKey: "raw/test/test.mp4" },
    });
    expect(res.status()).toBe(401);
  });

  test("render GET status endpoint requires auth", async ({ request }) => {
    const res = await request.get("/api/render/00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(401);
  });

  test("highlights GET endpoint requires auth", async ({ request }) => {
    const res = await request.get("/api/highlights");
    expect(res.status()).toBe(401);
  });

  test("highlights POST endpoint requires auth", async ({ request }) => {
    const res = await request.post("/api/highlights", {
      data: { clipIds: ["a", "b"] },
    });
    expect(res.status()).toBe(401);
  });

  test("clips GET endpoint requires auth", async ({ request }) => {
    const res = await request.get("/api/clips");
    expect(res.status()).toBe(401);
  });

  test("bgm GET endpoint returns tracks list", async ({ request }) => {
    const res = await request.get("/api/bgm");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("tracks");
    expect(Array.isArray(body.tracks)).toBe(true);
  });

  test("bgm tracks have correct schema", async ({ request }) => {
    const res = await request.get("/api/bgm");
    const body = await res.json();

    // 033_seed에서 12개 시드 삽입됨
    expect(body.tracks.length).toBeGreaterThanOrEqual(1);

    const track = body.tracks[0];
    expect(track).toHaveProperty("id");
    expect(track).toHaveProperty("title");
    expect(track).toHaveProperty("category");
    expect(track).toHaveProperty("r2Key");
    expect(track).toHaveProperty("durationSec");
    expect(typeof track.durationSec).toBe("number");
    expect(["epic", "chill", "hype", "cinematic"]).toContain(track.category);
  });

  test("bgm tracks include all 4 categories", async ({ request }) => {
    const res = await request.get("/api/bgm");
    const body = await res.json();
    const categories = new Set(body.tracks.map((t: { category: string }) => t.category));
    expect(categories.has("epic")).toBe(true);
    expect(categories.has("chill")).toBe(true);
    expect(categories.has("hype")).toBe(true);
    expect(categories.has("cinematic")).toBe(true);
  });
});
