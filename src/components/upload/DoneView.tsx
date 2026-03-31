"use client";

import { useUploadStore } from "@/stores/upload-store";
import { useRouter } from "next/navigation";

interface DoneViewProps {
  onMakeAnother: () => void;
}

export default function DoneView({ onMakeAnother }: DoneViewProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 backdrop-blur-sm animate-fade-up">
      {/* 골드 체크마크 */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 mb-5">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-[18px] font-bold text-text-1 mb-1">업로드 완료!</h2>
      <p className="text-[13px] text-text-3 mb-8">영상이 프로필에 등록되었어요</p>

      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        <button
          type="button"
          onClick={() => {
            useUploadStore.getState().reset();
            router.push("/profile");
          }}
          className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-bold text-bg active:scale-[0.99]"
        >
          프로필에서 확인
        </button>

        <button
          type="button"
          onClick={onMakeAnother}
          className="w-full rounded-xl border border-accent/30 bg-accent/8 py-3.5 text-[15px] font-medium text-accent active:scale-[0.99]"
        >
          하나 더 만들기
        </button>

        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "Footory 하이라이트", url: window.location.origin + "/profile" }).catch(() => {});
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.origin + "/profile").then(() => {
                alert("링크가 복사되었어요!");
              });
            }
          }}
          className="w-full rounded-xl border border-white/[0.08] bg-card py-3.5 text-[15px] font-medium text-text-1 active:scale-[0.99]"
        >
          공유하기
        </button>
      </div>
    </div>
  );
}
