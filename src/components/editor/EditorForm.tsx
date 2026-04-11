"use client";

import {
  useCallback,
  type ChangeEventHandler,
  type ReactNode,
} from "react";
import {
  User,
  ClipboardList,
  Palette,
  Camera,
  Upload,
  Eraser,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { POSITIONS, CARD_THEMES } from "./constants";
import type { PlayerData } from "./types";
import type { RemovalStatus } from "./useBackgroundRemoval";

interface EditorFormProps {
  data: PlayerData;
  onChange: (data: PlayerData) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBackground: () => void;
  bgRemovalStatus: RemovalStatus;
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

function FormField({ label, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[1.2px] text-text-3">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-[#151519] px-3.5 py-3 text-sm text-text-1 outline-none transition-colors placeholder:text-text-3/50 focus:border-accent/40";

const selectClass =
  "editor-select w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-[#151519] px-3.5 py-3 pr-10 text-sm text-text-1 outline-none transition-colors focus:border-accent/40";


function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,_rgba(22,22,26,0.96),_rgba(12,12,14,0.98))] shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
      <div className="border-b border-white/8 px-4 py-4 md:px-5">
        <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-text-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/12 text-accent">
            {icon}
          </span>
          {title}
        </div>
        <p className="text-sm leading-6 text-text-3">{description}</p>
      </div>
      <div className="px-4 py-4 md:px-5 md:py-5">{children}</div>
    </section>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select className={selectClass} value={value} onChange={onChange}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
    </div>
  );
}

export default function EditorForm({
  data,
  onChange,
  onPhotoChange,
  onRemoveBackground,
  bgRemovalStatus,
}: EditorFormProps) {
  const update = useCallback(
    (key: keyof PlayerData, value: string) => {
      onChange({ ...data, [key]: value });
    },
    [data, onChange],
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

  const isBgRemoving =
    bgRemovalStatus === "loading" || bgRemovalStatus === "processing";

  return (
    <aside className="grid gap-4 pb-2">

      {/* ① 선수 사진 — 가장 임팩트 큰 항목 */}
      <Section
        icon={<Camera className="h-4 w-4" />}
        title="선수 사진"
        description="사진이 카드의 첫인상입니다. 배경을 정리하면 더 깔끔하게 나옵니다."
      >
        <div className="flex items-start gap-3">
          {/* 썸네일 */}
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt="선수 사진"
              className="h-20 w-20 shrink-0 rounded-2xl object-cover object-top ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/14 bg-white/[0.04]">
              <Camera className="h-7 w-7 text-text-3/50" />
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex flex-1 flex-col gap-2">
            <label
              htmlFor="editor-photo-input"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-text-1 transition-colors active:bg-accent/8"
            >
              <Upload className="h-4 w-4 text-accent" />
              {data.photoUrl ? "사진 바꾸기" : "사진 올리기"}
            </label>
            <input
              id="editor-photo-input"
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="sr-only"
            />

            {data.photoUrl && (
              <button
                type="button"
                onClick={() => void onRemoveBackground()}
                disabled={isBgRemoving}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#17171b] px-4 py-3 text-sm font-semibold text-text-2 transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
              >
                {isBgRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {bgRemovalStatus === "loading"
                      ? "모델 불러오는 중..."
                      : "배경 제거 중..."}
                  </>
                ) : bgRemovalStatus === "done" ? (
                  <>
                    <Eraser className="h-4 w-4 text-accent" />
                    배경 다시 정리
                  </>
                ) : (
                  <>
                    <Eraser className="h-4 w-4" />
                    배경 정리
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ② 기본 정보 — 카드에서 가장 먼저 읽히는 정보 */}
      <Section
        icon={<User className="h-4 w-4" />}
        title="기본 정보"
        description="이름·팀·번호만 맞춰도 카드가 바로 정리됩니다."
      >
        {/* 2열 그리드: 이름(2fr) + 등번호(1fr), 팀(2fr) + 포지션(1fr) */}
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <FormField label="이름">
            <input
              className={inputClass}
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="이름 입력"
            />
          </FormField>

          <FormField label="등번호">
            <input
              className={inputClass}
              type="number"
              value={data.number}
              onChange={(e) => update("number", e.target.value)}
              placeholder="9"
            />
          </FormField>

          <FormField label="소속 팀">
            <input
              className={inputClass}
              value={data.teamName}
              onChange={(e) => update("teamName", e.target.value)}
              placeholder="예: 분당 유나이티드"
              maxLength={30}
            />
          </FormField>

          <FormField label="포지션">
            <SelectField
              value={data.position}
              onChange={(e) => update("position", e.target.value)}
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
          </FormField>
        </div>
      </Section>

      {/* ③ 카드 테마 — 비주얼 임팩트 크고 빠르게 변경 가능 */}
      <Section
        icon={<Palette className="h-4 w-4" />}
        title="카드 테마"
        description="내용은 그대로 두고 색감만 빠르게 비교할 수 있습니다."
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {CARD_THEMES.map((theme) => {
            const isSelected = data.themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleTheme(theme.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition-all ${
                  isSelected
                    ? "border-accent/40 bg-accent/10 shadow-[0_10px_24px_rgba(212,168,83,0.12)]"
                    : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08]"
                }`}
              >
                <div className="flex h-6 w-full max-w-[44px] overflow-hidden rounded-lg">
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
      </Section>

      {/* ④ 세부 정보 — 선택 입력, 필요한 만큼만 */}
      <Section
        icon={<ClipboardList className="h-4 w-4" />}
        title="세부 정보"
        description="선택 사항입니다. 필요한 항목만 채우면 됩니다."
      >
        {/* Row 1: 나이(좁게) + 생년월일(넓게) */}
        <div className="grid grid-cols-[1fr_2fr] gap-3">
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

        {/* Row 2: 키 / 몸무게 / 주발 / 국적 — 2열씩 */}
        <div className="mt-3 grid grid-cols-2 gap-3">
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
          <FormField label="주발">
            <SelectField
              value={data.foot}
              onChange={(e) => update("foot", e.target.value)}
            >
              {["오른발", "왼발", "양발"].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </SelectField>
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
      </Section>
    </aside>
  );
}
