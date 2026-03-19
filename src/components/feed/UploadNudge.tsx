import { memo } from "react";
import Link from "next/link";

/**
 * Inline nudge for new users without clips.
 * Displayed at feed position 3.
 * "🎬 첫 영상을 올려보세요! MVP 투표 후보에 자동 등록"
 */
export default memo(function UploadNudge() {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--accent-bg)" }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[20px]">
          &#x1F3AC;
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-text-1">
            첫 영상을 올려보세요!
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-2">
            MVP 투표 후보에 자동 등록되고, 프로필 레벨도 올라가요
          </p>

          <Link
            href="/upload"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-bg"
            style={{ background: "var(--accent-gradient)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            영상 올리기
          </Link>
        </div>
      </div>
    </div>
  );
});
