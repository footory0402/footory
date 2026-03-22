import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ handle: string; clipId: string }>;
}

async function getHighlightData(handle: string, clipId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, name, position, birth_year, avatar_url")
    .eq("handle", handle)
    .single();

  if (!profile) return null;

  const { data: clipRaw } = await supabase
    .from("clips")
    .select("id, video_url, thumbnail_url, duration_seconds, highlight_status")
    .eq("id", clipId)
    .eq("owner_id", profile.id)
    .single();

  const { data: clipTagsRaw } = await supabase
    .from("clip_tags")
    .select("tag_name")
    .eq("clip_id", clipId);

  if (!clipRaw) return null;
  const clip = { ...clipRaw, clip_tags: clipTagsRaw ?? [] };

  return { profile, clip };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, clipId } = await params;
  const data = await getHighlightData(handle, clipId);

  if (!data) return { title: "클립을 찾을 수 없습니다 — Footory" };

  const { profile, clip } = data;
  const tags = clip.clip_tags.map((t) => t.tag_name).join(", ");
  const description = `${profile.name}의 하이라이트 클립${tags ? ` · ${tags}` : ""}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://footory.app";

  return {
    title: `${profile.name} 하이라이트 — Footory`,
    description,
    openGraph: {
      title: `${profile.name} 하이라이트`,
      description,
      type: "video.other",
      url: `${baseUrl}/p/${handle}/h/${clipId}`,
      ...(clip.thumbnail_url ? { images: [{ url: clip.thumbnail_url }] } : {}),
      ...(clip.video_url ? { videos: [{ url: clip.video_url, type: "video/mp4" }] } : {}),
    },
    twitter: {
      card: "player",
      title: `${profile.name} 하이라이트`,
      description,
      ...(clip.thumbnail_url ? { images: [clip.thumbnail_url] } : {}),
    },
  };
}

export default async function HighlightSharePage({ params }: Props) {
  const { handle, clipId } = await params;
  const data = await getHighlightData(handle, clipId);

  if (!data) notFound();

  const { profile, clip } = data;
  const tags = clip.clip_tags.map((t) => t.tag_name);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "#070709", padding: "16px" }}
    >
      {/* Video player */}
      <div
        className="w-full max-w-[414px] overflow-hidden"
        style={{ borderRadius: 16, background: "#0D0D10" }}
      >
        <video
          src={clip.video_url}
          poster={clip.thumbnail_url ?? undefined}
          controls
          playsInline
          autoPlay
          style={{ width: "100%", display: "block", maxHeight: "70vh", background: "#000" }}
        />
      </div>

      {/* Player info + tags */}
      <div
        className="mt-4 w-full max-w-[414px]"
        style={{
          background: "#1C1C22",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "14px 16px",
        }}
      >
        <Link
          href={`/p/${handle}`}
          className="flex items-center gap-3"
          style={{ textDecoration: "none" }}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.name}
              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(212,168,83,0.15)",
                border: "1px solid rgba(212,168,83,0.2)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ⚽
            </div>
          )}
          <div className="flex flex-col" style={{ minWidth: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 15,
                color: "#FAFAFA",
                lineHeight: 1.3,
              }}
            >
              {profile.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "#A1A1AA",
              }}
            >
              @{profile.handle}
              {profile.position ? ` · ${profile.position}` : ""}
            </span>
          </div>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#D4A853",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              flexShrink: 0,
            }}
          >
            프로필 보기 ›
          </span>
        </Link>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-[6px]">
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-body)",
                  background: "rgba(212,168,83,0.1)",
                  border: "1px solid rgba(212,168,83,0.2)",
                  color: "#D4A853",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footory branding */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#D4A853",
            textDecoration: "none",
          }}
        >
          FOOTORY
        </Link>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "#71717A",
            textAlign: "center",
          }}
        >
          유소년 축구 선수 하이라이트 플랫폼
        </p>
      </div>
    </div>
  );
}
