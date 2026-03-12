"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Profile } from "@/lib/types";
import { POSITIONS, POSITION_LABELS, HANDLE_REGEX, type Position } from "@/lib/constants";
import { toast } from "@/components/ui/Toast";

interface ProfileEditSheetProps {
  profile: Profile;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onCheckHandle: (handle: string) => Promise<boolean>;
}

export default function ProfileEditSheet({
  profile,
  open,
  onClose,
  onSave,
  onAvatarUpload,
  onCheckHandle,
}: ProfileEditSheetProps) {
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [position, setPosition] = useState<Position | "">(profile.position ?? "");
  const [birthYear, setBirthYear] = useState(profile.birthYear ? String(profile.birthYear) : "");
  const [city, setCity] = useState(profile.city ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [heightCm, setHeightCm] = useState(profile.heightCm ? String(profile.heightCm) : "");
  const [weightKg, setWeightKg] = useState(profile.weightKg ? String(profile.weightKg) : "");
  const [preferredFoot, setPreferredFoot] = useState(profile.preferredFoot ?? "");
  const [saving, setSaving] = useState(false);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Reset form when profile changes
  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
    setPosition(profile.position ?? "");
    setBirthYear(profile.birthYear ? String(profile.birthYear) : "");
    setCity(profile.city ?? "");
    setBio(profile.bio ?? "");
    setHeightCm(profile.heightCm ? String(profile.heightCm) : "");
    setWeightKg(profile.weightKg ? String(profile.weightKg) : "");
    setPreferredFoot(profile.preferredFoot ?? "");
    setHandleStatus("idle");
  }, [profile]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const checkHandle = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value === profile.handle) {
        setHandleStatus("idle");
        return;
      }
      if (!HANDLE_REGEX.test(value)) {
        setHandleStatus("taken");
        return;
      }
      setHandleStatus("checking");
      debounceRef.current = setTimeout(async () => {
        const available = await onCheckHandle(value);
        setHandleStatus(available ? "available" : "taken");
      }, 300);
    },
    [profile.handle, onCheckHandle]
  );

  const handleSave = async () => {
    if (handleStatus === "taken" || handleStatus === "checking") return;
    setSaving(true);
    try {
      await onSave({
        name,
        handle,
        position: position || null,
        birth_year: birthYear ? Number(birthYear) : null,
        city: city || null,
        bio: bio || null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        preferred_foot: preferredFoot || null,
      });
      onClose();
    } catch {
      toast("프로필 저장에 실패했습니다", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onAvatarUpload(file);
    } catch {
      toast("프로필 사진 업로드에 실패했습니다", "error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex max-h-[80vh] flex-col">
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <h2 className="mb-5 text-lg font-bold text-text-1">프로필 편집</h2>

            {/* Avatar */}
            <div className="mb-6 flex justify-center">
              <button onClick={handleAvatarClick} className="group relative">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-border">
                  {profile.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.name} width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-text-3">
                      {profile.name[0]}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <span className="mt-1.5 block text-center text-[11px] text-accent">사진 변경</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Section 1: 기본 정보 */}
            <SectionHeader label="기본 정보" />
            <div className="space-y-4">
              <Field label="이름" value={name} onChange={setName} placeholder="이름을 입력하세요" />

              <div>
                <label className="mb-1 block text-xs text-text-3">프로필 주소</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-3">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      setHandle(v);
                      checkHandle(v);
                    }}
                    className="w-full rounded-lg bg-bg px-3 py-2.5 pl-7 text-sm text-text-1 outline-none ring-1 ring-border focus:ring-accent"
                  />
                </div>
                {handleStatus === "idle" && handle === profile.handle && (
                  <p className="mt-1 text-xs text-text-3">footory.com/p/{handle}</p>
                )}
                {handleStatus === "checking" && (
                  <p className="mt-1 text-xs text-text-3">확인 중...</p>
                )}
                {handleStatus === "available" && (
                  <p className="mt-1 text-xs text-green">사용 가능 (footory.com/p/{handle})</p>
                )}
                {handleStatus === "taken" && (
                  <p className="mt-1 text-xs text-red">사용 불가</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-3">포지션</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      className={`rounded-lg py-2.5 text-xs font-medium transition-colors ${
                        position === pos
                          ? "bg-accent text-bg"
                          : "bg-bg text-text-2 ring-1 ring-border"
                      }`}
                    >
                      {POSITION_LABELS[pos]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="출생연도"
                  value={birthYear}
                  onChange={setBirthYear}
                  type="number"
                  inputMode="numeric"
                  placeholder="2010"
                />
                <Field label="도시" value={city} onChange={setCity} placeholder="서울" />
              </div>
            </div>

            {/* Section 2: 신체 정보 */}
            <SectionHeader label="신체 정보 (선택)" className="mt-6" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="키 (cm)"
                  value={heightCm}
                  onChange={setHeightCm}
                  type="number"
                  inputMode="numeric"
                  placeholder="170"
                />
                <Field
                  label="몸무게 (kg)"
                  value={weightKg}
                  onChange={setWeightKg}
                  type="number"
                  inputMode="numeric"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-text-3">주발</label>
                <div className="flex gap-2">
                  {["오른발", "왼발", "양발"].map((foot) => (
                    <button
                      key={foot}
                      onClick={() => setPreferredFoot(foot)}
                      className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-colors ${
                        preferredFoot === foot
                          ? "bg-accent text-bg"
                          : "bg-bg text-text-2 ring-1 ring-border"
                      }`}
                    >
                      {foot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: 소개 */}
            <SectionHeader label="소개" className="mt-6" />
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="좋아하는 선수, 플레이 스타일, 목표 등"
                className="w-full rounded-lg bg-bg px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none ring-1 ring-border focus:ring-accent"
              />
              <p className="mt-0.5 text-right text-[10px] text-text-3">{bio.length}/200</p>
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="shrink-0 border-t border-white/[0.06] bg-card px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || handleStatus === "taken" || handleStatus === "checking"}
                className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-bg disabled:opacity-50"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`mb-3 flex items-center gap-2 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-3">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text";
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-3">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-bg px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none ring-1 ring-border focus:ring-accent"
      />
    </div>
  );
}
