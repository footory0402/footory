"use client";

import { useState, useEffect } from "react";
import KakaoLoginButton from "@/components/auth/KakaoLoginButton";

export default function LoginPage() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      {/* Logo with splash animation */}
      <div className="mb-12 text-center">
        <h1
          className="font-brand text-5xl font-bold tracking-wider"
          style={{
            background: "var(--accent-shine)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "logoFadeIn 1.2s var(--ease-out) both",
          }}
        >
          FOOTORY
        </h1>
        <p
          className="mt-3 text-sm text-text-2"
          style={{ animation: "fadeUp 0.6s var(--ease-out) 0.8s both" }}
        >
          유스 축구 선수 프로필 플랫폼
        </p>
      </div>

      {/* Login button (appears after splash) */}
      <div
        className={`w-full max-w-[320px] transition-all duration-500 ${
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <KakaoLoginButton />
      </div>

      {/* Footer */}
      <p
        className={`mt-8 text-xs text-text-3 transition-opacity duration-500 ${
          showContent ? "opacity-100" : "opacity-0"
        }`}
      >
        로그인 시 이용약관 및 개인정보처리방침에 동의합니다
      </p>
    </div>
  );
}
