"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordMatch = password === confirmPassword;
  const canSubmit = passwordValid && passwordMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2000);
    } catch {
      setError("비밀번호 변경에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl">
          ✅
        </div>
        <h2 className="mt-4 text-xl font-bold text-text-1">비밀번호가 변경되었어요</h2>
        <p className="mt-2 text-sm text-text-2">로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-[320px]">
        <h1 className="mb-2 text-2xl font-bold text-text-1">새 비밀번호 설정</h1>
        <p className="mb-6 text-sm text-text-2">새로운 비밀번호를 입력해주세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              autoComplete="new-password"
              className="w-full rounded-[10px] border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
            {password && !passwordValid && (
              <p className="mt-1 text-xs text-red">비밀번호는 8자 이상이어야 해요.</p>
            )}
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              className="w-full rounded-[10px] border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
            {confirmPassword && !passwordMatch && (
              <p className="mt-1 text-xs text-red">비밀번호가 일치하지 않아요.</p>
            )}
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-[10px] bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-50"
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}
