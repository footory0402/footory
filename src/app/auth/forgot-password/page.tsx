"use client";

import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <h1 className="mb-2 text-2xl font-bold text-text-1">비밀번호 찾기</h1>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-xs text-text-3">
          <Link href="/login" className="text-accent hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
