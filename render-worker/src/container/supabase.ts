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
      rendered_url: renderedUrl,
      render_job_id: renderJobId,
      highlight_status: "done",
    })
    .eq("id", clipId);

  if (error) {
    console.error(`[Supabase] Failed to update clip ${clipId}:`, error.message);
  }
}
