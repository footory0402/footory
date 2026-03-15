import { createClient } from "@supabase/supabase-js";

/** render_jobs 상태 업데이트 (service role 사용) */
export async function updateJobStatus(
  supabaseUrl: string,
  supabaseKey: string,
  jobId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase
    .from("render_jobs")
    .update(updates)
    .eq("id", jobId);

  if (error) {
    console.error(`[Supabase] Failed to update job ${jobId}:`, error.message);
    throw error;
  }
}

/** clips 테이블에 렌더 결과 반영 */
export async function updateClipRendered(
  supabaseUrl: string,
  supabaseKey: string,
  clipId: string,
  renderedUrl: string,
  renderJobId: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase
    .from("clips")
    .update({
      video_url: renderedUrl,
      rendered_url: renderedUrl,
      render_job_id: renderJobId,
      highlight_status: "done",
    })
    .eq("id", clipId);

  if (error) {
    console.error(`[Supabase] Failed to update clip ${clipId}:`, error.message);
  }

  const { data: feedItems, error: feedError } = await supabase
    .from("feed_items")
    .select("id, metadata")
    .eq("reference_id", clipId)
    .eq("type", "highlight");

  if (feedError) {
    console.error(
      `[Supabase] Failed to load feed items for clip ${clipId}:`,
      feedError.message
    );
    return;
  }

  await Promise.all(
    (feedItems ?? []).map((item) =>
      supabase
        .from("feed_items")
        .update({
          metadata: {
            ...((item.metadata as Record<string, unknown> | null) ?? {}),
            video_url: renderedUrl,
          },
        })
        .eq("id", item.id)
    )
  );
}

export async function updateClipFailed(
  supabaseUrl: string,
  supabaseKey: string,
  clipId: string,
  renderJobId: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase
    .from("clips")
    .update({
      render_job_id: renderJobId,
      highlight_status: "failed",
    })
    .eq("id", clipId);

  if (error) {
    console.error(`[Supabase] Failed to mark clip ${clipId} as failed:`, error.message);
  }
}
