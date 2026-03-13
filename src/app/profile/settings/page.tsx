"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import { usePushNotification } from "@/hooks/usePushNotification";

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
  const [role, setRole] = useState<string | null>(null);
  const [linkedParents, setLinkedParents] = useState<{ linkId: string; parentId: string; name: string; handle: string; avatarUrl: string | null; linkedAt: string }[]>([]);
  const { permission: pushPermission, loading: pushLoading, requestPermission } = usePushNotification();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile query + linked-parents fetch in parallel
      const [profileResult, parentsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("role, public_email, show_email, show_phone")
          .eq("id", user.id)
          .single(),
        fetch("/api/profile/linked-parents").catch(() => null),
      ]);

      const data = profileResult.data;
      setRole(data?.role ?? null);
      setSettings({
        email: user.email ?? data?.public_email ?? null,
        show_email: data?.show_email ?? false,
        show_phone: data?.show_phone ?? false,
      });

      if (data?.role === "player" && parentsRes?.ok) {
        setLinkedParents(await parentsRes.json());
      }

      setLoading(false);
    }
    load();
  }, []);

  const toggleSetting = async (key: "show_email" | "show_phone") => {
    setSaving(true);
    const prevValue = settings[key];
    const newValue = !prevValue;
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({ [key]: newValue })
          .eq("id", user.id);
        if (error) throw error;
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: prevValue }));
      toast("설정 변경에 실패했습니다", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const unlinkParent = useCallback(async (linkId: string, parentName: string) => {
    if (!confirm(`${parentName} 보호자의 연동을 해제하시겠습니까?`)) return;
    const res = await fetch(`/api/profile/linked-parents?linkId=${linkId}`, { method: "DELETE" });
    if (res.ok) {
      setLinkedParents((prev) => prev.filter((p) => p.linkId !== linkId));
      toast("보호자 연동이 해제되었습니다", "success");
    } else {
      toast("연동 해제에 실패했습니다", "error");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
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

      {/* 그룹 1: 계정 */}
      <SettingsGroup title="계정">
        <SettingsRow
          icon={<MailIcon />}
          label="카카오 연동 이메일"
          value={settings.email ?? "미등록"}
        />
      </SettingsGroup>

      {/* 그룹 2: 공개 설정 */}
      <SettingsGroup title="공개 설정">
        <ToggleRow
          icon={<MailIcon />}
          label="이메일 공개"
          description="스카우터에게 이메일을 공개합니다"
          checked={settings.show_email}
          onChange={() => toggleSetting("show_email")}
          disabled={saving}
        />
        <div className="mx-4 border-t border-white/[0.06]" />
        <ToggleRow
          icon={<PhoneIcon />}
          label="전화번호 공개"
          description="스카우터에게 전화번호를 공개합니다"
          checked={settings.show_phone}
          onChange={() => toggleSetting("show_phone")}
          disabled={saving}
        />
      </SettingsGroup>

      {/* 그룹 3: 연동 (부모 역할) */}
      {role === "parent" && (
        <SettingsGroup title="연동">
          <button
            onClick={() => router.push("/profile/children")}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-accent"><LinkIcon /></span>
              <div className="text-left">
                <p className="text-sm text-text-1">자녀 연동 관리</p>
                <p className="text-xs text-text-3">연결된 자녀 확인 및 추가/해제</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </SettingsGroup>
      )}

      {/* 그룹 3b: 연동된 보호자 (선수 역할) */}
      {role === "player" && (
        <SettingsGroup title="연동된 보호자">
          {linkedParents.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-sm text-text-3">연동된 보호자가 없습니다</p>
            </div>
          ) : (
            linkedParents.map((parent, idx) => (
              <div key={parent.linkId}>
                {idx > 0 && <div className="mx-4 border-t border-white/[0.06]" />}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                      {parent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-1">{parent.name}</p>
                      <p className="text-xs text-text-3">@{parent.handle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => unlinkParent(parent.linkId, parent.name)}
                    className="text-xs text-text-3 hover:text-red-400"
                  >
                    해제
                  </button>
                </div>
              </div>
            ))
          )}
        </SettingsGroup>
      )}

      {/* 그룹 4: 알림 */}
      <SettingsGroup title="알림">
        {pushPermission === "granted" ? (
          <SettingsRow
            icon={<BellIcon />}
            label="푸시 알림"
            value="활성화됨"
          />
        ) : pushPermission === "denied" ? (
          <SettingsRow
            icon={<BellIcon />}
            label="푸시 알림"
            value="차단됨 (브라우저 설정에서 허용)"
            dimValue
          />
        ) : (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-accent"><BellIcon /></span>
              <div>
                <p className="text-sm text-text-1">푸시 알림</p>
                <p className="text-xs text-text-3">MVP 투표, 팔로우 등 알림 수신</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const ok = await requestPermission();
                if (ok) toast("푸시 알림이 활성화됐어요", "success");
              }}
              disabled={pushLoading}
              className="rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-bg disabled:opacity-50"
            >
              {pushLoading ? "..." : "허용"}
            </button>
          </div>
        )}
      </SettingsGroup>

      {/* 그룹 5: 기타 */}
      <SettingsGroup title="기타">
        <SettingsLinkRow label="이용약관" />
        <div className="mx-4 border-t border-white/[0.06]" />
        <SettingsLinkRow label="개인정보처리방침" />
        <div className="mx-4 border-t border-white/[0.06]" />
        <a href="mailto:support@footory.app" className="block px-4 py-3">
          <span className="text-sm text-accent">고객지원</span>
        </a>
        <div className="mx-4 border-t border-white/[0.06]" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-3"
        >
          <span className="text-sm font-medium text-red-400">로그아웃</span>
        </button>
      </SettingsGroup>

      <p className="mt-2 text-center text-xs text-text-3">FOOTORY v1.2.0</p>
    </div>
  );
}

/* --- Sub-components --- */

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-text-3">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl bg-card border border-white/[0.07]">
        {children}
      </div>
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

