/**
 * R2 버킷 CORS 설정 스크립트
 * 빌드 시 자동 실행되어 presigned URL 업로드가 브라우저에서 작동하도록 보장
 *
 * 우선순위:
 *   1. CF_API_TOKEN 환경변수가 있으면 Cloudflare REST API로 설정 (권장)
 *   2. R2 Access Key로 S3 API 시도
 *   3. AccessDenied면 수동 설정 가정 (이미 대시보드에서 설정됨) — 에러 아닌 info
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const CORS_RULES = [
  {
    AllowedOrigins: ["*"],
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 86400,
  },
];

async function setViaCloudfareApi(accountId, bucket, apiToken) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/cors`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(CORS_RULES),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.errors?.[0]?.message || `HTTP ${res.status}`);
  }
}

async function setViaS3Api(client, bucket) {
  // Check first
  try {
    const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    const rules = current.CORSRules || [];
    const hasWildcard = rules.some(r => r.AllowedOrigins?.includes("*"));
    const hasPut = rules.some(r => r.AllowedMethods?.includes("PUT"));
    if (hasWildcard && hasPut) {
      console.log("[R2 CORS] Already configured correctly (verified via S3 API)");
      return;
    }
  } catch {
    // GetBucketCors not permitted or not set yet — continue to set
  }

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: CORS_RULES },
    })
  );
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const cfApiToken = process.env.CF_API_TOKEN;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.log("[R2 CORS] R2 credentials not found, skipping CORS setup");
    return;
  }

  // Method 1: Cloudflare REST API (requires CF_API_TOKEN with R2 Edit permission)
  if (cfApiToken) {
    try {
      await setViaCloudfareApi(accountId, bucket, cfApiToken);
      console.log("[R2 CORS] Successfully configured via Cloudflare API");
      return;
    } catch (e) {
      console.warn("[R2 CORS] Cloudflare API failed:", e.message, "— falling back to S3 API");
    }
  }

  // Method 2: S3-compatible API
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    await setViaS3Api(client, bucket);
    console.log("[R2 CORS] Successfully configured via S3 API");
  } catch (e) {
    if (e.Code === "AccessDenied" || e.message?.includes("Access Denied")) {
      // R2 Access Key lacks CORS permission — assume already configured manually
      console.log("[R2 CORS] Skipped (Access Key lacks CORS permission — assuming manual setup)");
      console.log("[R2 CORS] To automate: add CF_API_TOKEN env var with R2 Edit permission");
    } else {
      console.warn("[R2 CORS] Failed:", e.message);
    }
  }
}

main();
