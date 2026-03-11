"use client";

import Link from "next/link";
import EmailSignupForm from "@/components/auth/EmailSignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <h1
          className="mb-2 text-center font-brand text-3xl font-bold tracking-wider"
          style={{
            background: "var(--accent-shine)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          FOOTORY
        </h1>
        <p className="mb-8 text-center text-sm text-text-2">이메일로 가입하기</p>

        <EmailSignupForm />

        <p className="mt-6 text-center text-xs text-text-3">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-accent hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
