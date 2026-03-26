"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { POSITIONS, POSITION_LABELS } from "@/lib/constants";
import SeasonAddSheet from "@/components/player/SeasonAddSheet";

interface ChildProfile {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  number: number | null;
  foot: string | null;
  birth_date: string | null;
  nationality: string | null;
  bio: string | null;
  level: number;
}

interface Season {
  id: string;
  profile_id: string;
  year: number;
  team_name: string;
  league: string | null;
  is_current: boolean;
  created_at: string;
}

const FOOT_OPTIONS = ["오른발", "왼발", "양발"] as const;

export default function ChildEditPage() {
  const router = useRouter();
  const { id: childId } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seasonSheetOpen, setSeasonSheetOpen] = useState(false);

  // Form state
  const [position, setPosition] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [number, setNumber] = useState("");
  const [foot, setFoot] = useState("오른발");
  const [birthDate, setBirthDate] = useState("");
  const [nationality, setNationality] = useState("");

  // Fetch profile + seasons
  useEffect(() => {
    if (!childId) return;
    Promise.all([
      fetch(`/api/parent/child/${childId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/parent/child/${childId}/seasons`).then((r) => r.ok ? r.json() : null),
    ]).then(([prof, seasonsData]) => {
      if (prof) {
        setProfile(prof);
        setPosition(prof.position ?? "");
        setHeight(prof.height?.toString() ?? "");
        setWeight(prof.weight?.toString() ?? "");
        setNumber(prof.number?.toString() ?? "");
        setFoot(prof.foot ?? "오른발");
        setBirthDate(prof.birth_date ?? "");
        setNationality(prof.nationality ?? "");
      }
      if (seasonsData?.seasons) setSeasons(seasonsData.seasons);
      setLoading(false);
    });
  }, [childId]);

  const handleSave = useCallback(async () => {
    if (!childId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/parent/child/${childId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: position || null,
          height: height ? Number(height) : null,
          weight: weight ? Number(weight) : null,
          number: number ? Number(number) : null,
          foot: foot || null,
          birth_date: birthDate || null,
          nationality: nationality || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [childId, position, height, weight, number, foot, birthDate, nationality]);

  const handleAddSeason = useCallback(
    async (params: { year: number; teamName: string; league?: string; isNewTeam: boolean }) => {
      if (!childId) return;
      const res = await fetch(`/api/parent/child/${childId}/seasons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        // Refetch seasons
        const data = await fetch(`/api/parent/child/${childId}/seasons`).then((r) => r.json());
        if (data?.seasons) setSeasons(data.seasons);
      }
    },
    [childId]
  );

  const handleDeleteSeason = useCallback(
    async (seasonId: string) => {
      if (!childId) return;
      const res = await fetch(`/api/parent/child/${childId}/seasons?seasonId=${seasonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSeasons((prev) => prev.filter((s) => s.id !== seasonId));
      }
    },
    [childId]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-text-3">프로필을 불러올 수 없습니다</p>
        <button onClick={() => router.back()} className="text-sm font-semibold text-accent">
          돌아가기
        </button>
      </div>
    );
  }

  const isIncomplete = !position || !height || !number;

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-2 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-bold text-text-1">{profile.name} 선수 관리</h1>
          <p className="text-[12px] text-text-3">@{profile.handle}</p>
        </div>
        {isIncomplete && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
            미완성
          </span>
        )}
      </div>

      {/* Profile Info Section */}
      <section className="rounded-2xl border border-white/[0.06] bg-card p-4">
        <h2 className="mb-4 text-[14px] font-bold text-text-1">기본 정보</h2>

        {/* Position */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-text-3">포지션</label>
          <div className="flex gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPosition(p)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                  position === p
                    ? "bg-accent text-bg"
                    : "bg-surface text-text-2 active:bg-white/8"
                }`}
              >
                {POSITION_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Number */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-text-3">등번호</label>
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="등번호"
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/40"
          />
        </div>

        {/* Height + Weight */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">키 (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="160"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">몸무게 (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="48"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* Foot */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-text-3">주발</label>
          <div className="flex gap-2">
            {FOOT_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFoot(f)}
                className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                  foot === f
                    ? "bg-accent text-bg"
                    : "bg-surface text-text-2 active:bg-white/8"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Birth Date + Nationality */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">생년월일</label>
            <input
              type="text"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              placeholder="2014.03.22"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-3">국적</label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="대한민국"
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-2 w-full rounded-xl py-3.5 text-[14px] font-bold transition-all active:scale-[0.99] disabled:opacity-50"
          style={{
            background: saved ? "var(--color-accent)" : "var(--accent-gradient)",
            color: "#0C0C0E",
          }}
        >
          {saving ? "저장 중..." : saved ? "저장 완료 ✓" : "저장"}
        </button>
      </section>

      {/* Season History Section */}
      <section className="rounded-2xl border border-white/[0.06] bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-text-1">시즌 기록</h2>
          <button
            type="button"
            onClick={() => setSeasonSheetOpen(true)}
            className="rounded-lg bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors active:bg-accent/25"
          >
            + 추가
          </button>
        </div>

        {seasons.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="text-2xl">📋</span>
            <p className="text-[13px] text-text-3">등록된 시즌 기록이 없습니다</p>
            <button
              type="button"
              onClick={() => setSeasonSheetOpen(true)}
              className="mt-1 text-[13px] font-semibold text-accent"
            >
              첫 시즌 기록 추가하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-bg px-4 py-3"
              >
                {/* Timeline dot */}
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: season.is_current ? "var(--color-accent)" : "transparent",
                    border: season.is_current ? "none" : "2px solid var(--color-text-3)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-1 truncate">
                      {season.team_name}
                    </span>
                    {season.is_current && (
                      <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                        현재
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-3">
                    {season.year}년{season.league ? ` · ${season.league}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSeason(season.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-text-3 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Season Add Sheet */}
      <SeasonAddSheet
        open={seasonSheetOpen}
        onClose={() => setSeasonSheetOpen(false)}
        onSave={handleAddSeason}
      />
    </div>
  );
}
