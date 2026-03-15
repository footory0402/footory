/**
 * Cloudflare Worker — FFmpeg 렌더 디스패처
 *
 * Container(FFmpeg)를 시작하고 /render 요청을 프록시
 *
 * POST /render  →  Container 시작 → Express 서버로 전달
 * GET  /health  →  Worker 상태 확인
 */

import { Container, getContainer } from "@cloudflare/containers";

export interface Env {
  RENDER_CONTAINER: DurableObjectNamespace;
  R2_BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  R2_PUBLIC_URL: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
}

/** Container 클래스 — FFmpeg 렌더 서버 */
export class RenderContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";
  enableInternet = true;

  override onStart() {
    console.log("[RenderContainer] Started");
  }

  override onStop() {
    console.log("[RenderContainer] Stopped");
  }

  override onError(error: unknown) {
    console.error("[RenderContainer] Error:", error);
    throw error;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/health") {
      return Response.json({ ok: true, ts: Date.now() }, { headers: corsHeaders });
    }

    if (url.pathname === "/render" && request.method === "POST") {
      try {
        const body = await request.json() as {
          jobId: string;
          clipId: string;
          ownerId: string;
          inputKey: string;
          params?: Record<string, unknown>;
        };

        const { jobId } = body;

        if (!jobId || !body.inputKey) {
          return Response.json(
            { error: "Missing required fields" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Container 환경변수로 시크릿 전달
        const container = getContainer(env.RENDER_CONTAINER, "singleton");

        await container.start({
          envVars: {
            SUPABASE_URL: env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
            R2_PUBLIC_URL: env.R2_PUBLIC_URL,
            CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
            R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
            R2_BUCKET_NAME: env.R2_BUCKET_NAME || "footory-videos",
          },
        });

        // Container Express 서버로 /render POST 전달
        const containerReq = new Request("http://container:8080/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const containerRes = await container.fetch(containerReq);
        const result = await containerRes.json();

        return Response.json(result, { headers: corsHeaders });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Worker error";
        console.error("[Worker] Error:", message);
        return Response.json(
          { error: message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders }
    );
  },
};
