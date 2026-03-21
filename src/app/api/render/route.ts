import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { dispatchRender } from "@/lib/render-api";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/render
 * render_job 생성 + Container Worker 호출
 *
 * Body: { clipId, inputKey, params }
 */
export async function POST(req: NextRequest) {
  try {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { allowed, retryAfter } = checkRateLimit(
    `render:${user.id}`,
    3_600_000,
    10
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json();
  const { clipId, inputKey, params } = body as {
    clipId: string;
    inputKey: string;
    params?: Record<string, unknown>;
  };
  const normalizedParams = normalizeRenderParams(params);
  console.log("[render/route] received params:", JSON.stringify(params, null, 2));
  console.log("[render/route] normalized params:", JSON.stringify(normalizedParams, null, 2));

  if (!clipId || !inputKey) {
    return NextResponse.json(
      { error: "clipId and inputKey are required" },
      { status: 400 }
    );
  }

  // render_job INSERT
  const { data: job, error } = await supabase
    .from("render_jobs")
    .insert({
      clip_id: clipId,
      owner_id: user.id,
      input_key: inputKey,
      params: normalizedParams as Record<string, string | number | boolean | string[]>,
      status: "queued",
    })
    .select()
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create render job" },
      { status: 500 }
    );
  }

  // clips.render_job_id 연결 + status processing
  await supabase
    .from("clips")
    .update({
      render_job_id: job.id,
      highlight_status: "processing",
    })
    .eq("id", clipId);

  // Container Worker 호출 (RENDER_WORKER_URL 미설정 시 원본 영상으로 완료 처리)
  const workerUrl = process.env.RENDER_WORKER_URL;
  if (!workerUrl) {
    // 렌더 워커 미설정 → 원본 영상을 그대로 최종 영상으로 사용
    console.warn("[render/route] RENDER_WORKER_URL not configured — using raw video as output");
    await supabase
      .from("render_jobs")
      .update({ status: "done", output_key: inputKey })
      .eq("id", job.id);
    await supabase
      .from("clips")
      .update({ highlight_status: "done", render_job_id: job.id })
      .eq("id", clipId);
    return NextResponse.json({ job: { ...job, status: "done", output_key: inputKey } }, { status: 201 });
  }

  try {
    await dispatchRender({
      jobId: job.id,
      clipId,
      ownerId: user.id,
      inputKey,
      params: normalizedParams,
    });
  } catch (err) {
    console.error("[render/route] Worker dispatch failed:", err);
    const errMsg = err instanceof Error ? err.message : "Worker dispatch failed";
    await supabase
      .from("render_jobs")
      .update({ status: "failed", error: errMsg })
      .eq("id", job.id);
    await supabase
      .from("clips")
      .update({ highlight_status: "failed", render_job_id: job.id })
      .eq("id", clipId);
  }

  return NextResponse.json({ job }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

type RenderRequest = {
  params: {
    trimStart?: number;
    trimEnd?: number;
    spotlightX?: number;
    spotlightY?: number;
    skillLabels?: string[];
    customLabels?: string[];
    effects?: Record<string, boolean>;
  };
};

type NumericRenderParamKey =
  | "trimStart"
  | "trimEnd"
  | "spotlightX"
  | "spotlightY";

function normalizeRenderParams(
  params?: Record<string, unknown>
): RenderRequest["params"] {
  if (!params) return {};

  const normalized: RenderRequest["params"] = {};

  const assignNumber = (sourceKey: NumericRenderParamKey, value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      normalized[sourceKey] = value;
    }
  };

  const assignStringArray = (
    sourceKey: "skillLabels" | "customLabels",
    value: unknown
  ) => {
    if (!Array.isArray(value)) return;

    const items = value.filter(
      (item): item is string => typeof item === "string" && item.length > 0
    );
    if (items.length > 0) {
      normalized[sourceKey] = items;
    }
  };

  assignNumber("trimStart", params.trimStart);
  assignNumber("trimEnd", params.trimEnd);
  assignNumber("spotlightX", params.spotlightX);
  assignNumber("spotlightY", params.spotlightY);
  assignStringArray("skillLabels", params.skillLabels);
  assignStringArray("customLabels", params.customLabels);

  if (params.effects && typeof params.effects === "object") {
    const rawEffects = params.effects as Record<string, unknown>;
    const effects: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(rawEffects)) {
      if (typeof value === "boolean") {
        effects[key] = value;
      }
    }

    if (Object.keys(effects).length > 0) {
      normalized.effects = effects;
    }
  }

  return normalized;
}
