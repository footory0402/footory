import express from "express";
import { renderClip } from "./pipeline/clip.js";
import { updateClipFailed, updateJobStatus } from "./supabase.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/**
 * POST /render
 * Body: { jobId, clipId, ownerId, inputKey, params, supabaseUrl, supabaseKey }
 */
app.post("/render", async (req, res) => {
  const { jobId, clipId, inputKey, params } = req.body;

  // Supabase 자격증명은 Container 환경변수에서 가져옴
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!jobId || !inputKey) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: "Supabase env not configured" });
    return;
  }

  // 즉시 응답 — 렌더는 비동기로 진행
  res.json({ accepted: true, jobId });

  // 비동기 렌더 실행
  try {
    await updateJobStatus(supabaseUrl, supabaseKey, jobId, {
      status: "processing",
      progress: 10,
      started_at: new Date().toISOString(),
    });

    const outputKey = await renderClip({
      jobId,
      clipId,
      inputKey,
      params: params ?? {},
    });

    await updateJobStatus(supabaseUrl, supabaseKey, jobId, {
      status: "done",
      progress: 100,
      output_key: outputKey,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    console.error(`[Render] Job ${jobId} failed:`, message);

    await updateJobStatus(supabaseUrl, supabaseKey, jobId, {
      status: "failed",
      error: message,
    }).catch(() => {});
    await updateClipFailed(supabaseUrl, supabaseKey, clipId, jobId).catch(() => {});
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[Container] Render server listening on :${PORT}`);
});
