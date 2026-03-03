import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function getPresignedUploadUrl(
  userId: string,
  clipId: string
): Promise<{ url: string; key: string }> {
  const key = `originals/${userId}/${clipId}.mp4`;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "video/mp4",
  });

  const url = await getSignedUrl(client, command, { expiresIn: 600 });
  return { url, key };
}

export async function getPresignedThumbnailUrl(
  userId: string,
  clipId: string
): Promise<{ url: string; key: string }> {
  const key = `thumbnails/${userId}/${clipId}.jpg`;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "image/jpeg",
  });

  const url = await getSignedUrl(client, command, { expiresIn: 600 });
  return { url, key };
}

export function getPublicVideoUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) return key;
  return `${publicUrl}/${key}`;
}
