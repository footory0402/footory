"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import KakaoLoginButton from "@/components/auth/KakaoLoginButton";
import EmailLoginForm from "@/components/auth/EmailLoginForm";

export default function LoginPage() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Clear stale Supabase session from localStorage to prevent auth errors
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-")) localStorage.removeItem(key);
      });
    } catch {}

    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
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

      {/* Login content */}
      <div
        className={`w-full max-w-[320px] transition-all duration-500 ${
          showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* Social login */}
        <div className="flex flex-col gap-3">
          <KakaoLoginButton />
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-3">또는</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email login */}
        <EmailLoginForm />

        {/* Links */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-text-3">
          <Link href="/auth/forgot-password" className="hover:text-text-2 transition-colors">
            비밀번호 찾기
          </Link>
          <span className="text-border">|</span>
          <Link href="/signup" className="hover:text-text-2 transition-colors">
            이메일로 가입하기
          </Link>
        </div>
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
