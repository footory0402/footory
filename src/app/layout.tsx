import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Oswald, Rajdhani, Geist } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import ToastContainer from "@/components/ui/Toast";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--noto-sans-kr",
  display: "swap",
  preload: false,
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--oswald",
  display: "swap",
  preload: true,
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--rajdhani",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "FOOTORY — 유스 축구 선수 프로필",
  description: "유소년 축구 선수들의 영상 하이라이트와 스킬 포트폴리오 플랫폼",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FOOTORY",
  },
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
    <html lang="ko" className={cn(notoSansKr.variable, oswald.variable, rajdhani.variable, "font-sans", geist.variable)}>
      <body>
        <div className="mx-auto min-h-dvh max-w-[430px]">
          <AppShell>{children}</AppShell>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
