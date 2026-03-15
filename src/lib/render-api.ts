/**
 * Cloudflare Container Worker 호출 래퍼
 */

const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL;

export interface RenderRequest {
  jobId: string;
  clipId: string;
  ownerId: string;
  inputKey: string;
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
    effects?: {
      color?: boolean;
      cinematic?: boolean;
      eafc?: boolean;
      intro?: boolean;
    };
  };
}

export async function dispatchRender(req: RenderRequest): Promise<void> {
  if (!RENDER_WORKER_URL) {
    throw new Error("RENDER_WORKER_URL is not configured");
  }

  const res = await fetch(`${RENDER_WORKER_URL}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Render worker returned ${res.status}`
    );
  }
}
