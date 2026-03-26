"use client";

import { useCallback, useRef } from "react";
import { Upload, User, ClipboardList, Eraser, Loader2 } from "lucide-react";
import { POSITIONS, CLUBS, FOOT_OPTIONS } from "./constants";
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
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <aside className="w-full shrink-0 overflow-y-auto border-b border-white/6 bg-[#111114] p-5 md:w-[360px] md:border-b-0 md:border-r">
      {/* Section: Player Info */}
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text-1">
        <User className="h-4 w-4 text-accent" />
        선수 정보
      </div>

      {/* Photo Upload */}
      <FormField label="사진">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 bg-white/3 py-5 text-sm text-text-3 transition-colors hover:border-accent/30 hover:bg-accent/5"
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
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          className="hidden"
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
      <div className="grid grid-cols-2 gap-2.5">
        <FormField label="성">
          <input
            className={inputClass}
            value={data.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="최"
          />
        </FormField>
        <FormField label="이름">
          <input
            className={inputClass}
            value={data.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="강"
          />
        </FormField>
      </div>

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

      {/* Club */}
      <FormField label="소속 팀">
        <div className="flex flex-col gap-2">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {CLUBS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  if (c.name === "직접 입력") {
                    update("club", "직접 입력");
                  } else {
                    onChange({ ...data, club: c.name, customClubName: "", customClubColor: c.color, customClubAccent: c.accent });
                  }
                }}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                  data.club === c.name
                    ? "bg-accent/15 text-accent ring-1 ring-accent/30"
                    : "bg-white/4 text-text-3 hover:text-text-2"
                }`}
              >
                {c.name === "직접 입력" ? "기타" : c.name.replace(" U12", "")}
              </button>
            ))}
          </div>

          {/* Custom club name */}
          {data.club === "직접 입력" && (
            <input
              className={inputClass}
              value={data.customClubName}
              onChange={(e) => update("customClubName", e.target.value)}
              placeholder="팀 이름 입력"
            />
          )}
        </div>
      </FormField>

      {/* Card Colors — always visible */}
      <div className="mb-3 rounded-lg border border-white/6 bg-white/3 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-text-3">
          카드 배경 컬러
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="mb-1 text-[10px] text-text-3">메인</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.customClubColor}
                onChange={(e) => update("customClubColor", e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                className={inputClass}
                value={data.customClubColor}
                onChange={(e) => update("customClubColor", e.target.value)}
                placeholder="#37474F"
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] text-text-3">액센트</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.customClubAccent}
                onChange={(e) => update("customClubAccent", e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                className={inputClass}
                value={data.customClubAccent}
                onChange={(e) => update("customClubAccent", e.target.value)}
                placeholder="#78909C"
                maxLength={7}
              />
            </div>
          </div>
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
            {FOOT_OPTIONS.map((f) => (
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
