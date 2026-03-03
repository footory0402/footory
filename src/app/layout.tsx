import type { Metadata, Viewport } from "next";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOOTORY — 유스 축구 선수 프로필",
  description: "유소년 축구 선수들의 영상 하이라이트와 스킬 포트폴리오 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0C0C0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto min-h-dvh max-w-[430px]">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
