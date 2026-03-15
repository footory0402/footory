import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { writeFile, readFile } from "fs/promises";
import { Readable } from "stream";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured in container env");
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

const BUCKET = process.env.R2_BUCKET_NAME || "footory-videos";

/** R2에서 파일 다운로드 → 로컬 경로에 저장 */
export async function downloadFromR2(
  key: string,
  localPath: string
): Promise<void> {
  const s3 = getClient();
  const res = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );

  if (!res.Body) throw new Error(`R2 object not found: ${key}`);

  const stream = res.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  await writeFile(localPath, Buffer.concat(chunks));
}

/** 로컬 파일 → R2 업로드 */
export async function uploadToR2(
  localPath: string,
  key: string,
  contentType: string = "video/mp4"
): Promise<void> {
  const s3 = getClient();
  const body = await readFile(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}
