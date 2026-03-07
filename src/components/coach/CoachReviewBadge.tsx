"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CoachReviewForm from "./CoachReviewForm";

const RATING_CONFIG = {
  good: { emoji: "⚽", label: "좋음", color: "text-blue-400" },
  great: { emoji: "🔥", label: "훌륭함", color: "text-orange-400" },
  excellent: { emoji: "💎", label: "최고", color: "text-accent" },
} as const;

interface Review {
  id: string;
  coach_id: string;
  rating: keyof typeof RATING_CONFIG;
  comment?: string;
  private_note?: string;
  created_at: string;
  coach: {
    id: string;
    name: string;
    handle: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

interface Props {
  clipId: string;
  isOwner?: boolean;
  canReview?: boolean;
  className?: string;
}

export default function CoachReviewBadge({ clipId, isOwner, canReview, className = "" }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/coach-reviews?clip_id=${clipId}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .finally(() => setLoading(false));
  }, [clipId]);

  const handleHide = async (reviewId: string, hidden: boolean) => {
    await fetch(`/api/coach-reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  if (loading && !canReview) return null;
  if (!loading && reviews.length === 0 && !canReview) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {/* K5: 코치 리뷰 뱃지 */}
        {reviews.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-2 active:bg-card"
          >
            <span>📋</span>
            <span>코치 리뷰 {reviews.length}개</span>
            <span className="text-[10px] text-text-3">{expanded ? "▲" : "▼"}</span>
          </button>
        )}

        {/* K3: 인증 코치 → 리뷰 남기기 버튼 */}
        {canReview && (
          <button
            onClick={() => setReviewFormOpen(true)}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-2 active:bg-card"
          >
            <span>📋</span>
            <span>리뷰 남기기</span>
          </button>
        )}
      </div>

      {/* K4: 리뷰 폼 */}
      {reviewFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-[430px] rounded-t-[16px] bg-bg">
            <CoachReviewForm
              clipId={clipId}
              onClose={() => setReviewFormOpen(false)}
              onSaved={() => {
                setReviewFormOpen(false);
                fetch(`/api/coach-reviews?clip_id=${clipId}`)
                  .then((r) => r.json())
                  .then((d) => setReviews(d.reviews ?? []));
              }}
            />
          </div>
        </div>
      )}

      {/* Expanded Reviews */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {reviews.map((review) => {
            const rc = RATING_CONFIG[review.rating];
            return (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-surface p-3"
              >
                {/* Coach Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 overflow-hidden rounded-full bg-card">
                      {review.coach.avatar_url ? (
                        <Image
                          src={review.coach.avatar_url}
                          alt={review.coach.name}
                          width={28}
                          height={28}
                          sizes="28px"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-text-3">
                          {review.coach.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[13px] font-semibold text-text-1">
                        {review.coach.name}
                      </span>
                      {review.coach.is_verified && (
                        <span className="ml-1 text-[10px] text-accent">✅</span>
                      )}
                      <span className="ml-1 text-[11px] text-text-3">
                        @{review.coach.handle}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <span className={`text-[12px] font-bold ${rc.color}`}>
                    {rc.emoji} {rc.label}
                  </span>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="mt-2 text-[13px] text-text-2">{review.comment}</p>
                )}

                {/* Private Note (owner only) */}
                {isOwner && review.private_note && (
                  <div className="mt-2 rounded-lg bg-card px-3 py-2">
                    <p className="mb-0.5 text-[11px] text-text-3">
                      🔒 비공개 피드백 (나만 볼 수 있음)
                    </p>
                    <p className="text-[13px] text-text-1">{review.private_note}</p>
                  </div>
                )}

                {/* Owner: hide button */}
                {isOwner && (
                  <button
                    onClick={() => handleHide(review.id, true)}
                    className="mt-2 text-[11px] text-text-3 underline"
                  >
                    코치 리뷰 숨기기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
