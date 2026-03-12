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
    startupImage: [
      // iPhone SE / 8 / 7 / 6s
      { url: "/splash/apple-splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      // iPhone X / XS / 11 Pro / 12 mini / 13 mini
      { url: "/splash/apple-splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone XR / 11 / 12 / 13 / 14
      { url: "/splash/apple-splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      // iPhone 12 Pro / 13 Pro / 14
      { url: "/splash/apple-splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 14 Pro / 15 / 15 Pro
      { url: "/splash/apple-splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      // iPhone 14 Pro Max / 15 Plus / 15 Pro Max
      { url: "/splash/apple-splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
    ],
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
          position="bottom-center"
          toastOptions={{
            className: "!bg-card !text-text-1 !border-border !rounded-xl !text-[13px] !font-medium !shadow-lg",
          }}
        />
      </body>
    </html>
  );
}
