/**
 * Capture a frame from a video file at a given time (default 5s) and return as Blob.
 */
export function captureVideoThumbnail(
  file: File,
  timeSeconds = 5
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      // Clamp to actual duration
      const seekTo = Math.min(timeSeconds, video.duration * 0.5);
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const finalize = () => {
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          "image/jpeg",
          0.7
        );
      };
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(finalize);
      } else {
        finalize();
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}
