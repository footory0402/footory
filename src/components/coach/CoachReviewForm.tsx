"use client";

import { useState } from "react";

type Rating = "good" | "great" | "excellent";

const RATINGS: { value: Rating; label: string; emoji: string }[] = [
  { value: "good", label: "좋음", emoji: "⚽" },
  { value: "great", label: "훌륭함", emoji: "🔥" },
  { value: "excellent", label: "최고", emoji: "💎" },
];

interface Props {
  clipId: string;
  existingReview?: {
    id: string;
    rating: Rating;
    comment?: string;
    private_note?: string;
  } | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function CoachReviewForm({
  clipId,
  existingReview,
  onClose,
  onSaved,
}: Props) {
  const [rating, setRating] = useState<Rating | null>(
    existingReview?.rating ?? null
  );
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [privateNote, setPrivateNote] = useState(
    existingReview?.private_note ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/coach-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip_id: clipId,
          rating,
          comment: comment.trim() || null,
          private_note: privateNote.trim() || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "오류 발생");
      }

      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-center text-[16px] font-bold text-text-1">
        📋 코치 리뷰
      </h3>

      {/* Rating */}
      <div className="mt-5">
        <p className="mb-3 text-[13px] text-text-3">평가 선택</p>
        <div className="flex gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRating(r.value)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 transition-colors ${
                rating === r.value
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface"
              }`}
            >
              <span className="text-xl">{r.emoji}</span>
              <span
                className={`text-[12px] font-semibold ${
                  rating === r.value ? "text-accent" : "text-text-2"
                }`}
              >
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Public Comment */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] text-text-2">한 줄 코멘트 (공개)</label>
          <span className="text-[11px] text-text-3">{comment.length}/80</span>
        </div>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 80))}
          placeholder="영상에 대한 코멘트를 남겨주세요"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
        />
      </div>

      {/* Private Note */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] text-text-2">
            비공개 피드백{" "}
            <span className="text-text-3">(선수만 열람)</span>
          </label>
          <span className="text-[11px] text-text-3">
            {privateNote.length}/200
          </span>
        </div>
        <textarea
          value={privateNote}
          onChange={(e) => setPrivateNote(e.target.value.slice(0, 200))}
          placeholder="선수에게 전달할 비공개 피드백을 입력하세요"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
        />
      </div>

      {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}

      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl bg-surface py-3 text-[14px] font-semibold text-text-2"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!rating || submitting}
          className="flex-1 rounded-xl bg-accent py-3 text-[14px] font-semibold text-black disabled:opacity-40"
        >
          {submitting ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
