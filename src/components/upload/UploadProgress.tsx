"use client";

import { useEffect, useState } from "react";
import { useUploadStore } from "@/stores/upload-store";
import Link from "next/link";
import PushPermissionPrompt, { shouldShowPushPrompt } from "@/components/notifications/PushPermissionPrompt";

export default function UploadProgress() {
  const { progress, status, error } = useUploadStore();
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  // E15: 첫 영상 업로드 완료 직후 푸시 권한 요청
  useEffect(() => {
    if (status === "done" && shouldShowPushPrompt()) {
      const timer = setTimeout(() => setShowPushPrompt(true), 800);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <>
    {showPushPrompt && <PushPermissionPrompt onClose={() => setShowPushPrompt(false)} />}
    <div className="flex flex-col items-center gap-6 py-8">
      {status === "error" ? (
        <>
          <span className="text-4xl">❌</span>
          <p className="text-sm text-red">{error ?? "업로드에 실패했습니다."}</p>
          <button
            onClick={() => useUploadStore.getState().reset()}
            className="mt-2 rounded-lg bg-accent px-5 py-2 text-[13px] font-semibold text-bg"
          >
            다시 시도
          </button>
        </>
      ) : status === "done" ? (
        <>
          <span className="text-5xl">✅</span>
          <p className="text-base font-semibold text-[var(--color-text)]">
            하이라이트 생성 완료!
          </p>
          <p className="text-sm text-[var(--color-text-2)]">
            영상이 프로필에 추가되었습니다.
          </p>
          <Link
            href="/profile"
            className="mt-2 rounded-xl bg-[var(--color-accent)] px-8 py-3 text-sm font-bold text-[var(--color-bg)]"
          >
            프로필에서 Featured로 설정하기
          </Link>
        </>
      ) : (
        <>
          <span className="text-4xl">{status === "saving" ? "💾" : status === "thumbnail" ? "🖼️" : "📤"}</span>
          <p className="text-sm font-medium text-[var(--color-text)]">
            {status === "saving" ? "저장 중..." : status === "thumbnail" ? "썸네일 생성 중..." : "업로드 중..."}
          </p>

          {/* Progress bar */}
          <div className="w-full overflow-hidden rounded-full bg-[var(--color-card)]">
            <div
              className="h-2 rounded-full bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-3)]">{Math.round(progress)}%</span>
        </>
      )}
    </div>
    </>
  );
}
