type UploadFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface PresignResponse {
  url: string;
  key: string;
  clipId?: string;
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function uploadViaDirectApi(
  file: Blob,
  key: string,
  contentType: string,
  fetcher: UploadFetcher = fetch,
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  form.append("key", key);
  form.append("contentType", contentType);

  const res = await fetcher("/api/upload/direct", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string" ? body.error : `Direct upload failed (${res.status})`;
    throw new Error(message);
  }
}

export async function requestUploadPresign(
  payload?: Record<string, unknown>,
  fetcher: UploadFetcher = fetch,
): Promise<PresignResponse> {
  const res = await fetcher("/api/upload/presign", {
    method: "POST",
    ...(payload
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      : {}),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string" ? body.error : `Presign 요청 실패 (${res.status})`;
    throw new Error(message);
  }

  const data = (await res.json()) as Partial<PresignResponse>;
  if (!data.url || !data.key) {
    throw new Error("Presign 응답이 올바르지 않습니다.");
  }

  return {
    url: data.url,
    key: data.key,
    clipId: data.clipId,
  };
}

export async function putToPresignedUrl(
  url: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

export async function uploadToPresignedWithDirectFallback({
  url,
  key,
  file,
  contentType,
  fetcher,
}: {
  url: string;
  key: string;
  file: Blob;
  contentType: string;
  fetcher?: UploadFetcher;
}): Promise<void> {
  try {
    await putToPresignedUrl(url, file, contentType);
  } catch (error) {
    await uploadViaDirectApi(
      file,
      key,
      contentType,
      fetcher,
    ).catch((fallbackError) => {
      throw new Error(normalizeErrorMessage(fallbackError, normalizeErrorMessage(error, "업로드 실패")));
    });
  }
}
