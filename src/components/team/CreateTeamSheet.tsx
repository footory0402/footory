"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import { useTeamActions } from "@/hooks/useTeam";

interface CreateTeamSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTeamSheet({ open, onClose, onCreated }: CreateTeamSheetProps) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createTeam, checkHandle } = useTeamActions();

  const onHandleChange = useCallback(
    async (value: string) => {
      const v = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
      setHandle(v);
      if (v.length < 3) { setHandleStatus("idle"); return; }
      setHandleStatus("checking");
      const available = await checkHandle(v);
      setHandleStatus(available ? "available" : "taken");
    },
    [checkHandle]
  );

  const onSubmit = async () => {
    if (!name.trim() || handleStatus !== "available") return;
    setSubmitting(true);
    setError(null);
    try {
      await createTeam({
        name: name.trim(),
        handle,
        description: description.trim() || undefined,
        city: city.trim() || undefined,
      });
      onCreated();
      onClose();
      setName(""); setHandle(""); setDescription(""); setCity("");
      setHandleStatus("idle");
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
        <h2 className="mb-5 text-[17px] font-bold text-text-1">팀 만들기</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-3">팀 이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: FC 드림"
              className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-3">핸들 *</label>
            <input
              value={handle}
              onChange={(e) => onHandleChange(e.target.value)}
              placeholder="fc_dream"
              className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
            {handleStatus === "checking" && <p className="mt-1 text-[11px] text-text-3">확인 중...</p>}
            {handleStatus === "available" && <p className="mt-1 text-[11px] text-green">사용 가능</p>}
            {handleStatus === "taken" && <p className="mt-1 text-[11px] text-red">이미 사용 중</p>}
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-3">소개</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="팀 소개를 입력하세요"
              rows={2}
              className="w-full resize-none rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-text-3">지역</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="서울"
              className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
          </div>

          {error && <p className="text-[12px] text-red">{error}</p>}

          <Button
            variant="primary"
            size="full"
            onClick={onSubmit}
            disabled={!name.trim() || handleStatus !== "available" || submitting}
          >
            {submitting ? "생성 중..." : "팀 만들기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
