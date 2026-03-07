"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError("");

    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("메일 발송에 실패했어요. 이메일을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-text-1">메일을 보냈어요</h2>
        <p className="text-sm text-text-2">
          <span className="font-medium text-accent">{email}</span>
          <br />
          메일함에서 비밀번호 재설정 링크를 클릭해주세요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-text-2">
        가입할 때 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        autoComplete="email"
        className="w-full rounded-[10px] border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />
      {error && <p className="text-xs text-red">{error}</p>}
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full rounded-[10px] bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-50"
      >
        {loading ? "발송 중..." : "재설정 링크 보내기"}
      </button>
    </form>
  );
}
