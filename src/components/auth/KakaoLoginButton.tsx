"use client";

import { signInWithKakao } from "@/lib/auth";
import { useState } from "react";

export default function KakaoLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithKakao();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#FEE500] px-6 py-3.5 font-semibold text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2C5.03 2 1 5.13 1 8.97c0 2.48 1.66 4.67 4.16 5.9l-1.06 3.88c-.09.33.28.6.56.41L8.6 16.3c.46.06.93.1 1.4.1 4.97 0 9-3.13 9-6.97S14.97 2 10 2Z"
          fill="#191919"
        />
      </svg>
      {loading ? "로그인 중..." : "카카오로 시작하기"}
    </button>
  );
}
