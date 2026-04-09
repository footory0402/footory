import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizeHighlightPublishState } from "@/lib/publish-state";
import ReelShareClient from "./ReelShareClient";

interface Props {
  params: Promise<{ id: string }>;
}

async function getReelData(id: string) {
  const supabase = await createClient();

  // highlights 테이블 RLS: anon SELECT 허용 필요
  const { data: reel } = await supabase
    .from("highlights")
    .select("id, title, clip_ids, owner_id, thumbnail_url, status")
    .eq("id", id)
    .single();

  if (!reel) return null;
  if (normalizeHighlightPublishState(reel.status) !== "published") return null;

  // 소유자 프로필
  const [{ data: profile }, { data: activeTeam }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, name, position, birth_year, avatar_url")
      .eq("id", reel.owner_id)
      .single(),
    supabase
      .from("team_members")
      .select("team_id, teams(name)")
      .eq("profile_id", reel.owner_id)
      .neq("role", "alumni")
      .limit(1)
      .single(),
  ]);

  if (!profile) return null;

  // 클립 데이터 (순서 보장)
  const { data: clips } = await supabase
    .from("clips")
    .select("id, video_url, thumbnail_url, duration_seconds, memo, spotlight_x, spotlight_y, freeze_at, trim_start, trim_end, slowmo_start, slowmo_end, slowmo_speed, bgm_id, effects")
    .in("id", reel.clip_ids);

  const clipsMap = new Map((clips ?? []).map((c) => [c.id, c]));
  const orderedClips = (reel.clip_ids as string[])
    .map((cid) => clipsMap.get(cid))
    .filter(Boolean) as NonNullable<typeof clips>;

  const teamData = activeTeam as { teams?: { name?: string | null } | null } | null;
  return { reel, profile: { ...profile, teamName: teamData?.teams?.name ?? null }, clips: orderedClips };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getReelData(id);

  if (!data) return { title: "릴을 찾을 수 없습니다 — Footory" };

  const { reel, profile } = data;
  const title = reel.title ? `${reel.title} — ${profile.name}` : `${profile.name}의 하이라이트 릴`;
  const description = `${profile.name}${profile.position ? ` · ${profile.position}` : ""}의 하이라이트 릴 · 클립 ${reel.clip_ids.length}개`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://footory.app";

  return {
    title: `${title} — Footory`,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      url: `${baseUrl}/reel/${id}`,
      ...((reel as { thumbnail_url?: string | null }).thumbnail_url
        ? { images: [{ url: (reel as { thumbnail_url: string }).thumbnail_url }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...((reel as { thumbnail_url?: string | null }).thumbnail_url
        ? { images: [(reel as { thumbnail_url: string }).thumbnail_url] }
        : {}),
    },
  };
}

export default async function ReelSharePage({ params }: Props) {
  const { id } = await params;
  const data = await getReelData(id);

  if (!data) notFound();

  const { reel, profile, clips } = data;

  const playableClips = clips.map((c) => ({
    id: c.id,
    videoUrl: c.video_url,
    thumbnailUrl: c.thumbnail_url ?? null,
    memo: c.memo ?? null,
    durationSeconds: c.duration_seconds ?? null,
    spotlightX: c.spotlight_x ?? null,
    spotlightY: c.spotlight_y ?? null,
    freezeAt: c.freeze_at ?? null,
    trimStart: c.trim_start ?? null,
    trimEnd: c.trim_end ?? null,
    slowmoStart: c.slowmo_start ?? null,
    slowmoEnd: c.slowmo_end ?? null,
    slowmoSpeed: c.slowmo_speed ?? null,
    bgmId: c.bgm_id ?? null,
    effects: c.effects as Record<string, unknown> | null,
    playerName: profile.name,
    playerPosition: profile.position ?? null,
    playerBirthYear: profile.birth_year ?? null,
    teamName: profile.teamName ?? null,
  }));

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: "#070709" }}>
      {/* 상단 헤더 */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href={`/p/${profile.handle}`} className="flex items-center gap-3" style={{ textDecoration: "none" }}>
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.name}
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212,168,83,0.15)", border: "1px solid rgba(212,168,83,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              ⚽
            </div>
          )}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "#FAFAFA", margin: 0 }}>
              {profile.name}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {profile.position ?? "선수"} · 클립 {clips.length}개
            </p>
          </div>
        </Link>

        {/* 릴 제목 */}
        {reel.title && (
          <div
            className="ml-auto shrink-0"
            style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.2)", borderRadius: 6, padding: "3px 8px" }}
          >
            <span style={{ fontFamily: "var(--font-stat)", fontSize: 10, fontWeight: 700, color: "var(--color-accent)", letterSpacing: "0.04em" }}>
              {reel.title}
            </span>
          </div>
        )}
      </div>

      {/* 클라이언트 플레이어 */}
      <ReelShareClient clips={playableClips} profileHandle={profile.handle} />

      {/* Footory 배지 */}
      <div className="flex items-center justify-center py-4">
        <Link href="/" style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "rgba(212,168,83,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>
          FOOTORY
        </Link>
      </div>
    </div>
  );
}
