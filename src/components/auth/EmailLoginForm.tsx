"use client";

import { useState } from "react";
import { signInWithEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function EmailLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const { session } = await signInWithEmail(email, password);
      if (session) {
        router.replace("/");
        router.refresh();
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes("Invalid login")) {
        setError("이메일 또는 비밀번호가 올바르지 않아요.");
      } else if (message.includes("Email not confirmed")) {
        setError("이메일 인증이 필요해요. 메일함을 확인해주세요.");
      } else {
        setError("로그인에 실패했어요. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        autoComplete="email"
        className="w-full rounded-[10px] border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        autoComplete="current-password"
        className="w-full rounded-[10px] border border-border bg-card px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />
      {error && <p className="text-xs text-red">{error}</p>}
      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full rounded-[10px] bg-accent py-3 text-sm font-bold text-bg transition-opacity disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
