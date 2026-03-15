"use client";

import { useState, useCallback } from "react";

interface ClipActionSheetProps {
  clipId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (clipId: string) => Promise<boolean>;
  onEditTags?: (clipId: string) => void;
  onEditMemo?: (clipId: string) => void;
  onSetFeatured?: (clipId: string) => void;
  onShare?: (clipId: string) => void;
}

export default function ClipActionSheet({
  clipId,
  isOpen,
  onClose,
  onDelete,
  onEditTags,
  onEditMemo,
  onSetFeatured,
  onShare,
}: ClipActionSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    const ok = await onDelete(clipId);
    setDeleting(false);
    if (ok) {
      setShowDeleteConfirm(false);
      onClose();
    }
  }, [clipId, onDelete, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setShowDeleteConfirm(false);
          onClose();
        }}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] animate-[slideUp_0.25s_ease] rounded-t-2xl border-t border-white/[0.06] bg-card pb-[env(safe-area-inset-bottom)]">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-white/10" />
        </div>

        {showDeleteConfirm ? (
          /* 삭제 확인 */
          <div className="flex flex-col gap-3 px-5 pb-5">
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-text-1">
                이 영상을 삭제할까요?
              </p>
              <p className="text-[13px] text-text-3">
                삭제하면 복구할 수 없습니다
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-500 py-3.5 text-[14px] font-bold text-white active:scale-[0.99] disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "삭제하기"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl border border-white/[0.08] bg-card py-3.5 text-[14px] font-semibold text-text-2 active:scale-[0.99]"
            >
              취소
            </button>
          </div>
        ) : (
          /* 액션 목록 */
          <div className="flex flex-col pb-3">
            {onEditTags && (
              <ActionButton
                icon={<TagIcon />}
                label="태그 편집"
                onClick={() => { onEditTags(clipId); onClose(); }}
              />
            )}
            {onEditMemo && (
              <ActionButton
                icon={<EditIcon />}
                label="메모 수정"
                onClick={() => { onEditMemo(clipId); onClose(); }}
              />
            )}
            {onSetFeatured && (
              <ActionButton
                icon={<StarIcon />}
                label="대표 영상 설정"
                onClick={() => { onSetFeatured(clipId); onClose(); }}
              />
            )}
            {onShare && (
              <ActionButton
                icon={<ShareIcon />}
                label="공유"
                onClick={() => { onShare(clipId); onClose(); }}
              />
            )}
            <div className="mx-4 my-1 h-px bg-white/[0.06]" />
            <ActionButton
              icon={<TrashIcon />}
              label="삭제"
              danger
              onClick={() => setShowDeleteConfirm(true)}
            />
          </div>
        )}
      </div>
    </>
  );
}

/* ── Trigger Button (for clip thumbnails) ── */
export function ClipActionTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm active:bg-black/70"
      aria-label="클립 관리"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FAFAFA">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  );
}

/* ── Action Button ── */
function ActionButton({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3.5 px-5 py-3.5 text-left active:bg-white/[0.03] ${
        danger ? "text-red-400" : "text-text-1"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}

/* ── Icons ── */
function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
