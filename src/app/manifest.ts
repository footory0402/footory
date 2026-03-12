import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FOOTORY",
    short_name: "FOOTORY",
    description: "유소년 축구 선수 영상 하이라이트 & 스킬 포트폴리오 플랫폼",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0C0C0E",
    theme_color: "#0C0C0E",
    categories: ["sports", "social"],
    lang: "ko",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        purpose: "any maskable" as any,
      },
    ],
  };
}
