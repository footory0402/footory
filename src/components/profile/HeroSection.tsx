"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";
import type { PlayStyle } from "@/lib/types";
import { PLAY_STYLES } from "@/lib/constants";

type TeamState = "has-team" | "no-team" | "transferring";

interface HeroSectionProps {
  profile: Profile;
  playStyle: PlayStyle | null;
  teamState: TeamState;
  onEdit?: () => void;
  onShare?: () => void;
  onPdf?: () => void;
  onAvatarUpload?: (file: File) => Promise<void>;
  onTeamChange?: () => void;
}

/* ── SVG Icon components ── */
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);
const IconFile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);
const IconChevronRight = ({ color = "currentColor", size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function HeroSectionInner({
  profile,
  playStyle,
  teamState,
  onEdit,
  onShare,
  onPdf,
  onAvatarUpload,
  onTeamChange,
}: HeroSectionProps) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const isOwn = !!onEdit;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAvatarUpload) return;
    setAvatarUploading(true);
    try {
      await onAvatarUpload(file);
      toast.success("프로필 사진이 변경되었습니다");
    } catch {
      toast.error("프로필 사진 업로드에 실패했습니다");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const preferredFootLabel =
    profile.preferredFoot === "right"
      ? "오른발"
      : profile.preferredFoot === "left"
        ? "왼발"
        : profile.preferredFoot === "both"
          ? "양발"
          : null;

  const safeAvatarUrl = profile.avatarUrl?.startsWith("http")
    ? profile.avatarUrl
    : undefined;

  const styleInfo = playStyle?.styleType
    ? PLAY_STYLES[playStyle.styleType]
    : null;

  const fmt = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const followsHref = (tab: string) =>
    isOwn
      ? `/profile/follows?tab=${tab}`
      : `/profile/follows?tab=${tab}&profileId=${profile.id}`;

  const physicalTags = [
    profile.birthYear ? `${profile.birthYear}년생` : null,
    profile.heightCm ? `${profile.heightCm}cm` : null,
    profile.weightKg ? `${profile.weightKg}kg` : null,
    preferredFootLabel,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* ═══════════════════════════════════════════
          CARD 1 — Player Identity
          ═══════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "var(--color-card)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Gold accent line — top edge */}
        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.5) 30%, rgba(212,168,83,0.7) 50%, rgba(212,168,83,0.5) 70%, transparent 100%)",
          }}
        />

        {/* Avatar row */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4">
          {/* Avatar — 88px square with gold ring */}
          <div className="relative shrink-0">
            <div
              className="overflow-hidden"
              style={{
                width: 88,
                height: 88,
                borderRadius: 22,
                padding: 2,
                background: safeAvatarUrl
                  ? "linear-gradient(135deg, rgba(212,168,83,0.6), rgba(212,168,83,0.15))"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="h-full w-full overflow-hidden"
                style={{
                  borderRadius: 20,
                  background: "var(--color-card-alt)",
                }}
              >
                {safeAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={safeAvatarUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,83,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Position badge — bottom-right corner */}
            {profile.position && (
              <div
                className="absolute -bottom-1 -right-1"
                style={{
                  padding: 2,
                  borderRadius: 9,
                  background: "var(--color-card)",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 28,
                    height: 20,
                    borderRadius: 7,
                    background: "linear-gradient(135deg, rgba(212,168,83,0.2), rgba(212,168,83,0.08))",
                    border: "1px solid rgba(212,168,83,0.25)",
                    fontFamily: "var(--font-stat)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {profile.position}
                </div>
              </div>
            )}

            {/* Avatar upload button */}
            {onAvatarUpload && (
              <>
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 flex items-center justify-center rounded-[22px] opacity-0 transition-opacity hover:opacity-100 active:opacity-100"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                  aria-label="프로필 사진 변경"
                >
                  {avatarUploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <IconCamera />
                  )}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* Name + Handle + Badges */}
          <div className="flex flex-1 flex-col gap-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <h1
                className="m-0 truncate text-[20px] font-[800] leading-tight"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-1)",
                  letterSpacing: "-0.02em",
                }}
              >
                {profile.name}
              </h1>
            </div>

            {/* Handle + City */}
            <p
              className="m-0 truncate"
              style={{
                fontSize: 13,
                color: "var(--color-text-3)",
                fontFamily: "var(--font-body)",
              }}
            >
              @{profile.handle}
              {profile.city && (
                <span style={{ opacity: 0.5 }}>{` · ${profile.city}`}</span>
              )}
            </p>

            {/* Inline badges: MVP, Play style */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {profile.mvpCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.06))",
                    border: "1px solid rgba(212,168,83,0.25)",
                    fontFamily: "var(--font-stat)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    letterSpacing: "0.02em",
                  }}
                >
                  MVP{profile.mvpCount > 1 ? ` x${profile.mvpCount}` : ""}
                </span>
              )}
              {styleInfo && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-text-2)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {styleInfo.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats counter row ── */}
        <div
          className="mx-5 mb-5 flex items-center"
          style={{
            borderRadius: 12,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          {[
            { label: "팔로워", value: profile.followers, href: followsHref("followers") },
            { label: "팔로잉", value: profile.following, href: followsHref("following") },
            { label: "조회수", value: profile.views, href: null },
          ].map(({ label, value, href }, i) => {
            const inner = (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-stat)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--color-text-1)",
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {fmt(value)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-3)",
                    fontFamily: "var(--font-body)",
                    marginTop: 3,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </span>
              </>
            );

            const cls = `flex flex-1 flex-col items-center py-3.5 transition-colors active:bg-white/[0.03]`;
            const divider = i < 2 ? (
              <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.05)" }} />
            ) : null;

            return (
              <React.Fragment key={label}>
                {href ? (
                  <Link href={href} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
                {divider}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CARD 2 — Player Info (physical + team)
          ═══════════════════════════════════════════ */}
      {(physicalTags.length > 0 || teamState !== "no-team" || onTeamChange) && (
        <div
          style={{
            background: "var(--color-card)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "14px 16px",
          }}
        >
          {/* Physical tags */}
          {physicalTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {physicalTags.map((v) => (
                <span
                  key={v}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--color-text-2)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          )}

          {/* Team section */}
          {(teamState !== "no-team" || onTeamChange) && (
            <>
              {physicalTags.length > 0 && (
                <div className="my-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
              )}

              {teamState === "has-team" && (
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--color-text-3)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                      }}
                    >
                      현재 소속
                    </span>
                    <span
                      className="truncate"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--color-text-1)",
                        marginTop: 1,
                      }}
                    >
                      {profile.teamName}
                    </span>
                  </div>
                  {onTeamChange && (
                    <button
                      onClick={onTeamChange}
                      className="ml-auto shrink-0 transition-colors active:bg-white/[0.05]"
                      style={{
                        padding: "5px 12px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "var(--color-text-3)",
                        fontSize: 11,
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      변경
                    </button>
                  )}
                </div>
              )}

              {teamState === "no-team" && onTeamChange && (
                <Link
                  href="/team"
                  className="flex items-center gap-2.5 py-0.5 transition-colors active:opacity-80"
                >
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(212,168,83,0.06)",
                      border: "1px dashed rgba(212,168,83,0.25)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span
                    className="flex-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-accent)",
                    }}
                  >
                    팀에 소속되어 보세요
                  </span>
                  <IconChevronRight color="rgba(212,168,83,0.35)" />
                </Link>
              )}

              {teamState === "transferring" && onTeamChange && (
                <Link
                  href="/team"
                  className="flex items-center gap-2.5 py-0.5 transition-colors active:opacity-80"
                >
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(96,165,250,0.06)",
                      border: "1px dashed rgba(96,165,250,0.25)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--color-blue)" }}>
                      새 팀으로 이동하기
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(96,165,250,0.5)", fontFamily: "var(--font-body)" }}>
                      진학·이적 시 새 소속 설정
                    </span>
                  </div>
                  <IconChevronRight color="rgba(96,165,250,0.35)" />
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ACTION BUTTONS (own profile only)
          ═══════════════════════════════════════════ */}
      {(onShare || onPdf || onEdit) && (
        <div className="flex gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="flex flex-1 items-center justify-center gap-1.5 transition-colors active:bg-white/[0.04]"
              style={{
                padding: "10px 0",
                borderRadius: 12,
                background: "var(--color-card)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--color-accent)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <IconShare />
              공유
            </button>
          )}
          {onPdf && (
            <button
              onClick={onPdf}
              className="flex flex-1 items-center justify-center gap-1.5 transition-colors active:bg-white/[0.04]"
              style={{
                padding: "10px 0",
                borderRadius: 12,
                background: "var(--color-card)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--color-text-3)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <IconFile />
              PDF
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-1.5 transition-colors active:bg-white/[0.04]"
              style={{
                padding: "10px 0",
                borderRadius: 12,
                background: "var(--color-card)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "var(--color-text-3)",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <IconEdit />
              편집
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const HeroSection = React.memo(HeroSectionInner);
export default HeroSection;
