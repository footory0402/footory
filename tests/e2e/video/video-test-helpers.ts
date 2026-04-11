import fs from "node:fs";
import path from "node:path";
import { expect, type BrowserContext, type Page } from "@playwright/test";
import { loginAsPlayer } from "../setup/test-accounts";

const DEFAULT_VIDEO_FIXTURE = path.resolve(
  process.cwd(),
  "tests/fixtures/videos/test2.mp4"
);

export const VIDEO_FIXTURE_FILE = DEFAULT_VIDEO_FIXTURE;

if (!fs.existsSync(VIDEO_FIXTURE_FILE)) {
  throw new Error(`영상 fixture를 찾을 수 없습니다: ${VIDEO_FIXTURE_FILE}`);
}

type ProjectStatus = "draft" | "published" | "archived";

interface MockClipRecord {
  id: string;
  video_url: string;
  duration_seconds: number;
  duration_sec: number;
  trim_start: number;
  trim_end: number;
  highlight_start: number;
  highlight_end: number;
  spotlight_x: number | null;
  spotlight_y: number | null;
  freeze_at: number | null;
  thumbnail_url: string | null;
  effects: {
    intro?: boolean;
    showLowerThird?: boolean;
    focusZoom?: number;
    trackingMode?: string;
    trackingPoints?: unknown[];
  };
  tags: string[];
}

interface MockProjectRecord {
  id: string;
  kind: "single_clip";
  status: ProjectStatus;
  clip_id: string;
  highlight_id: string | null;
  title: string | null;
  payload: Record<string, unknown>;
  last_opened_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MockVideoFlowOptions {
  clipId?: string;
  projectId?: string;
  profileHandle?: string;
  initialProjectStatus?: ProjectStatus;
  clipOverrides?: Partial<MockClipRecord>;
}

export interface MockVideoFlowController {
  clipId: string;
  projectId: string;
  profileHandle: string;
  getClip: () => MockClipRecord;
  getProjectPayloads: () => Record<string, unknown>[];
  getFeatured: () => Array<{
    id: string;
    clip_id: string;
    sort_order: number;
    clips: MockClipRecord;
  }>;
}

function nowIso() {
  return new Date().toISOString();
}

function buildInitialClip(
  clipId: string,
  fixtureVideoUrl: string,
  overrides: Partial<MockClipRecord> = {}
): MockClipRecord {
  return {
    id: clipId,
    video_url: fixtureVideoUrl,
    duration_seconds: 12,
    duration_sec: 12,
    trim_start: 0,
    trim_end: 12,
    highlight_start: 0,
    highlight_end: 12,
    spotlight_x: 0.42,
    spotlight_y: 0.38,
    freeze_at: 3,
    thumbnail_url: null,
    effects: {
      intro: true,
      showLowerThird: true,
      focusZoom: 1.8,
      trackingMode: "fixed",
      trackingPoints: [],
    },
    tags: ["shooting"],
    ...overrides,
  };
}

function buildProjectRecord(
  projectId: string,
  clipId: string,
  payload: Record<string, unknown>,
  status: ProjectStatus
): MockProjectRecord {
  const timestamp = nowIso();

  return {
    id: projectId,
    kind: "single_clip",
    status,
    clip_id: clipId,
    highlight_id: null,
    title: null,
    payload,
    last_opened_at: null,
    published_at: status === "published" ? timestamp : null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export async function installMockVideoFlow(
  context: BrowserContext,
  options: MockVideoFlowOptions = {}
): Promise<MockVideoFlowController> {
  const clipId = options.clipId ?? "clip-e2e-fixture";
  const projectId = options.projectId ?? "project-e2e-fixture";
  const profileHandle = options.profileHandle ?? "e2e_player";
  const fixtureVideoUrl = "/__e2e__/fixture-video.mp4";
  const uploadTargetUrl = "/__e2e__/upload-target";

  let clip = buildInitialClip(clipId, fixtureVideoUrl, options.clipOverrides);
  let project: MockProjectRecord | null = null;
  let featured: Array<{
    id: string;
    clip_id: string;
    sort_order: number;
    clips: MockClipRecord;
  }> = [];
  const reelId = "reel-e2e-fixture";
  const projectPayloads: Record<string, unknown>[] = [];
  let playerCard = {
    profile_id: "player-e2e-fixture",
    template: "fifa",
    club_name: "분당초",
    main_color: "#37474F",
    accent_color: "#D4A853",
    card_data: {
      name: "E2E Player",
      number: "9",
      position: "FW",
      teamName: "분당초",
      birthDate: "2013",
    },
  };
  const playerProfile = {
    name: "E2E Player",
    position: "FW",
    height_cm: 148,
    weight_kg: 38,
    preferred_foot: "right",
    birth_year: 2013,
    avatar_url: null,
  };

  await context.route("**/__e2e__/fixture-video.mp4", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "video/mp4",
      path: VIDEO_FIXTURE_FILE,
      headers: { "cache-control": "no-store" },
    });
  });

  await context.route("**/__e2e__/upload-target", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await context.route("**/api/upload/presign", async (route) => {
    const body = route.request().postDataJSON() as { clipId?: string; type?: string } | null;
    const resolvedClipId = body?.clipId ?? clipId;
    const requestUrl = new URL(route.request().url());

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: new URL(uploadTargetUrl, requestUrl.origin).toString(),
        key: body?.type === "thumbnail"
          ? `thumbs/${resolvedClipId}.jpg`
          : `originals/${resolvedClipId}.mp4`,
        clipId: resolvedClipId,
      }),
    });
  });

  await context.route("**/api/player-card**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          card: playerCard,
          profile: playerProfile,
        }),
      });
      return;
    }

    await route.fallback();
  });

  await context.route("**/api/clips", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    clip = {
      ...clip,
      id: String(body.clip_id ?? clip.id),
      video_url: fixtureVideoUrl,
      duration_seconds: Number(body.duration_seconds ?? clip.duration_seconds),
      duration_sec: Number(body.duration_seconds ?? clip.duration_sec),
      trim_start: Number(body.trim_start ?? clip.trim_start),
      trim_end: Number(body.trim_end ?? clip.trim_end),
      highlight_start: Number(body.highlight_start ?? clip.highlight_start),
      highlight_end: Number(body.highlight_end ?? clip.highlight_end),
      spotlight_x: (body.spotlight_x as number | null) ?? clip.spotlight_x,
      spotlight_y: (body.spotlight_y as number | null) ?? clip.spotlight_y,
      freeze_at: (body.freeze_at as number | null) ?? clip.freeze_at,
      effects: {
        ...clip.effects,
        ...((body.effects as MockClipRecord["effects"] | undefined) ?? {}),
      },
      tags: Array.isArray(body.tags) ? body.tags.map(String) : clip.tags,
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ clip: { id: clip.id } }),
    });
  });

  await context.route(`**/api/clips/${clipId}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ clip }),
      });
      return;
    }

    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      clip = {
        ...clip,
        trim_start: Number(body.trim_start ?? clip.trim_start),
        trim_end: Number(body.trim_end ?? clip.trim_end),
        highlight_start: Number(body.highlight_start ?? clip.highlight_start),
        highlight_end: Number(body.highlight_end ?? clip.highlight_end),
        duration_sec: Number(body.duration_sec ?? clip.duration_sec),
        spotlight_x: (body.spotlight_x as number | null) ?? clip.spotlight_x,
        spotlight_y: (body.spotlight_y as number | null) ?? clip.spotlight_y,
        freeze_at: (body.freeze_at as number | null) ?? clip.freeze_at,
        effects: {
          ...clip.effects,
          ...((body.effects as MockClipRecord["effects"] | undefined) ?? {}),
        },
        tags: Array.isArray(body.tags) ? body.tags.map(String) : clip.tags,
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ clip }),
      });
      return;
    }

    await route.fallback();
  });

  await context.route("**/api/video-projects?**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const wantsLatestDraft =
      requestUrl.searchParams.get("kind") === "single_clip" &&
      requestUrl.searchParams.get("latest") === "1" &&
      requestUrl.searchParams.get("status") === "draft";

    if (!wantsLatestDraft || !project || project.status !== "draft") {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ project: null }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        project,
        clip: {
          id: clip.id,
          video_url: clip.video_url,
          duration_seconds: clip.duration_seconds,
          duration_sec: clip.duration_sec,
          trim_start: clip.trim_start,
          trim_end: clip.trim_end,
          highlight_start: clip.highlight_start,
          highlight_end: clip.highlight_end,
          spotlight_x: clip.spotlight_x,
          spotlight_y: clip.spotlight_y,
          freeze_at: clip.freeze_at,
          effects: clip.effects,
          tags: clip.tags,
        },
      }),
    });
  });

  await context.route("**/api/video-projects", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    const payload = (body.payload as Record<string, unknown> | undefined) ?? {};
    const status = (body.status as ProjectStatus | undefined) ?? "draft";
    projectPayloads.push(payload);
    project = buildProjectRecord(projectId, clipId, payload, status);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ project }),
    });
  });

  await context.route(`**/api/video-projects/${projectId}`, async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;

    if (project) {
      project = {
        ...project,
        status: (body.status as ProjectStatus | undefined) ?? project.status,
        highlight_id: (body.highlightId as string | null | undefined) ?? project.highlight_id,
        last_opened_at: body.markOpened ? nowIso() : project.last_opened_at,
        published_at:
          ((body.status as ProjectStatus | undefined) ?? project.status) === "published"
            ? nowIso()
            : project.published_at,
        updated_at: nowIso(),
      };
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ project }),
    });
  });

  await context.route("**/api/featured", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ featured }),
      });
      return;
    }

    if (route.request().method() === "POST") {
      featured = [{
        id: "featured-e2e-fixture",
        clip_id: clip.id,
        sort_order: 0,
        clips: clip,
      }];

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ featured: featured[0] }),
      });
      return;
    }

    await route.fallback();
  });

  await context.route("**/api/highlights", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const totalDuration = Math.max(0, (clip.trim_end ?? clip.duration_sec) - (clip.trim_start ?? 0));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        highlights: [{
          id: reelId,
          title: "E2E Reel",
          clip_ids: [clip.id],
          status: "published",
          created_at: nowIso(),
          thumbnail_url: clip.thumbnail_url,
          total_duration: totalDuration,
        }],
      }),
    });
  });

  await context.route(`**/api/highlights/${reelId}`, async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        highlight: {
          id: reelId,
          title: "E2E Reel",
          clip_ids: [clip.id],
          status: "published",
        },
        clips: [{
          id: clip.id,
          video_url: clip.video_url,
          thumbnail_url: clip.thumbnail_url,
          duration_seconds: clip.duration_seconds,
          duration_sec: clip.duration_sec,
          highlight_start: clip.highlight_start,
          highlight_end: clip.highlight_end,
          spotlight_x: clip.spotlight_x,
          spotlight_y: clip.spotlight_y,
          freeze_at: clip.freeze_at,
          trim_start: clip.trim_start,
          trim_end: clip.trim_end,
          slowmo_start: null,
          slowmo_end: null,
          slowmo_speed: null,
          bgm_id: null,
          effects: clip.effects,
        }],
      }),
    });
  });

  if (options.initialProjectStatus) {
    project = buildProjectRecord(projectId, clipId, {}, options.initialProjectStatus);
    if (options.initialProjectStatus === "published") {
      featured = [{
        id: "featured-e2e-fixture",
        clip_id: clip.id,
        sort_order: 0,
        clips: clip,
      }];
    }
  }

  return {
    clipId,
    projectId,
    profileHandle,
    getClip: () => clip,
    getProjectPayloads: () => projectPayloads,
    getFeatured: () => featured,
  };
}

export async function openUpload(page: Page) {
  await loginAsPlayer(page, "/upload");
  await expect(page).toHaveURL(/\/upload(?:\?.*)?$/);
}

export async function selectFixtureVideo(page: Page) {
  await page.locator('input[type="file"]').setInputFiles(VIDEO_FIXTURE_FILE);
  await expect(page.locator("video")).toBeVisible({ timeout: 15_000 });
}

export async function uploadFixtureAndOpenEditor(page: Page) {
  await openUpload(page);
  await selectFixtureVideo(page);
  await page.getByRole("button", { name: "영상 올리기" }).click();
  await expect(page.getByRole("button", { name: "편집하고 저장" })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "편집하고 저장" }).click();
  await expect(page.getByTestId("single-clip-editor")).toBeVisible({ timeout: 20_000 });
}
