"use client";

import { useState, useEffect, useCallback } from "react";

interface Preferences {
  push_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  kudos: boolean;
  comments: boolean;
  follows: boolean;
  dm: boolean;
  mentions: boolean;
  vote_open: boolean;
  vote_remind: boolean;
  mvp_result: boolean;
  team_invite: boolean;
  weekly_recap: boolean;
  upload_nudge: boolean;
}

const DEFAULT_PREFS: Preferences = {
  push_enabled: true,
  quiet_start: "22:00",
  quiet_end: "08:00",
  kudos: true,
  comments: true,
  follows: true,
  dm: true,
  mentions: true,
  vote_open: true,
  vote_remind: true,
  mvp_result: true,
  team_invite: true,
  weekly_recap: true,
  upload_nudge: false,
};

const CATEGORY_LABELS: { key: keyof Preferences; label: string }[] = [
  { key: "kudos", label: "응원" },
  { key: "comments", label: "댓글" },
  { key: "follows", label: "팔로우" },
  { key: "dm", label: "메시지" },
  { key: "mentions", label: "멘션" },
  { key: "vote_open", label: "MVP 투표 시작" },
  { key: "vote_remind", label: "투표 리마인더" },
  { key: "mvp_result", label: "MVP 결과" },
  { key: "team_invite", label: "팀 초대" },
  { key: "weekly_recap", label: "주간 리캡" },
  { key: "upload_nudge", label: "업로드 유도" },
];

export default function NotificationSettings({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        setPrefs({ ...DEFAULT_PREFS, ...data });
      })
      .catch(() => {/* keep defaults on error */});
  }, []);

  const save = useCallback(async (updates: Partial<Preferences>) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }, [prefs]);

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="sticky top-[42px] z-30 flex items-center gap-3 border-b border-border bg-bg/95 px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="font-display text-lg font-bold text-text-1">알림 설정</h2>
      </div>

      <div className="space-y-6 px-4 py-4">
          {/* 마스터 토글 */}
          <div className="flex items-center justify-between rounded-[10px] bg-card p-4">
            <div>
              <p className="text-[15px] font-semibold text-text-1">알림</p>
              <p className="text-xs text-text-3">모든 알림을 켜거나 끕니다</p>
            </div>
            <Toggle
              checked={prefs.push_enabled}
              onChange={(v) => save({ push_enabled: v })}
            />
          </div>

          {/* 조용한 시간 */}
          <div className="rounded-[10px] bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌙</span>
              <p className="text-[15px] font-semibold text-text-1">조용한 시간</p>
            </div>
            <p className="mt-1 text-xs text-text-3">이 시간에는 푸시 알림을 보내지 않습니다</p>
            <div className="mt-3 flex items-center gap-3">
              <TimeInput
                value={prefs.quiet_start}
                onChange={(v) => save({ quiet_start: v })}
                label="시작"
              />
              <span className="text-text-3">~</span>
              <TimeInput
                value={prefs.quiet_end}
                onChange={(v) => save({ quiet_end: v })}
                label="종료"
              />
            </div>
          </div>

          {/* 고급 설정 */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between rounded-[10px] bg-card p-4"
          >
            <p className="text-[15px] font-semibold text-text-1">카테고리별 설정</p>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-text-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="space-y-1 rounded-[10px] bg-card p-4">
              {CATEGORY_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-2">{label}</span>
                  <Toggle
                    checked={prefs[key] as boolean}
                    onChange={(v) => save({ [key]: v })}
                    disabled={!prefs.push_enabled}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors ${
        disabled ? "opacity-40" : ""
      } ${checked ? "bg-accent" : "bg-border"}`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function TimeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label className="flex-1">
      <span className="text-xs text-text-3">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-elevated px-3 py-2 text-sm text-text-1 [color-scheme:dark]"
      />
    </label>
  );
}
