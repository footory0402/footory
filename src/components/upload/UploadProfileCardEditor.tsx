"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { CARD_THEMES, POSITIONS } from "@/components/editor/constants";
import EaSportsCard from "@/components/editor/cards/EaSportsCard";
import { DEFAULT_PLAYER_DATA, type PlayerData } from "@/components/editor/types";
import { loadPlayerCardData, savePlayerCardData } from "@/lib/player-card-editor";
import { useUploadStore } from "@/stores/upload-store";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-3">
      {children}
    </label>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-[14px] text-text-1 outline-none transition-colors placeholder:text-text-3 focus:border-[#d8b36a]/40";

export default function UploadProfileCardEditor() {
  const childId = useUploadStore((state) => state.childId);
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPlayerCardData(childId)
      .then((nextData) => {
        if (cancelled) return;
        setData(nextData);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(DEFAULT_PLAYER_DATA);
        setLoading(false);
        setSaveMessage("저장된 카드가 없어도 바로 입력해서 쓸 수 있어요.");
      });

    return () => {
      cancelled = true;
    };
  }, [childId]);

  const update = useCallback((key: keyof PlayerData, value: string) => {
    setData((current) => ({ ...current, [key]: value }));
    if (saveStatus !== "idle") {
      setSaveStatus("idle");
    }
    setSaveMessage(null);
  }, [saveStatus]);

  const handleTheme = useCallback((themeId: string) => {
    const theme = CARD_THEMES.find((item) => item.id === themeId);
    if (!theme) return;
    setData((current) => ({
      ...current,
      themeId: theme.id,
      customClubColor: theme.color,
      customClubAccent: theme.accent,
    }));
    setSaveStatus("idle");
    setSaveMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setSaveMessage(null);

    try {
      const savedData = await savePlayerCardData(data, { profileId: childId });
      setData(savedData);
      setSaveStatus("saved");
      setSaveMessage("프로필 카드에 바로 저장했어요.");
    } catch {
      setSaveStatus("error");
      setSaveMessage("카드 저장이 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }, [childId, data]);

  return (
    <section
      data-testid="upload-profile-card-editor"
      className="mx-4 mt-4 rounded-[28px] border border-[#d8b36a]/15 bg-[#111114] p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-text-1">선수 프로필 카드</p>
          <p className="mt-1 text-[12px] leading-5 text-text-2">
            업로드 전에 카드 내용을 먼저 맞춰둘 수 있어요.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex h-[220px] items-center justify-center rounded-3xl bg-white/[0.03]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#d8b36a]" />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0a0a0c] px-3 py-4">
            <div className="mx-auto flex w-full max-w-[172px] justify-center overflow-hidden">
              <div
                className="origin-top"
                style={{
                  width: 360,
                  height: 520,
                  transform: "scale(0.46)",
                  transformOrigin: "top center",
                  marginBottom: -(520 * (1 - 0.46)),
                }}
              >
                <EaSportsCard data={data} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>이름</FieldLabel>
              <input
                aria-label="업로드 카드 이름"
                className={inputClass}
                value={data.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="선수 이름"
              />
            </div>
            <div>
              <FieldLabel>소속 팀</FieldLabel>
              <input
                aria-label="업로드 카드 소속 팀"
                className={inputClass}
                value={data.teamName}
                onChange={(event) => update("teamName", event.target.value)}
                placeholder="예: 분당 유나이티드"
                maxLength={30}
              />
            </div>
            <div>
              <FieldLabel>등번호</FieldLabel>
              <input
                aria-label="업로드 카드 등번호"
                className={inputClass}
                type="number"
                value={data.number}
                onChange={(event) => update("number", event.target.value)}
                placeholder="9"
              />
            </div>
            <div>
              <FieldLabel>포지션</FieldLabel>
              <select
                aria-label="업로드 카드 포지션"
                className={inputClass}
                value={data.position}
                onChange={(event) => update("position", event.target.value)}
              >
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-3">
              카드 테마
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {CARD_THEMES.map((theme) => {
                const selected = data.themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleTheme(theme.id)}
                    className={`rounded-2xl border px-2 py-2.5 text-center ${
                      selected
                        ? "border-[#d8b36a]/50 bg-[#d8b36a]/10 text-[#f6d69a]"
                        : "border-white/[0.06] bg-white/[0.03] text-text-2"
                    }`}
                  >
                    <div className="mx-auto flex h-4 w-10 overflow-hidden rounded-full">
                      <div className="flex-1" style={{ background: theme.color }} />
                      <div className="flex-1" style={{ background: theme.accent }} />
                    </div>
                    <span className="mt-1.5 block text-[10px] font-semibold leading-none">
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {saveMessage ? (
            <div
              className={`rounded-2xl px-4 py-3 text-[12px] leading-5 ${
                saveStatus === "error"
                  ? "bg-[#2a1f1f] text-[#ff9a9a]"
                  : "bg-[#d8b36a]/10 text-[#f5ddb1]"
              }`}
            >
              {saveMessage}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="upload-profile-card-save"
              onClick={() => void handleSave()}
              disabled={saveStatus === "saving"}
              className="flex-1 rounded-2xl bg-[#d8b36a] py-3 text-[14px] font-bold text-[#09090b] disabled:opacity-60"
            >
              {saveStatus === "saving" ? "저장 중..." : "카드 저장"}
            </button>
            <Link
              href="/editor"
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] font-semibold text-text-2"
            >
              자세히 편집
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
