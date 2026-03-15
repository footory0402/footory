import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dispatchRender } from "@/lib/render-api";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * POST /api/render
 * render_job 생성 + Container Worker 호출
 *
 * Body: { clipId, inputKey, params }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Container Worker 호출
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
}

type RenderRequest = {
  params: {
    trimStart?: number;
    trimEnd?: number;
    spotlightX?: number;
    spotlightY?: number;
    skillLabels?: string[];
    customLabels?: string[];
    slowmoStart?: number;
    slowmoEnd?: number;
    slowmoSpeed?: number;
    bgmId?: string;
    effects?: Record<string, boolean>;
  };
};

type NumericRenderParamKey =
  | "trimStart"
  | "trimEnd"
  | "spotlightX"
  | "spotlightY"
  | "slowmoStart"
  | "slowmoEnd"
  | "slowmoSpeed";

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
  assignNumber("slowmoStart", params.slowmoStart);
  assignNumber("slowmoEnd", params.slowmoEnd);
  assignNumber("slowmoSpeed", params.slowmoSpeed);
  assignStringArray("skillLabels", params.skillLabels);
  assignStringArray("customLabels", params.customLabels);

  if (typeof params.bgmId === "string" && params.bgmId.length > 0) {
    normalized.bgmId = params.bgmId;
  }

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
