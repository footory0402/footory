"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useTeamActions } from "@/hooks/useTeam";

interface JoinTeamSheetProps {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinTeamSheet({ open, onClose, onJoined }: JoinTeamSheetProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { joinTeam } = useTeamActions();

  const onSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await joinTeam(code.trim());
      onJoined();
      onClose();
      setCode("");
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
        <h2 className="mb-5 text-[17px] font-bold text-text-1">팀 가입하기</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-3">초대코드</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="6자리 코드 입력"
              maxLength={6}
              className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-center font-stat text-[20px] tracking-[0.3em] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
          </div>

          {error && <p className="text-[12px] text-red">{error}</p>}

          <Button
            variant="primary"
            size="full"
            onClick={onSubmit}
            disabled={code.length < 6 || submitting}
          >
            {submitting ? "가입 중..." : "가입하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
