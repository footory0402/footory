export function getFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    // iOS Safari timeout: onloadedmetadata may never fire for some codecs
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    }, 8000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);
      const dur = video.duration;
      // iOS can return Infinity for some MOV files
      if (!dur || !isFinite(dur)) {
        resolve(0);
        return;
      }
      resolve(Math.round(dur));
    };
    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}
