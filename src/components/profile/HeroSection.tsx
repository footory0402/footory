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

const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
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
    profile.preferredFoot === "right" ? "오른발" :
    profile.preferredFoot === "left" ? "왼발" :
    profile.preferredFoot === "both" ? "양발" : null;

  const safeAvatarUrl = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : undefined;
  const styleInfo = playStyle?.styleType ? PLAY_STYLES[playStyle.styleType] : null;

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
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {/* 상단: 사진 + 정보 */}
        <div style={{ display: "flex", padding: 14, gap: 16 }}>

          {/* 사진 — 120×150, 전체 둥글게 */}
          <div style={{
            width: 120, height: 150, flexShrink: 0,
            borderRadius: 20, overflow: "hidden",
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
                <svg width="48" height="60" viewBox="0 0 120 140" fill="none" opacity={0.18}>
                  <circle cx="60" cy="42" r="28" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.3)" strokeWidth="1" />
                  <path d="M22 132 Q22 94 60 87 Q98 94 98 132" fill="rgba(201,168,76,0.12)" />
                </svg>
              </div>
            )}

            {/* 아바타 업로드 버튼 */}
            {onAvatarUpload && (
              <>
                <button
                  onClick={() => avatarRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100 active:opacity-100"
                  style={{ background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", zIndex: 3, borderRadius: 20 }}
                  aria-label="프로필 사진 변경"
                >
                  {avatarUploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <IconCamera />
                  )}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </>
            )}
          </div>

          {/* 우측 정보 컬럼 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* 이름 + 포지션 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 22, fontWeight: 800,
                color: "#f5f5f5", margin: 0,
                letterSpacing: "-0.03em", lineHeight: 1.1,
              }}>{profile.name}</h1>
              {profile.position && (
                <span style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 11, fontWeight: 700,
                  color: "#e8d48b",
                  padding: "2px 8px", borderRadius: 6,
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.6, flexShrink: 0,
                }}>{profile.position}</span>
              )}
            </div>

            {/* 핸들 + 지역 */}
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: 12, color: "rgba(255,255,255,0.24)",
              margin: "4px 0 8px", letterSpacing: "-0.01em",
            }}>
              @{profile.handle}
              {profile.city ? ` · ${profile.city}` : ""}
            </p>

            {/* 팔로워 / 팔로잉 — 클릭 가능한 별도 라인 */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <Link href={followsHref("followers")} style={{ textDecoration: "none" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 20,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  cursor: "pointer",
                }}>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: "#f5f5f5" }}>{fmt(profile.followers)}</span>
                  <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.36)" }}>팔로워</span>
                </span>
              </Link>
              <Link href={followsHref("following")} style={{ textDecoration: "none" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 20,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  cursor: "pointer",
                }}>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 700, color: "#f5f5f5" }}>{fmt(profile.following)}</span>
                  <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.36)" }}>팔로잉</span>
                </span>
              </Link>
            </div>

            {/* 신체정보 — 인라인 텍스트 */}
            {physicalParts.length > 0 && (
              <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 12, color: "rgba(255,255,255,0.52)",
                margin: "0 0 10px", lineHeight: 1.6,
                letterSpacing: "-0.01em",
              }}>
                {physicalParts.join(" · ")}
              </p>
            )}

            {/* 플레이스타일 + MVP pills */}
            {(styleInfo || profile.mvpCount > 0) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {styleInfo && (
                  <span style={{
                    padding: "5px 14px", borderRadius: 50,
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.18)",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 12, fontWeight: 700,
                    color: "#e8d48b", letterSpacing: "-0.01em",
                  }}>{styleInfo.label}</span>
                )}
                {profile.mvpCount > 0 && (
                  <span style={{
                    padding: "5px 10px", borderRadius: 50,
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.30)",
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: 12, fontWeight: 700,
                    color: "#e8d48b", letterSpacing: "0.02em",
                  }}>MVP ×{profile.mvpCount}</span>
                )}
              </div>
            )}

            {/* 팀 섹션 */}
            {teamState === "has-team" && profile.teamName && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: 12, fontWeight: 600,
                  color: "rgba(255,255,255,0.52)", flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{profile.teamName}</span>
                {onTeamChange && (
                  <button
                    onClick={onTeamChange}
                    style={{
                      fontSize: 10, color: "rgba(255,255,255,0.24)",
                      fontFamily: "'Noto Sans KR', sans-serif",
                      padding: "2px 8px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "transparent", cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >변경</button>
                )}
              </div>
            )}

            {teamState === "no-team" && onTeamChange && (
              <Link href="/team" style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "10px 12px", borderRadius: 14,
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.18)",
                  cursor: "pointer",
                }}>
                  <span style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 12, fontWeight: 700,
                    color: "#e8d48b", display: "block", marginBottom: 4,
                  }}>팀에 소속되어 보세요</span>
                  <span style={{
                    fontSize: 10, color: "#bfa255",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>초대코드 가입 · 팀 만들기</span>
                </div>
              </Link>
            )}

            {teamState === "transferring" && (
              <Link href="/team" style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "10px 12px", borderRadius: 14,
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.20)",
                }}>
                  <span style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: 12, fontWeight: 600,
                    color: "#60a5fa", display: "block", marginBottom: 4,
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
                flex: 1, padding: "10px 0",
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
                flex: 1, padding: "10px 0",
                background: "transparent", border: "none",
                borderRight: onEdit ? "1px solid rgba(255,255,255,0.06)" : "none",
                color: "rgba(255,255,255,0.24)",
                fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: 400, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}>PDF</button>
            )}
            {onEdit && (
              <button onClick={onEdit} style={{
                flex: 1, padding: "10px 0",
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
