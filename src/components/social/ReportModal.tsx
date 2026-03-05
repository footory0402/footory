"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReportCategory } from "@/lib/types";

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "harassment", label: "괴롭힘/욕설" },
  { value: "spam", label: "스팸/광고" },
  { value: "inappropriate", label: "부적절한 콘텐츠" },
  { value: "other", label: "기타" },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  messageId?: string;
  commentId?: string;
  clipId?: string;
}

export default function ReportModal({
  open,
  onClose,
  reportedId,
  messageId,
  commentId,
  clipId,
}: ReportModalProps) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!category || submitting) return;
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: reportedId,
      message_id: messageId ?? null,
      comment_id: commentId ?? null,
      clip_id: clipId ?? null,
      category,
      description: description.trim() || null,
    });

    setSubmitting(false);
    setDone(true);
  };

  const handleClose = () => {
    setCategory(null);
    setDescription("");
    setDone(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-[430px] rounded-t-2xl bg-card p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        {done ? (
          <div className="flex flex-col items-center py-6">
            <span className="text-3xl">✅</span>
            <p className="mt-3 text-[15px] font-semibold text-text-1">
              신고가 접수되었습니다
            </p>
            <p className="mt-1 text-[13px] text-text-3">
              검토 후 적절한 조치를 취하겠습니다
            </p>
            <button
              onClick={handleClose}
              className="mt-5 rounded-xl bg-accent px-8 py-2.5 text-sm font-semibold text-black"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-center">
              <div className="h-1 w-8 rounded-full bg-text-3" />
            </div>
            <h3 className="mt-3 text-center text-[16px] font-bold text-text-1">
              이 사용자를 신고하시겠어요?
            </h3>
            <p className="mt-1 text-center text-[13px] text-text-3">
              신고 사유를 선택해주세요
            </p>

            <div className="mt-5 space-y-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-colors ${
                    category === cat.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-2"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      category === cat.value
                        ? "border-accent bg-accent"
                        : "border-text-3"
                    }`}
                  />
                  {cat.label}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="추가 설명 (선택)"
              rows={3}
              className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl bg-surface py-3 text-[14px] font-semibold text-text-2"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!category || submitting}
                className="flex-1 rounded-xl bg-red-500/80 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
              >
                {submitting ? "처리 중..." : "신고하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
