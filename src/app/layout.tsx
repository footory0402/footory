import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Oswald, Rajdhani } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--noto-sans-kr",
  display: "swap",
  preload: true,
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--oswald",
  display: "swap",
  preload: false,
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0C0C0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`dark ${notoSansKr.variable} ${oswald.variable} ${rajdhani.variable}`}>
      <body>
        <ServiceWorkerRegister />
        <div className="mx-auto min-h-screen max-w-[430px]">
          <AppShell>{children}</AppShell>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "!bg-card !text-text-1 !border-border !rounded-xl !text-[13px] !font-medium !shadow-lg",
            style: { zIndex: 200 },
          }}
        />
      </body>
    </html>
  );
}
