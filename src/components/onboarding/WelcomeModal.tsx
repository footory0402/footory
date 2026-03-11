"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("footory_show_welcome")) {
        localStorage.removeItem("footory_show_welcome");
        setVisible(true);
      }
    } catch {}
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[430px] rounded-2xl p-6 text-center animate-slide-up"
        style={{
          background: "var(--color-card)",
          border: "1px solid rgba(212,168,83,0.15)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
        }}
      >
        <div className="mb-4 text-4xl">⚽</div>
        <h2 className="text-xl font-bold text-text-1 mb-2">프로필이 만들어졌어요!</h2>
        <p className="text-sm text-text-2 mb-6">
          첫 영상을 올리면 MVP 투표 후보에 자동 등록되고
          <br />
          프로필 레벨도 올라가요
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setVisible(false); router.push("/upload"); }}
            className="w-full rounded-full bg-accent py-3 text-sm font-bold text-bg"
          >
            첫 영상 올리기 🎬
          </button>
          <button
            onClick={() => setVisible(false)}
            className="py-2 text-sm text-text-3 transition-colors hover:text-text-2"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    </div>
  );
}
