export const MAX_UPLOAD_VIDEO_SIZE = 200 * 1024 * 1024;
export const MAX_UPLOAD_VIDEO_DURATION = 300;

function isVideoFile(file: File) {
  return (
    file.type.startsWith("video/")
    || file.type === "application/octet-stream"
    || file.type === ""
    || /\.(mp4|mov|m4v|webm|avi)$/i.test(file.name)
  );
}

export async function validateUploadVideoFile(file: File): Promise<{
  duration: number;
  error: string | null;
}> {
  if (!isVideoFile(file)) {
    return {
      duration: 0,
      error: "영상 파일이 아닌 것 같아요. MP4 또는 MOV 파일을 선택해주세요.",
    };
  }

  if (file.size > MAX_UPLOAD_VIDEO_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(0);
    return {
      duration: 0,
      error: `영상이 ${sizeMB}MB예요. 200MB 이내로 선택해주세요.`,
    };
  }

  const duration = await getVideoDuration(file);
  if (duration > MAX_UPLOAD_VIDEO_DURATION) {
    return {
      duration,
      error: `영상이 ${Math.floor(duration / 60)}분이에요. 5분 이내로 선택해주세요.`,
    };
  }

  return { duration, error: null };
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    }, 10_000);

    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(video.src);
      resolve(0);
    };

    video.src = URL.createObjectURL(file);
  });
}
