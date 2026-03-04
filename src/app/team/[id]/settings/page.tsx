"use client";

import { useState, use, useEffect } from "react";
import { useTeamDetail, useTeamActions } from "@/hooks/useTeam";
import Button from "@/components/ui/Button";

export default function TeamSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { team, loading } = useTeamDetail(id);
  const { updateTeam } = useTeamActions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description ?? "");
      setCity(team.city ?? "");
    }
  }, [team]);

  if (loading || !team) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (team.myRole !== "admin") {
    return (
      <div className="pt-20 text-center text-[14px] text-text-3">
        관리자만 접근할 수 있습니다
      </div>
    );
  }

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateTeam(id, {
        name: name.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
      });
      setMessage("저장되었습니다");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 pb-24 pt-4">
      <h1 className="mb-6 text-[17px] font-bold text-text-1">팀 설정</h1>

      <div className="space-y-4">
        {/* Invite code */}
        <div className="rounded-[10px] border border-border bg-card p-4">
          <label className="mb-2 block text-[12px] font-medium text-text-3">초대코드</label>
          <div className="flex items-center gap-3">
            <span className="font-stat text-[24px] tracking-[0.3em] text-accent">
              {team.inviteCode}
            </span>
            <button
              onClick={copyInviteCode}
              className="rounded-full border border-border px-3 py-1 text-[12px] text-text-2 hover:border-accent"
            >
              {copied ? "복사됨!" : "복사"}
            </button>
          </div>
        </div>

        {/* Edit fields */}
        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-3">팀 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-3">소개</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-3">지역</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] text-text-1 focus:border-accent focus:outline-none"
          />
        </div>

        {message && (
          <p className={`text-[12px] ${message.includes("저장") ? "text-green" : "text-red"}`}>
            {message}
          </p>
        )}

        <Button variant="primary" size="full" onClick={onSave} disabled={!name.trim() || saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
