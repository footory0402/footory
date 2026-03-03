"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface LinkChildSheetProps {
  open: boolean;
  onClose: () => void;
  onLink: (handle: string) => Promise<void>;
}

export default function LinkChildSheet({ open, onClose, onLink }: LinkChildSheetProps) {
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!handle.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onLink(handle.trim().replace(/^@/, ""));
      onClose();
      setHandle("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[430px] rounded-t-2xl bg-surface px-5 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 className="mb-2 text-[17px] font-bold text-text-1">자녀 프로필 연동</h2>
        <p className="mb-5 text-[13px] text-text-3">자녀의 핸들을 입력해주세요</p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center rounded-[10px] border border-border bg-card px-3 py-2.5">
              <span className="text-[14px] text-text-3">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="minjun_07"
                className="flex-1 bg-transparent pl-1 text-[14px] text-text-1 placeholder:text-text-3 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-[12px] text-red-400">{error}</p>}

          <Button
            variant="primary"
            size="full"
            onClick={onSubmit}
            disabled={!handle.trim() || submitting}
          >
            {submitting ? "연동 중..." : "연동하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
