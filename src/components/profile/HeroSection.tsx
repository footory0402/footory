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

  return (
    <div style={{ background: "var(--v5-card)" }}>
      {/* ── 좌우 분할 ── */}
      <div className="flex" style={{ minHeight: 210 }}>
        {/* 좌: 프로필 사진 (40%) */}
        <div className="relative w-[40%] shrink-0 overflow-hidden">
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              minHeight: 230,
              background: "linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)",
            }}
          >
            {/* Gold radial glow */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 30% 60%, var(--v5-gold-glow), transparent 60%)",
              }}
            />

            {safeAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeAvatarUrl}
                alt={`${profile.name} 프로필 사진`}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: "center 20%" }}
              />
            ) : (
              <svg
                width="70"
                height="90"
                viewBox="0 0 120 140"
                fill="none"
                opacity="0.25"
              >
                <circle
                  cx="60"
                  cy="42"
                  r="28"
                  fill="rgba(201,168,76,0.18)"
                  stroke="rgba(201,168,76,0.22)"
                  strokeWidth="1"
                />
                <path
                  d="M22 132 Q22 94 60 87 Q98 94 98 132"
                  fill="rgba(201,168,76,0.08)"
                  stroke="rgba(201,168,76,0.15)"
                  strokeWidth="1"
                />
              </svg>
            )}
          </div>

          {/* Avatar upload overlay */}
          {onAvatarUpload && (
            <>
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 z-[4] flex items-center justify-center opacity-0 transition-opacity hover:opacity-100"
                style={{ background: "rgba(0,0,0,0.45)" }}
                aria-label="프로필 사진 변경"
              >
                {avatarUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </>
          )}

          {/* Position badge (top-left) */}
          {profile.position && (
            <div
              className="absolute left-[10px] top-[10px]"
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(10px)",
                borderRadius: 6,
                padding: "3px 10px",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-stat)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--v5-gold-light)",
                }}
              >
                {profile.position}
              </span>
            </div>
          )}

          {/* MVP badge (bottom-left) */}
          {profile.mvpCount > 0 && (
            <div
              className="absolute bottom-[10px] left-[10px]"
              style={{
                background: "rgba(201,168,76,0.2)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: 10,
                padding: "2px 8px",
                fontSize: 10,
                fontFamily: "var(--font-stat)",
                color: "var(--v5-gold-light)",
              }}
            >
              🏆 ×{profile.mvpCount}
            </div>
          )}

          {/* Gold divider line (right edge) */}
          <div
            className="absolute right-0 top-0 h-full"
            style={{
              width: 1,
              background:
                "linear-gradient(180deg, transparent 10%, rgba(201,168,76,0.2) 50%, transparent 90%)",
            }}
          />
        </div>

        {/* 우: 선수 정보 (60%) */}
        <div className="flex flex-1 flex-col" style={{ padding: "14px 14px 10px" }}>
          {/* Name */}
          <h1
            className="m-0 text-[21px] font-[800]"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--v5-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {profile.name}
          </h1>

          {/* Handle + Region */}
          <p
            className="mt-[2px]"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "var(--v5-text-dim)",
              margin: "2px 0 0",
            }}
          >
            @{profile.handle}
            {profile.city && ` · ${profile.city}`}
          </p>

          {/* Divider */}
          <div
            className="my-[9px]"
            style={{ height: 1, background: "var(--v5-card-border)" }}
          />

          {/* Physical tags */}
          <div className="mb-2 flex flex-wrap gap-[5px]">
            {[
              profile.birthYear ? `${profile.birthYear}` : null,
              profile.heightCm ? `${profile.heightCm}cm` : null,
              profile.weightKg ? `${profile.weightKg}kg` : null,
              preferredFootLabel,
            ]
              .filter(Boolean)
              .map((v) => (
                <span
                  key={v}
                  style={{
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontSize: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--v5-card-border)",
                    color: "var(--v5-text-sub)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {v}
                </span>
              ))}
          </div>

          {/* Play style */}
          {styleInfo && (
            <div
              className="mb-2 flex items-center gap-[6px]"
              style={{
                padding: "5px 9px",
                borderRadius: 7,
                background: "rgba(250,204,21,0.04)",
                border: "1px solid rgba(250,204,21,0.08)",
              }}
            >
              <span style={{ fontSize: 12 }}>{styleInfo.icon}</span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--v5-text)",
                }}
              >
                {styleInfo.label}
              </span>
            </div>
          )}

          {/* ── Team state branching ── */}
          {teamState === "has-team" && (
            <div className="mb-[6px] flex items-center gap-[6px]">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--v5-card-border)",
                  fontSize: 10,
                }}
              >
                ⚽
              </div>
              <span
                className="flex-1"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--v5-text-sub)",
                }}
              >
                {profile.teamName}
              </span>
              {onTeamChange && (
                <button
                  onClick={onTeamChange}
                  style={{
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--v5-card-border)",
                    color: "var(--v5-text-dim)",
                    fontSize: 9,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                  }}
                >
                  변경
                </button>
              )}
            </div>
          )}

          {teamState === "no-team" && (
            <Link
              href="/team"
              className="mb-[6px] block cursor-pointer"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--v5-gold-bg)",
                border: "1px solid var(--v5-gold-border)",
              }}
            >
              <div className="flex items-center gap-[6px]">
                <span style={{ fontSize: 14 }}>👥</span>
                <span
                  className="flex-1"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--v5-gold-light)",
                  }}
                >
                  팀에 소속되어 보세요
                </span>
                <span style={{ color: "var(--v5-gold-dim)", fontSize: 14 }}>
                  ›
                </span>
              </div>
              <div
                className="mt-[6px] flex gap-[6px]"
                style={{ paddingLeft: 22 }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--v5-gold-dim)",
                    fontFamily: "var(--font-body)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "rgba(201,168,76,0.06)",
                    border: "1px solid rgba(201,168,76,0.1)",
                  }}
                >
                  🔗 초대코드로 가입
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--v5-gold-dim)",
                    fontFamily: "var(--font-body)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "rgba(201,168,76,0.06)",
                    border: "1px solid rgba(201,168,76,0.1)",
                  }}
                >
                  ✚ 우리 팀 직접 만들기
                </span>
              </div>
            </Link>
          )}

          {teamState === "transferring" && (
            <Link
              href="/team"
              className="mb-[6px] block cursor-pointer"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "var(--v5-blue-bg)",
                border: "1px solid var(--v5-blue-border)",
              }}
            >
              <div className="flex items-center gap-[6px]">
                <span style={{ fontSize: 12 }}>🔄</span>
                <div className="flex-1">
                  <span
                    className="block"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--v5-blue)",
                    }}
                  >
                    새 팀으로 이동하기
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "rgba(96,165,250,0.5)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    진학·이적 시 새 소속 설정
                  </span>
                </div>
                <span style={{ color: "rgba(96,165,250,0.4)", fontSize: 14 }}>
                  ›
                </span>
              </div>
              <div
                className="mt-[6px] flex gap-[6px]"
                style={{ paddingLeft: 22 }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(96,165,250,0.5)",
                    fontFamily: "var(--font-body)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "rgba(96,165,250,0.04)",
                    border: "1px solid rgba(96,165,250,0.1)",
                  }}
                >
                  🔗 새 팀 초대코드 입력
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "rgba(96,165,250,0.5)",
                    fontFamily: "var(--font-body)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    background: "rgba(96,165,250,0.04)",
                    border: "1px solid rgba(96,165,250,0.1)",
                  }}
                >
                  ✚ 새 팀 등록하기
                </span>
              </div>
            </Link>
          )}

          {/* Followers / Following / Views */}
          <div
            className="mt-auto flex gap-[10px]"
            style={{ paddingTop: 3 }}
          >
            {[
              { l: "팔로워", v: profile.followers },
              { l: "팔로잉", v: profile.following },
              { l: "조회", v: profile.views },
            ].map(({ l, v }) => (
              <span
                key={l}
                style={{
                  fontSize: 10,
                  color: "var(--v5-text-dim)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {l}{" "}
                <span
                  style={{
                    color: "var(--v5-text-sub)",
                    fontWeight: 700,
                    fontFamily: "var(--font-stat)",
                    fontSize: 12,
                  }}
                >
                  {v}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div
        className="flex"
        style={{
          borderTop: "1px solid var(--v5-card-border)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        {[
          { icon: "📤", label: "공유", primary: true, onClick: onShare },
          { icon: "📄", label: "PDF", primary: false, onClick: onPdf },
          { icon: "✏️", label: "편집", primary: false, onClick: onEdit },
        ].map(({ icon, label, primary, onClick }, i) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-1 items-center justify-center gap-1"
            style={{
              padding: "10px 0",
              background: "transparent",
              border: "none",
              borderRight:
                i < 2 ? "1px solid var(--v5-card-border)" : "none",
              color: primary
                ? "var(--v5-gold-light)"
                : "var(--v5-text-dim)",
              fontSize: 11,
              fontFamily: "var(--font-body)",
              fontWeight: primary ? 600 : 400,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 12 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const HeroSection = React.memo(HeroSectionInner);
export default HeroSection;
