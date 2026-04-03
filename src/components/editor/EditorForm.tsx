"use client";

import { useCallback } from "react";
import { Upload, User, ClipboardList, Eraser, Loader2 } from "lucide-react";
import { POSITIONS, CARD_THEMES } from "./constants";
import type { PlayerData } from "./types";
import type { RemovalStatus } from "./useBackgroundRemoval";

interface EditorFormProps {
  data: PlayerData;
  onChange: (data: PlayerData) => void;
  onRemoveBackground?: () => void;
  bgRemovalStatus?: RemovalStatus;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/8 bg-[#1a1a1e] px-3 py-2 text-sm text-text-1 outline-none transition-colors placeholder:text-text-3/50 focus:border-accent/40";

const selectClass =
  "w-full rounded-lg border border-white/8 bg-[#1a1a1e] px-3 py-2 text-sm text-text-1 outline-none transition-colors focus:border-accent/40 cursor-pointer";

export default function EditorForm({ data, onChange, onRemoveBackground, bgRemovalStatus = "idle" }: EditorFormProps) {
  const update = useCallback(
    (key: keyof PlayerData, value: string) => {
      onChange({ ...data, [key]: value });
    },
    [data, onChange],
  );

  const handlePhoto = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) update("photoUrl", ev.target.result as string);
      };
      reader.readAsDataURL(file);
    },
    [update],
  );

  const handleTheme = useCallback(
    (themeId: string) => {
      const theme = CARD_THEMES.find((t) => t.id === themeId);
      if (!theme) return;
      onChange({
        ...data,
        themeId: theme.id,
        customClubColor: theme.color,
        customClubAccent: theme.accent,
      });
    },
    [data, onChange],
  );

  return (
    <aside className="w-full shrink-0 overflow-y-auto bg-[#0a0a0c] px-4 pt-3 pb-8 md:w-[360px] md:border-r md:border-white/6 md:bg-[#111114] md:p-5">
      {/* Section: Player Info */}
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text-1">
        <User className="h-4 w-4 text-accent" />
        선수 정보
      </div>

      {/* Photo Upload */}
      <FormField label="사진">
        <label
          htmlFor="editor-photo-input"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/3 py-5 text-sm text-text-3 transition-colors active:bg-accent/5"
        >
          {data.photoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photoUrl}
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
              />
              <span>사진 변경</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              선수 사진 업로드
            </>
          )}
        </label>
        <input
          id="editor-photo-input"
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          className="sr-only"
        />
        {data.photoUrl && onRemoveBackground && (
          <button
            type="button"
            onClick={onRemoveBackground}
            disabled={bgRemovalStatus === "loading" || bgRemovalStatus === "processing"}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/4 py-2 text-xs font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
          >
            {bgRemovalStatus === "loading" || bgRemovalStatus === "processing" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {bgRemovalStatus === "loading" ? "모델 로딩..." : "배경 제거 중..."}
              </>
            ) : bgRemovalStatus === "done" ? (
              <>
                <Eraser className="h-3.5 w-3.5" />
                배경 다시 제거
              </>
            ) : (
              <>
                <Eraser className="h-3.5 w-3.5" />
                배경 제거
              </>
            )}
          </button>
        )}
      </FormField>

      {/* Name */}
      <FormField label="이름">
        <input
          className={inputClass}
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="이름 입력"
        />
      </FormField>

      {/* Number + Position */}
      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="등번호">
          <input
            className={inputClass}
            type="number"
            value={data.number}
            onChange={(e) => update("number", e.target.value)}
            placeholder="9"
          />
        </FormField>
        <FormField label="포지션">
          <select
            className={selectClass}
            value={data.position}
            onChange={(e) => update("position", e.target.value)}
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* Team Name */}
      <FormField label="소속 팀">
        <input
          className={inputClass}
          value={data.teamName}
          onChange={(e) => update("teamName", e.target.value)}
          placeholder="예: 분당 유나이티드, 서울 드래곤즈 FC"
          maxLength={30}
        />
      </FormField>

      {/* Card Theme */}
      <div className="mb-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
          카드 테마
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {CARD_THEMES.map((theme) => {
            const isSelected = data.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleTheme(theme.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-1 transition-all ${
                  isSelected
                    ? "bg-white/10 ring-2 ring-accent/50"
                    : "bg-white/4 hover:bg-white/7 active:bg-white/10"
                }`}
              >
                {/* Two-tone swatch */}
                <div className="flex h-5 w-full max-w-[40px] overflow-hidden rounded-md">
                  <div className="flex-1" style={{ background: theme.color }} />
                  <div className="flex-1" style={{ background: theme.accent }} />
                </div>
                <span
                  className={`text-[10px] font-semibold leading-none ${
                    isSelected ? "text-white" : "text-text-3"
                  }`}
                >
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-white/6" />

      {/* Section: Detail Info */}
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text-1">
        <ClipboardList className="h-4 w-4 text-accent" />
        상세 정보
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="나이">
          <input
            className={inputClass}
            value={data.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="13"
          />
        </FormField>
        <FormField label="생년월일">
          <input
            className={inputClass}
            value={data.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
            placeholder="2014.03.22"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="키 (cm)">
          <input
            className={inputClass}
            type="number"
            value={data.height}
            onChange={(e) => update("height", e.target.value)}
            placeholder="160"
          />
        </FormField>
        <FormField label="몸무게 (kg)">
          <input
            className={inputClass}
            type="number"
            value={data.weight}
            onChange={(e) => update("weight", e.target.value)}
            placeholder="42"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="주발">
          <select
            className={selectClass}
            value={data.foot}
            onChange={(e) => update("foot", e.target.value)}
          >
            {["오른발", "왼발", "양발"].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="국적">
          <input
            className={inputClass}
            value={data.nationality}
            onChange={(e) => update("nationality", e.target.value)}
            placeholder="KOREA"
          />
        </FormField>
      </div>
    </aside>
  );
}
