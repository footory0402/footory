"use client";

import { useState } from "react";
import { signUpWithEmail } from "@/lib/auth";

export default function EmailSignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordMatch = password === confirmPassword;
  const canSubmit = email && passwordValid && passwordMatch && agreed && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      await signUpWithEmail(email, password);
      setSuccess(true);
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes("already registered")) {
        setError("이미 가입된 이메일이에요.");
      } else {
        setError("가입에 실패했어요. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-text-1">인증 메일을 보냈어요</h2>
        <p className="text-sm text-text-2">
          <span className="font-medium text-accent">{email}</span>
          <br />
          메일함에서 인증 링크를 클릭해주세요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          autoComplete="email"
          className="w-full rounded-[10px] border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (8자 이상)"
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

      <label className="flex items-start gap-2 text-sm text-text-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
        />
        <span>
          <span className="text-text-3">이용약관</span> 및{" "}
          <span className="text-text-3">개인정보처리방침</span>에 동의합니다.
          <br />
          <span className="text-xs text-text-3">
            만 14세 미만은 법정대리인의 동의가 필요합니다.
          </span>
        </span>
      </label>

      {error && <p className="text-xs text-red">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-[10px] bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-50"
      >
        {loading ? "가입 중..." : "이메일로 가입하기"}
      </button>
    </form>
  );
}
