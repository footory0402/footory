"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

interface ContactSettings {
  email: string | null;
  show_email: boolean;
  show_phone: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<ContactSettings>({
    email: null,
    show_email: false,
    show_phone: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("public_email, show_email, show_phone")
        .eq("id", user.id)
        .single();

      setSettings({
        email: user.email ?? data?.public_email ?? null,
        show_email: data?.show_email ?? false,
        show_phone: data?.show_phone ?? false,
      });
      setLoading(false);
    }
    load();
  }, []);

  const toggleSetting = async (key: "show_email" | "show_phone") => {
    setSaving(true);
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ [key]: newValue })
        .eq("id", user.id);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4">
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-text-1">설정</h2>
      </div>

      {/* 계정 정보 */}
      <SettingsSection title="계정 정보">
        <SettingsRow
          icon={<MailIcon />}
          label="카카오 연동 이메일"
          value={settings.email ?? "미등록"}
        />
      </SettingsSection>

      {/* 연락처 공개 설정 */}
      <SettingsSection title="연락처 공개 설정">
        <ToggleRow
          icon={<MailIcon />}
          label="이메일 공개"
          description="스카우터에게 이메일을 공개합니다"
          checked={settings.show_email}
          onChange={() => toggleSetting("show_email")}
          disabled={saving}
        />
        <div className="mx-4 border-t border-border" />
        <ToggleRow
          icon={<PhoneIcon />}
          label="전화번호 공개"
          description="스카우터에게 전화번호를 공개합니다"
          checked={settings.show_phone}
          onChange={() => toggleSetting("show_phone")}
          disabled={saving}
        />
      </SettingsSection>

      {/* 부모/자녀 연동 */}
      <SettingsSection title="부모/자녀 연동">
        <SettingsRow
          icon={<LinkIcon />}
          label="연동 코드"
          value="준비 중"
          dimValue
        />
      </SettingsSection>

      {/* 알림 설정 */}
      <SettingsSection title="알림 설정">
        <SettingsRow
          icon={<BellIcon />}
          label="푸시 알림"
          value="준비 중"
          dimValue
        />
      </SettingsSection>

      {/* 차단/신고 */}
      <SettingsSection title="차단/신고">
        <SettingsRow
          icon={<ShieldIcon />}
          label="차단 목록"
          value="없음"
          dimValue
        />
      </SettingsSection>

      {/* 약관 */}
      <SettingsSection title="약관">
        <SettingsLinkRow label="이용약관" />
        <div className="mx-4 border-t border-border" />
        <SettingsLinkRow label="개인정보처리방침" />
      </SettingsSection>

      {/* 고객지원 */}
      <SettingsSection title="고객지원">
        <a href="mailto:support@footory.app" className="block px-4 py-3">
          <span className="text-sm text-accent">support@footory.app</span>
        </a>
      </SettingsSection>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-xl bg-card py-3.5 text-center text-sm font-medium text-red transition-colors active:bg-elevated"
      >
        로그아웃
      </button>

      <p className="mt-4 text-center text-xs text-text-3">FOOTORY v1.0.0</p>
    </div>
  );
}

/* --- Sub-components --- */

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-text-3">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl bg-card">{children}</div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  dimValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dimValue?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-accent">{icon}</span>
        <span className="text-sm text-text-1">{label}</span>
      </div>
      <span className={`text-sm ${dimValue ? "text-text-3" : "text-text-2"}`}>{value}</span>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-accent">{icon}</span>
        <div>
          <p className="text-sm text-text-1">{label}</p>
          <p className="text-xs text-text-3">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-elevated"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsLinkRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-text-1">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

/* --- Icons --- */

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
