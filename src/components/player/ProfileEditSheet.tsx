"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Profile } from "@/lib/types";
import { POSITIONS, POSITION_LABELS, type Position } from "@/lib/constants";

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
  const [position, setPosition] = useState<Position>(profile.position);
  const [birthYear, setBirthYear] = useState(String(profile.birthYear));
  const [city, setCity] = useState(profile.city);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Reset form when profile changes
  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
    setPosition(profile.position);
    setBirthYear(String(profile.birthYear));
    setCity(profile.city);
    setBio(profile.bio ?? "");
    setHandleStatus("idle");
  }, [profile]);

  const checkHandle = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value === profile.handle) {
        setHandleStatus("idle");
        return;
      }
      if (!/^[a-z0-9_]{3,20}$/.test(value)) {
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
        position,
        birth_year: Number(birthYear),
        city,
        bio: bio || null,
      });
      onClose();
    } catch {
      // Error handling delegated to parent
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
      // Error handling delegated to parent
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] animate-slide-up rounded-t-2xl bg-card">
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 pb-8">
          <h2 className="mb-5 text-lg font-bold text-text-1">프로필 편집</h2>

          {/* Avatar */}
          <div className="mb-5 flex justify-center">
            <button onClick={handleAvatarClick} className="group relative">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-border">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-text-3">
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
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <Field label="이름" value={name} onChange={setName} />

            <div>
              <label className="mb-1 block text-xs text-text-3">핸들</label>
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
              {handleStatus === "checking" && (
                <p className="mt-1 text-xs text-text-3">확인 중...</p>
              )}
              {handleStatus === "available" && (
                <p className="mt-1 text-xs text-green-400">사용 가능</p>
              )}
              {handleStatus === "taken" && (
                <p className="mt-1 text-xs text-red-400">사용 불가</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-text-3">포지션</label>
              <div className="flex gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                      position === pos
                        ? "bg-accent text-black"
                        : "bg-bg text-text-2 ring-1 ring-border"
                    }`}
                  >
                    {POSITION_LABELS[pos]}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="출생연도"
              value={birthYear}
              onChange={setBirthYear}
              type="number"
              inputMode="numeric"
            />

            <Field label="도시" value={city} onChange={setCity} />

            <div>
              <label className="mb-1 block text-xs text-text-3">자기소개</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full rounded-lg bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-1 ring-border focus:ring-accent"
              />
              <p className="mt-0.5 text-right text-[10px] text-text-3">{bio.length}/200</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-bg py-3 text-sm font-medium text-text-2 ring-1 ring-border"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || handleStatus === "taken" || handleStatus === "checking"}
              className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-3">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-1 ring-border focus:ring-accent"
      />
    </div>
  );
}
