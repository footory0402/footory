import {
  S3Client,
  PutObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client: S3Client | null = null;
let corsConfigured = false;

function getR2Client() {
  if (r2Client) return r2Client;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return r2Client;
}

async function ensureCors() {
  if (corsConfigured) return;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
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
    corsConfigured = true;
  } catch (e) {
    console.warn("[R2] CORS setup failed (may already be configured):", e);
    corsConfigured = true;
  }
}

export async function getPresignedUploadUrl(
  userId: string,
  clipId: string,
  contentType: string = "video/mp4"
): Promise<{ url: string; key: string }> {
  await ensureCors();

  const ext = contentType === "video/quicktime" ? "mov" : "mp4";
  const key = `originals/${userId}/${clipId}.${ext}`;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";

  const client = getR2Client();
  // ContentType를 서명에 포함하지 않아야 모바일에서 MIME 불일치 방지
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: 600,
    unhoistableHeaders: new Set(["content-type"]),
  });
  return { url, key };
}

export async function getPresignedThumbnailUrl(
  userId: string,
  clipId: string
): Promise<{ url: string; key: string }> {
  await ensureCors();

  const key = `thumbnails/${userId}/${clipId}.jpg`;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: 600,
    unhoistableHeaders: new Set(["content-type"]),
  });
  return { url, key };
}

export async function putObjectToR2(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await client.send(command);
}

export function getPublicVideoUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) return key;
  return `${publicUrl}/${key}`;
}
