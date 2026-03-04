"use client";

import { useState } from "react";

interface SeasonAddSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (params: {
    year: number;
    teamName: string;
    league?: string;
    isNewTeam: boolean;
  }) => Promise<void>;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function SeasonAddSheet({ open, onClose, onSave }: SeasonAddSheetProps) {
  const [year, setYear] = useState(currentYear);
  const [teamName, setTeamName] = useState("");
  const [league, setLeague] = useState("");
  const [isNewTeam, setIsNewTeam] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setYear(currentYear);
    setTeamName("");
    setLeague("");
    setIsNewTeam(false);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!teamName.trim()) return;
    setSaving(true);
    try {
      await onSave({ year, teamName: teamName.trim(), league: league.trim() || undefined, isNewTeam });
      handleClose();
    } catch {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-8">
          <h2 className="mb-5 text-[16px] font-bold text-text-1">시즌 기록 추가</h2>

          {/* Year */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">연도</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 outline-none focus:border-accent"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {/* Team name */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">팀명</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="예: FC 서울 U-15"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* League */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">
              리그 / 대회 <span className="text-text-3 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              placeholder="예: 전국 초등학교 축구대회"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
            />
          </div>

          {/* Is new team toggle */}
          <button
            type="button"
            onClick={() => setIsNewTeam((v) => !v)}
            className="mb-6 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors"
            style={{
              borderColor: isNewTeam ? "var(--color-accent)" : "var(--color-border)",
              background: isNewTeam ? "var(--accent-bg)" : "transparent",
            }}
          >
            <div className="text-left">
              <p className="text-[13px] font-semibold text-text-1">현재 소속 팀으로 설정</p>
              <p className="text-[11px] text-text-3">이전 소속은 졸업 처리됩니다</p>
            </div>
            <div
              className="flex h-6 w-11 items-center rounded-full px-0.5 transition-all"
              style={{
                background: isNewTeam ? "var(--color-accent)" : "var(--color-border)",
              }}
            >
              <div
                className="h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: isNewTeam ? "translateX(20px)" : "translateX(0)" }}
              />
            </div>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!teamName.trim() || saving}
            className="w-full rounded-xl py-3.5 text-[14px] font-bold transition-opacity disabled:opacity-40"
            style={{
              background: "var(--accent-gradient)",
              color: "#0C0C0E",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
