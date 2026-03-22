"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";
import type { PlayStyle } from "@/lib/types";

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

const IconCamera = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

function HeroSectionInner({
  profile,
  playStyle: _playStyle, // 히어로에서는 표시하지 않음 (기록 탭 전용)
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
    profile.preferredFoot === "right" ? "오른발" :
    profile.preferredFoot === "left" ? "왼발" :
    profile.preferredFoot === "both" ? "양발" : null;

  const safeAvatarUrl = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : undefined;

  const fmt = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const followsHref = (tab: string) =>
    isOwn
      ? `/profile/follows?tab=${tab}`
      : `/profile/follows?tab=${tab}&profileId=${profile.id}`;

  const physicalParts = [
    profile.birthYear ? `${profile.birthYear}년생` : null,
    profile.heightCm ? `${profile.heightCm}cm` : null,
    profile.weightKg ? `${profile.weightKg}kg` : null,
    preferredFootLabel,
  ].filter(Boolean) as string[];

  const showActionBar = onShare || onPdf || onEdit;

  return (
    <div style={{ padding: "8px 14px 0" }}>
      <div style={{
        background: "#111111",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {/* 상단: 사진 + 정보 */}
        <div style={{ display: "flex", padding: 14, gap: 14 }}>

          {/* 사진 — 110×136, 포지션/MVP 오버레이 포함 */}
          <div style={{
            width: 110, height: 136, flexShrink: 0,
            borderRadius: 18, overflow: "hidden",
            position: "relative",
            background: "linear-gradient(170deg, #1a1a1a, #0c0c0c)",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at 40% 55%, rgba(201,168,76,0.07), transparent 60%)",
            }} />
            {safeAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeAvatarUrl}
                alt={profile.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
                <svg width="44" height="55" viewBox="0 0 120 140" fill="none" opacity={0.18}>
                  <circle cx="60" cy="42" r="28" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.3)" strokeWidth="1" />
                  <path d="M22 132 Q22 94 60 87 Q98 94 98 132" fill="rgba(201,168,76,0.12)" />
                </svg>
              </div>
            )}

            {/* 포지션 배지 — 사진 좌상단 오버레이 */}
            {profile.position && (
              <div style={{
                position: "absolute", top: 7, left: 7, zIndex: 2,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(12px)",
                borderRadius: 7,
                padding: "2px 9px",
                border: "1px solid rgba(201,168,76,0.25)",
                fontFamily: "'Oswald', sans-serif",
                fontSize: 12, fontWeight: 700,
                color: "#e8d48b",
                letterSpacing: "0.04em",
                lineHeight: 1.6,
              }}>
                {profile.position}
              </div>
            )}

            {/* MVP 배지 — 사진 하단 글래스모피즘 오버레이 */}
            {profile.mvpCount > 0 && (
              <div style={{
                position: "absolute", bottom: 7, left: 7, right: 7, zIndex: 2,
                background: "rgba(201,168,76,0.15)",
                backdropFilter: "blur(8px)",
                borderRadius: 8,
                padding: "4px 0",
                textAlign: "center",
                border: "1px solid rgba(201,168,76,0.30)",
                fontFamily: "'Oswald', sans-serif",
                fontSize: 11, fontWeight: 600,
                color: "#e8d48b",
                letterSpacing: "0.02em",
              }}>
                ⭐ MVP ×{profile.mvpCount}
              </div>
            )}

            {/* 아바타 업로드 버튼 — 항상 보이는 카메라 배지 */}
            {onAvatarUpload && (
              <>
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    position: "absolute",
                    bottom: profile.mvpCount > 0 ? 40 : 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 3,
                  }}
                  aria-label="프로필 사진 변경"
                >
                  {avatarUploading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <IconCamera />
                  )}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* 우측 정보 컬럼 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, justifyContent: "center" }}>
            {/* 이름 */}
            <h1 style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: 20, fontWeight: 800,
              color: "#f5f5f5", margin: "0 0 3px",
              letterSpacing: "-0.03em", lineHeight: 1.15,
            }}>{profile.name}</h1>

            {/* 핸들 + 지역 */}
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: 12, color: "rgba(255,255,255,0.40)",
              margin: "0 0 6px", letterSpacing: "-0.01em",
            }}>
              @{profile.handle}
              {profile.city ? ` · ${profile.city}` : ""}
            </p>

            {/* 팀 정보 */}
            {teamState === "has-team" && profile.teamName && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: 12, fontWeight: 600,
                  color: "rgba(255,255,255,0.60)", flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{profile.teamName}</span>
                {onTeamChange && (
                  <button
                    onClick={onTeamChange}
                    style={{
                      fontSize: 10, color: "rgba(255,255,255,0.28)",
                      fontFamily: "'Noto Sans KR', sans-serif",
                      padding: "2px 8px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent", cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >변경</button>
                )}
              </div>
            )}

            {/* 신체정보 */}
            {physicalParts.length > 0 && (
              <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 12, color: "rgba(255,255,255,0.72)",
                margin: "0 0 8px", lineHeight: 1.6,
                letterSpacing: "-0.01em",
              }}>
                {physicalParts.join(" · ")}
              </p>
            )}

            {/* 팔로워 / 팔로잉 — 인라인 텍스트 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Link href={followsHref("followers")} style={{ textDecoration: "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{fmt(profile.followers)}</span>
                  <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.36)" }}>팔로워</span>
                </span>
              </Link>
              <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 11 }}>·</span>
              <Link href={followsHref("following")} style={{ textDecoration: "none" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{fmt(profile.following)}</span>
                  <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.36)" }}>팔로잉</span>
                </span>
              </Link>
            </div>

            {/* 팀 없음 CTA */}
            {teamState === "no-team" && onTeamChange && (
              <Link href="/team" style={{ textDecoration: "none", marginTop: 8 }}>
                <div style={{
                  padding: "8px 10px", borderRadius: 12,
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.18)",
                  cursor: "pointer",
                }}>
                  <span style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 12, fontWeight: 700,
                    color: "#e8d48b", display: "block", marginBottom: 2,
                  }}>팀에 소속되어 보세요</span>
                  <span style={{
                    fontSize: 10, color: "#bfa255",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>초대코드 가입 · 팀 만들기</span>
                </div>
              </Link>
            )}

            {/* 이적 중 */}
            {teamState === "transferring" && (
              <Link href="/team" style={{ textDecoration: "none", marginTop: 8 }}>
                <div style={{
                  padding: "8px 10px", borderRadius: 12,
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.20)",
                }}>
                  <span style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 12, fontWeight: 600,
                    color: "#60a5fa", display: "block", marginBottom: 2,
                  }}>새 팀으로 이동 중</span>
                  <span style={{
                    fontSize: 10, color: "rgba(96,165,250,0.5)",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>진학·이적 시 새 소속 설정</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* 액션 바 (본인 프로필) */}
        {showActionBar && (
          <div style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {onShare && (
              <button onClick={onShare} style={{
                flex: 1, padding: "12px 0",
                background: "transparent", border: "none",
                borderRight: (onPdf || onEdit) ? "1px solid rgba(255,255,255,0.06)" : "none",
                color: "#e8d48b",
                fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: 600, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}>공유</button>
            )}
            {onPdf && (
              <button onClick={onPdf} style={{
                flex: 1, padding: "12px 0",
                background: "transparent", border: "none",
                borderRight: onEdit ? "1px solid rgba(255,255,255,0.06)" : "none",
                color: "rgba(255,255,255,0.40)",
                fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: 400, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}>PDF</button>
            )}
            {onEdit && (
              <button onClick={onEdit} style={{
                flex: 1, padding: "12px 0",
                background: "transparent", border: "none",
                borderRight: "none",
                color: "#e8d48b",
                fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: 700, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}>편집</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const HeroSection = React.memo(HeroSectionInner);
export default HeroSection;
