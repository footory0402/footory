/**
 * R2 버킷 CORS 설정 스크립트
 * 빌드 시 자동 실행되어 presigned URL 업로드가 브라우저에서 작동하도록 보장
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.log("[R2 CORS] R2 credentials not found, skipping CORS setup");
    return;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  // Check current CORS
  try {
    const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    const rules = current.CORSRules || [];
    const hasWildcardOrigin = rules.some(r => r.AllowedOrigins?.includes("*"));
    const hasPut = rules.some(r => r.AllowedMethods?.includes("PUT"));
    if (hasWildcardOrigin && hasPut) {
      console.log("[R2 CORS] Already configured correctly");
      return;
    }
  } catch {
    // No CORS configured yet, or GetBucketCors not supported
  }

  // Set CORS
  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["PUT", "GET", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 86400,
            },
          ],
        },
      })
    );
    console.log("[R2 CORS] Successfully configured");
  } catch (e) {
    console.error("[R2 CORS] Failed to set CORS via S3 API:", e.message);
    console.error("[R2 CORS] Please configure CORS manually in Cloudflare Dashboard:");
    console.error("[R2 CORS]   1. Go to R2 > footory-videos > Settings > CORS Policy");
    console.error("[R2 CORS]   2. Add rule: AllowedOrigins=*, AllowedMethods=PUT,GET,HEAD, AllowedHeaders=*");
  }
}

main();
