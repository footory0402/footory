import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let r2Client: S3Client | null = null;

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

export async function getPresignedUploadUrl(
  userId: string,
  clipId: string,
  contentType: string = "video/mp4",
  prefix: string = "originals",
  fileSize?: number
): Promise<{ url: string; key: string }> {
  const ext = contentType === "video/quicktime" ? "mov" : "mp4";
  const key = `${prefix}/${userId}/${clipId}.${ext}`;
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";

  const client = getR2Client();
  // ContentLength를 서명에 포함하면 모바일 브라우저에서
  // 실제 전송 Content-Length 불일치로 R2가 거부할 수 있음 → 제거
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
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

export async function putObjectToR2(
  key: string,
  body: Uint8Array | Buffer,
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

// ─── Multipart Upload ───

export async function createMultipartUpload(
  key: string,
  contentType: string
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
  const cmd = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const res = await client.send(cmd);
  if (!res.UploadId) throw new Error("No UploadId returned from R2");
  return res.UploadId;
}

export async function getPresignedPartUrl(
  key: string,
  uploadId: string,
  partNumber: number
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
  const cmd = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(client, cmd, { expiresIn: 3600 });
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
  const cmd = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  await client.send(cmd);
}

export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
  const cmd = new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
  });
  await client.send(cmd);
}

/**
 * R2에서 업로드된 파트 목록 조회 (ETags 포함).
 * 브라우저에서 CORS로 ETag 헤더를 읽지 않아도 됨.
 */
export async function listMultipartParts(
  key: string,
  uploadId: string
): Promise<{ ETag: string; PartNumber: number }[]> {
  const bucket = process.env.R2_BUCKET_NAME || "footory-videos";
  const client = getR2Client();
  const parts: { ETag: string; PartNumber: number }[] = [];
  let partNumberMarker: string | undefined;

  do {
    const cmd = new ListPartsCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      ...(partNumberMarker ? { PartNumberMarker: partNumberMarker } : {}),
    });
    const res = await client.send(cmd);
    if (res.Parts) {
      for (const p of res.Parts) {
        if (p.ETag && p.PartNumber) {
          parts.push({ ETag: p.ETag, PartNumber: p.PartNumber });
        }
      }
    }
    partNumberMarker = res.NextPartNumberMarker
      ? String(res.NextPartNumberMarker)
      : undefined;
  } while (partNumberMarker);

  return parts;
}
