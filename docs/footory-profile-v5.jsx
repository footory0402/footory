import { useState, useEffect } from "react";

// ═══════════════════════════════════════
// Design tokens
// ═══════════════════════════════════════
const T = {
  gold: "#c9a84c",
  goldLight: "#e8d48b",
  goldDim: "rgba(201,168,76,0.5)",
  goldBg: "rgba(201,168,76,0.08)",
  goldBorder: "rgba(201,168,76,0.15)",
  goldGlow: "rgba(201,168,76,0.12)",
  dark: "#080808",
  card: "#111111",
  cardBorder: "rgba(255,255,255,0.06)",
  text: "#f0f0f0",
  textSub: "rgba(255,255,255,0.50)",
  textDim: "rgba(255,255,255,0.22)",
  green: "#4ade80",
  greenBg: "rgba(74,222,128,0.08)",
  greenBorder: "rgba(74,222,128,0.18)",
  red: "#f87171",
  blue: "#60a5fa",
  blueBg: "rgba(96,165,250,0.08)",
  blueBorder: "rgba(96,165,250,0.18)",
};
const font = { display: "'Oswald', sans-serif", body: "'Noto Sans KR', sans-serif" };

// ═══════════════════════════════════════
// Data
// ═══════════════════════════════════════
const PLAYER = {
  name: "박로건",
  handle: "@logan",
  position: "FW",
  team: "FC서울 U-15",
  birthYear: 2010,
  region: "서울",
  height: 165,
  weight: 55,
  foot: "오른발",
  mvpCount: 2,
  followers: 2,
  following: 1,
  views: 327,
  playStyle: { title: "공격형 드리블러", quote: "공을 잡으면 돌파부터", icon: "⚡" },
  physicalTests: [
    { key: "50m 달리기", value: "7.3", unit: "초", date: "2025.3.13", source: "team", verifier: "FC서울 U-15" },
    { key: "1000m", value: "5:20", unit: "", date: "2025.3.15", source: "team", verifier: "FC서울 U-15", change: { val: "1:05", dir: "up" } },
    { key: "슈팅 속도", value: "86", unit: "km/h", date: "2025.3.15", source: "team", verifier: "FC서울 U-15", change: { val: 6, dir: "up" } },
    { key: "리프팅", value: "500", unit: "회", date: "2025.3.15", source: "self", verifier: null, change: { val: 180, dir: "up" } },
  ],
  career: {
    currentTeam: { name: "FC서울 U-15", since: "2025" },
    history: [{ team: "FC서울 U-15", period: "2025 ~", current: true }],
    tournaments: [
      { name: "2026 전국 소년체전", type: "공식대회", date: "2026.02", result: "8강", personal: { goals: 3, assists: 1, mvp: true }, source: "team", verifier: "FC서울 U-15" },
      { name: "2025 추계 유소년 리그", type: "리그", date: "2025.09~11", result: "리그 3위", personal: { goals: 5, assists: 2, mvp: false }, source: "team", verifier: "FC서울 U-15" },
      { name: "2025 여름 친선 교류전", type: "친선", date: "2025.07", result: null, personal: { goals: 2, assists: 0, mvp: false }, source: "self", verifier: null },
    ],
    awards: [{ title: "2026 소년체전", detail: "MVP", source: "team", verifier: "대한축구협회" }],
  },
  // ── 영상 — 스킬 태그 + 대표 영상 구조 ──
  featuredClip: {
    title: "소년체전 8강 하이라이트",
    duration: "0:42",
    date: "2026.02.15",
    tags: ["드리블", "슈팅"],
    views: 124,
    tournament: "2026 전국 소년체전",
  },
  clips: [
    { title: "vs 수원전 드리블 돌파", duration: "0:14", date: "2025.03.10", tags: ["드리블"], views: 52 },
    { title: "연습경기 프리킥 골", duration: "0:08", date: "2025.03.08", tags: ["슈팅", "프리킥"], views: 31 },
    { title: "1대1 수비수 제치기", duration: "0:11", date: "2025.02.20", tags: ["드리블"], views: 28 },
    { title: "크로스에서 헤딩 골", duration: "0:06", date: "2025.02.15", tags: ["슈팅", "헤딩"], views: 19 },
    { title: "빌드업 패스 연결", duration: "0:18", date: "2025.01.28", tags: ["패스"], views: 12 },
  ],
};

const ALL_TAGS = ["전체", "드리블", "슈팅", "패스", "프리킥", "헤딩"];

// ═══════════════════════════════════════
// Shared
// ═══════════════════════════════════════

function VerifyBadge({ source, verifier, compact }) {
  const isTeam = source === "team";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: compact ? "1px 6px" : "2px 8px", borderRadius: 4,
      fontSize: compact ? 9 : 10, fontFamily: font.body, fontWeight: 500,
      background: isTeam ? T.greenBg : "rgba(255,255,255,0.03)",
      border: `1px solid ${isTeam ? T.greenBorder : T.cardBorder}`,
      color: isTeam ? T.green : T.textDim, whiteSpace: "nowrap",
    }}>
      {isTeam ? "✓" : "○"}{isTeam ? (compact ? "팀 인증" : verifier || "팀 인증") : "자기 기록"}
    </span>
  );
}

function TournamentTypeBadge({ type }) {
  const c = { "공식대회": { color: T.goldLight, bg: T.goldBg, border: T.goldBorder }, "리그": { color: T.blue, bg: T.blueBg, border: T.blueBorder }, "친선": { color: T.textSub, bg: "rgba(255,255,255,0.03)", border: T.cardBorder } }[type] || { color: T.textSub, bg: "rgba(255,255,255,0.03)", border: T.cardBorder };
  return <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontFamily: font.body, fontWeight: 600, background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{type}</span>;
}

function SectionHeader({ title, count, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: T.gold }} />
        <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700, color: T.text }}>{title}</span>
        {count !== undefined && <span style={{ fontFamily: font.display, fontSize: 11, color: T.textDim, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "1px 7px" }}>{count}</span>}
      </div>
      {right}
    </div>
  );
}

function AddButton({ label, gold }) {
  return (
    <button style={{
      padding: "4px 10px", borderRadius: 6,
      background: gold ? T.goldBg : "rgba(255,255,255,0.04)",
      border: `1px solid ${gold ? T.goldBorder : T.cardBorder}`,
      color: gold ? T.goldLight : T.textDim,
      fontSize: 10, fontFamily: font.body, cursor: "pointer", fontWeight: 500,
    }}>+ {label}</button>
  );
}

// ═══════════════════════════════════════
// HERO
// ═══════════════════════════════════════

function HeroSection({ teamState }) {
  // teamState: "has-team" | "no-team" | "transferring"
  return (
    <div style={{ background: T.card }}>
      <div style={{ display: "flex", minHeight: 210 }}>
        {/* 좌: 사진 */}
        <div style={{ width: "40%", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <div style={{
            width: "100%", height: "100%", minHeight: 230,
            background: "linear-gradient(165deg, #1a1a1a 0%, #0d0d0d 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 60%, ${T.goldGlow}, transparent 60%)` }} />
            <svg width="70" height="90" viewBox="0 0 120 140" fill="none" opacity="0.25">
              <circle cx="60" cy="42" r="28" fill="rgba(201,168,76,0.18)" stroke="rgba(201,168,76,0.22)" strokeWidth="1" />
              <path d="M22 132 Q22 94 60 87 Q98 94 98 132" fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.15)" strokeWidth="1" />
            </svg>
          </div>
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", borderRadius: 6, padding: "3px 10px", border: `1px solid rgba(201,168,76,0.25)` }}>
            <span style={{ fontFamily: font.display, fontSize: 15, fontWeight: 700, color: T.goldLight }}>{PLAYER.position}</span>
          </div>
          {PLAYER.mvpCount > 0 && (
            <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(201,168,76,0.2)", backdropFilter: "blur(8px)", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 10, padding: "2px 8px", fontSize: 10, fontFamily: font.display, color: T.goldLight }}>
              🏆 ×{PLAYER.mvpCount}
            </div>
          )}
          <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: "100%", background: `linear-gradient(180deg, transparent 10%, ${T.gold}33 50%, transparent 90%)` }} />
        </div>

        {/* 우: 정보 */}
        <div style={{ flex: 1, padding: "14px 14px 10px", display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontFamily: font.body, fontSize: 21, fontWeight: 800, color: T.text, margin: "0 0 1px", letterSpacing: "-0.02em" }}>{PLAYER.name}</h1>
          <p style={{ fontFamily: font.body, fontSize: 11, color: T.textDim, margin: "2px 0 0" }}>{PLAYER.handle} · {PLAYER.region}</p>
          <div style={{ height: 1, background: T.cardBorder, margin: "9px 0" }} />

          {/* 신체 */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
            {[`${PLAYER.birthYear}`, `${PLAYER.height}cm`, `${PLAYER.weight}kg`, PLAYER.foot].map((v) => (
              <span key={v} style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.cardBorder}`, color: T.textSub, fontFamily: font.body }}>{v}</span>
            ))}
          </div>

          {/* 플레이 스타일 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 7, background: "rgba(250,204,21,0.04)", border: `1px solid rgba(250,204,21,0.08)`, marginBottom: 8 }}>
            <span style={{ fontSize: 12 }}>{PLAYER.playStyle.icon}</span>
            <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 700, color: T.text }}>{PLAYER.playStyle.title}</span>
          </div>

          {/* 팀 상태별 분기 */}
          {teamState === "has-team" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>⚽</div>
              <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 600, color: T.textSub, flex: 1 }}>{PLAYER.team}</span>
              <button style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.cardBorder}`, color: T.textDim, fontSize: 9, fontFamily: font.body, cursor: "pointer" }}>변경</button>
            </div>
          )}

          {teamState === "no-team" && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: T.goldBg, border: `1px solid ${T.goldBorder}`, cursor: "pointer", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>👥</span>
                <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 700, color: T.goldLight, flex: 1 }}>팀에 소속되어 보세요</span>
                <span style={{ color: T.goldDim, fontSize: 14 }}>›</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: 22 }}>
                <span style={{ fontSize: 9, color: T.goldDim, fontFamily: font.body, padding: "1px 6px", borderRadius: 3, background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.1)` }}>
                  🔗 초대코드로 가입
                </span>
                <span style={{ fontSize: 9, color: T.goldDim, fontFamily: font.body, padding: "1px 6px", borderRadius: 3, background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.1)` }}>
                  ✚ 우리 팀 직접 만들기
                </span>
              </div>
            </div>
          )}

          {teamState === "transferring" && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: T.blueBg, border: `1px solid ${T.blueBorder}`, cursor: "pointer", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>🔄</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 700, color: T.blue, display: "block" }}>새 팀으로 이동하기</span>
                  <span style={{ fontSize: 9, color: "rgba(96,165,250,0.5)", fontFamily: font.body }}>진학·이적 시 새 소속 설정</span>
                </div>
                <span style={{ color: "rgba(96,165,250,0.4)", fontSize: 14 }}>›</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: 22 }}>
                <span style={{ fontSize: 9, color: "rgba(96,165,250,0.5)", fontFamily: font.body, padding: "1px 6px", borderRadius: 3, background: "rgba(96,165,250,0.04)", border: `1px solid rgba(96,165,250,0.1)` }}>
                  🔗 새 팀 초대코드 입력
                </span>
                <span style={{ fontSize: 9, color: "rgba(96,165,250,0.5)", fontFamily: font.body, padding: "1px 6px", borderRadius: 3, background: "rgba(96,165,250,0.04)", border: `1px solid rgba(96,165,250,0.1)` }}>
                  ✚ 새 팀 등록하기
                </span>
              </div>
            </div>
          )}

          {/* 팔로워 */}
          <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 3 }}>
            {[{ l: "팔로워", v: PLAYER.followers }, { l: "팔로잉", v: PLAYER.following }, { l: "조회", v: PLAYER.views }].map(({ l, v }) => (
              <span key={l} style={{ fontSize: 10, color: T.textDim, fontFamily: font.body }}>
                {l} <span style={{ color: T.textSub, fontWeight: 700, fontFamily: font.display, fontSize: 12 }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 액션 바 */}
      <div style={{ display: "flex", borderTop: `1px solid ${T.cardBorder}`, background: "rgba(255,255,255,0.01)" }}>
        {[{ icon: "📤", label: "공유", primary: true }, { icon: "📄", label: "PDF" }, { icon: "✏️", label: "편집" }].map(({ icon, label, primary }, i, arr) => (
          <button key={label} style={{
            flex: 1, padding: "10px 0", background: "transparent", border: "none",
            borderRight: i < arr.length - 1 ? `1px solid ${T.cardBorder}` : "none",
            color: primary ? T.goldLight : T.textDim, fontSize: 11, fontFamily: font.body,
            fontWeight: primary ? 600 : 400, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}><span style={{ fontSize: 12 }}>{icon}</span>{label}</button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB BAR
// ═══════════════════════════════════════

function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={{ position: "sticky", top: 49, zIndex: 40, background: "rgba(12,12,12,0.96)", backdropFilter: "blur(14px)", display: "flex", borderBottom: `1px solid ${T.cardBorder}` }}>
      {[{ key: "highlights", label: "하이라이트", icon: "🎬" }, { key: "records", label: "기록", icon: "📊" }, { key: "career", label: "커리어", icon: "⚽" }].map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button key={tab.key} onClick={() => onTabChange(tab.key)} style={{
            flex: 1, padding: "11px 0 9px", background: "transparent", border: "none",
            borderBottom: active ? `2px solid ${T.gold}` : "2px solid transparent",
            color: active ? T.goldLight : T.textDim, fontFamily: font.body, fontSize: 12,
            fontWeight: active ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}><span style={{ fontSize: 12 }}>{tab.icon}</span>{tab.label}</button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB: 하이라이트 — 강화
// ═══════════════════════════════════════

function HighlightsTab() {
  const [activeTag, setActiveTag] = useState("전체");
  const filtered = activeTag === "전체" ? PLAYER.clips : PLAYER.clips.filter((c) => c.tags.includes(activeTag));
  const fc = PLAYER.featuredClip;

  return (
    <div style={{ padding: "16px" }}>
      {/* ── 대표 영상 — 크게 ── */}
      {fc ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>⭐</span>
            <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 700, color: T.goldLight }}>대표 영상</span>
            <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.body, marginLeft: "auto" }}>스카우터가 가장 먼저 봅니다</span>
          </div>

          <div style={{
            borderRadius: 16, overflow: "hidden", position: "relative", cursor: "pointer",
            border: `1px solid rgba(201,168,76,0.25)`,
            boxShadow: `0 4px 24px rgba(201,168,76,0.1)`,
          }}>
            {/* 16:9 영상 영역 */}
            <div style={{
              width: "100%", aspectRatio: "16/9",
              background: "linear-gradient(135deg, #1a1a1a, #0d0d0d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              {/* 장식 */}
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 40% 50%, rgba(201,168,76,0.06), transparent 60%)` }} />

              {/* 재생 버튼 */}
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "rgba(201,168,76,0.15)", backdropFilter: "blur(8px)",
                border: `2px solid rgba(201,168,76,0.4)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "transform 0.2s",
              }}>
                <span style={{ fontSize: 22, marginLeft: 3, color: T.goldLight }}>▶</span>
              </div>

              {/* 좌상단: FEATURED */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                background: T.gold, borderRadius: 4,
                padding: "3px 8px", fontSize: 9, fontWeight: 800, fontFamily: font.display,
                color: "#000", letterSpacing: "0.08em",
              }}>⭐ FEATURED</div>

              {/* 우상단: 조회수 */}
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderRadius: 4,
                padding: "3px 7px", fontSize: 10, color: T.textSub, fontFamily: font.display,
              }}>👁 {fc.views}</div>

              {/* 하단 정보 */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "28px 14px 12px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
              }}>
                <h3 style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
                  {fc.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: font.display }}>{fc.duration}</span>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: font.body }}>{fc.date}</span>
                  {fc.tournament && (
                    <span style={{
                      fontSize: 9, color: T.goldDim, fontFamily: font.body,
                      padding: "1px 6px", borderRadius: 3,
                      background: "rgba(201,168,76,0.1)",
                    }}>{fc.tournament}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {fc.tags.map((tag) => (
                    <span key={tag} style={{
                      padding: "2px 7px", borderRadius: 4, fontSize: 9,
                      background: T.goldBg, border: `1px solid ${T.goldBorder}`,
                      color: T.goldLight, fontFamily: font.body, fontWeight: 500,
                    }}>#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 대표 영상 미설정 CTA */
        <div style={{
          background: `linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))`,
          border: `1px solid ${T.goldBorder}`, borderRadius: 14,
          padding: "14px 16px", marginBottom: 20, cursor: "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: T.goldBg, border: `1px solid ${T.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 700, color: T.goldLight, margin: 0 }}>대표 영상을 설정해보세요</p>
              <p style={{ fontFamily: font.body, fontSize: 10, color: T.textDim, margin: "3px 0 0" }}>스카우터가 가장 먼저 보는 영상이에요</p>
            </div>
            <span style={{ color: T.goldDim, fontSize: 18 }}>›</span>
          </div>
        </div>
      )}

      {/* ── 전체 클립 ── */}
      <SectionHeader
        title="전체 클립"
        count={PLAYER.clips.length}
        right={<AddButton label="영상 추가" gold />}
      />

      {/* 스킬 태그 필터 */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 4 }}>
        {ALL_TAGS.map((tag) => {
          const active = activeTag === tag;
          const count = tag === "전체" ? PLAYER.clips.length : PLAYER.clips.filter((c) => c.tags.includes(tag)).length;
          if (tag !== "전체" && count === 0) return null;
          return (
            <button key={tag} onClick={() => setActiveTag(tag)} style={{
              padding: "5px 12px", borderRadius: 16, whiteSpace: "nowrap",
              background: active ? T.goldBg : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? T.goldBorder : T.cardBorder}`,
              color: active ? T.goldLight : T.textDim,
              fontSize: 11, fontFamily: font.body, fontWeight: active ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {tag !== "전체" && "#"}{tag}
              {count > 0 && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 클립 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* 추가 카드 */}
        <div style={{
          aspectRatio: "3/4", borderRadius: 14,
          border: `1.5px dashed rgba(201,168,76,0.2)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", background: "rgba(201,168,76,0.02)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: T.goldBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: T.goldDim }}>+</div>
          <span style={{ fontSize: 11, color: T.goldDim, fontFamily: font.body }}>영상 추가</span>
        </div>

        {filtered.map((clip, i) => (
          <div key={i} style={{
            aspectRatio: "3/4", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: `1px solid ${T.cardBorder}`,
            overflow: "hidden", position: "relative", cursor: "pointer",
          }}>
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(${140 + i * 10}deg, rgba(74,222,128,0.02), rgba(201,168,76,0.03))`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "rgba(255,255,255,0.5)",
              }}>▶</div>
            </div>

            {/* Duration + Views */}
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
              <span style={{ background: "rgba(0,0,0,0.7)", borderRadius: 3, padding: "2px 5px", fontSize: 9, color: T.textSub, fontFamily: font.display }}>{clip.duration}</span>
            </div>

            {/* Tags */}
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 3 }}>
              {clip.tags.slice(0, 2).map((tag) => (
                <span key={tag} style={{
                  padding: "1px 5px", borderRadius: 3, fontSize: 8,
                  background: "rgba(201,168,76,0.15)", color: T.goldLight,
                  fontFamily: font.body, fontWeight: 500,
                }}>#{tag}</span>
              ))}
            </div>

            {/* Bottom info */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "24px 10px 10px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
            }}>
              <p style={{ fontFamily: font.body, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 3px", lineHeight: 1.3 }}>
                {clip.title}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.body }}>{clip.date}</span>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.display }}>👁 {clip.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ fontSize: 12, color: T.textDim, fontFamily: font.body }}>#{activeTag} 태그의 클립이 없어요</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB: 기록
// ═══════════════════════════════════════

function RecordsTab() {
  return (
    <div style={{ padding: "16px" }}>
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: 14, border: `1px solid ${T.cardBorder}`,
        padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(250,204,21,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{PLAYER.playStyle.icon}</div>
          <div>
            <p style={{ fontFamily: font.body, fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{PLAYER.playStyle.title}</p>
            <p style={{ fontFamily: font.body, fontSize: 9, color: T.textDim, margin: "1px 0 0", fontStyle: "italic" }}>"{PLAYER.playStyle.quote}"</p>
          </div>
        </div>
        <button style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.cardBorder}`, color: T.textDim, fontSize: 10, fontFamily: font.body, cursor: "pointer" }}>🔄</button>
      </div>

      <SectionHeader title="체력 측정" right={<AddButton label="기록 추가" gold />} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <VerifyBadge source="team" verifier="팀 인증" compact />
        <VerifyBadge source="self" compact />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {PLAYER.physicalTests.map((test) => {
          const isTeam = test.source === "team";
          return (
            <div key={test.key} style={{
              borderRadius: 12, padding: "12px 12px 10px",
              background: isTeam ? "rgba(74,222,128,0.015)" : "rgba(255,255,255,0.015)",
              border: `1px solid ${isTeam ? T.greenBorder : T.cardBorder}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: font.body, fontSize: 11, fontWeight: 600, color: T.textSub }}>{test.key}</span>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.body }}>{test.date}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 8 }}>
                <span style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1 }}>{test.value}</span>
                <span style={{ fontFamily: font.body, fontSize: 10, color: T.textDim }}>{test.unit}</span>
                {test.change && <span style={{ fontSize: 10, fontFamily: font.display, color: test.change.dir === "up" ? T.green : T.red, marginLeft: 2 }}>{test.change.dir === "up" ? "↑" : "↓"}{test.change.val}</span>}
              </div>
              <VerifyBadge source={test.source} verifier={test.verifier} compact />
            </div>
          );
        })}
      </div>

      <SectionHeader title="성장 추이" />
      <div style={{ borderRadius: 12, border: `1px solid ${T.cardBorder}`, overflow: "hidden" }}>
        {PLAYER.physicalTests.filter((t) => t.change).map((test, i, arr) => (
          <div key={test.key} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "11px 14px", background: "rgba(255,255,255,0.015)",
            borderBottom: i < arr.length - 1 ? `1px solid ${T.cardBorder}` : "none",
          }}>
            <span style={{ fontFamily: font.body, fontSize: 12, color: T.textSub }}>{test.key}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: font.display, fontSize: 14, fontWeight: 600, color: T.text }}>{test.value}{test.unit}</span>
              <span style={{
                fontSize: 11, fontFamily: font.display, fontWeight: 600,
                color: test.change.dir === "up" ? T.green : T.red,
                background: test.change.dir === "up" ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
                padding: "2px 7px", borderRadius: 4,
              }}>{test.change.dir === "up" ? "▲" : "▼"}{test.change.val}</span>
            </div>
          </div>
        ))}
        <div style={{ padding: "6px 14px", textAlign: "center" }}>
          <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.body }}>첫 기록 대비 변화량</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB: 커리어
// ═══════════════════════════════════════

function CareerTab() {
  return (
    <div style={{ padding: "16px" }}>
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, border: `1px solid ${T.cardBorder}`, padding: "14px 16px", marginBottom: 20 }}>
        <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.body, textTransform: "uppercase", letterSpacing: "0.08em" }}>현재 소속</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚽</div>
            <div>
              <span style={{ fontFamily: font.body, fontSize: 15, fontWeight: 700, color: T.text, display: "block" }}>{PLAYER.career.currentTeam.name}</span>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: font.body }}>{PLAYER.career.currentTeam.since} ~</span>
            </div>
          </div>
          <button style={{ padding: "5px 10px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.cardBorder}`, color: T.textSub, fontSize: 11, fontFamily: font.body, cursor: "pointer" }}>팀 보기 ›</button>
        </div>
      </div>

      <SectionHeader title="대회 기록" count={PLAYER.career.tournaments.length} right={<AddButton label="대회 추가" gold />} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {PLAYER.career.tournaments.map((t, i) => {
          const isTeam = t.source === "team";
          const hasP = t.personal && (t.personal.goals > 0 || t.personal.assists > 0 || t.personal.mvp);
          return (
            <div key={i} style={{
              borderRadius: 14, padding: "14px",
              background: isTeam ? "rgba(74,222,128,0.015)" : "rgba(255,255,255,0.015)",
              border: `1px solid ${isTeam ? T.greenBorder : T.cardBorder}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <TournamentTypeBadge type={t.type} />
                    <span style={{ fontSize: 9, color: T.textDim, fontFamily: font.body }}>{t.date}</span>
                  </div>
                  <h3 style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{t.name}</h3>
                </div>
                <VerifyBadge source={t.source} verifier={t.verifier} compact />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {t.result && <span style={{ padding: "3px 8px", borderRadius: 5, background: T.goldBg, border: `1px solid ${T.goldBorder}`, fontSize: 11, fontWeight: 600, color: T.goldLight, fontFamily: font.body }}>{t.result}</span>}
                {hasP && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {t.personal.goals > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ fontSize: 11 }}>⚽</span><span style={{ fontFamily: font.display, fontSize: 15, fontWeight: 700, color: T.text }}>{t.personal.goals}</span><span style={{ fontSize: 9, color: T.textDim }}>골</span></span>}
                    {t.personal.assists > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ fontSize: 11 }}>🅰️</span><span style={{ fontFamily: font.display, fontSize: 15, fontWeight: 700, color: T.text }}>{t.personal.assists}</span><span style={{ fontSize: 9, color: T.textDim }}>도움</span></span>}
                    {t.personal.mvp && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ fontSize: 11 }}>🏆</span><span style={{ fontSize: 10, fontWeight: 700, color: T.goldLight, fontFamily: font.body }}>MVP</span></span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SectionHeader title="수상 / 성과" right={<AddButton label="추가" />} />
      <div style={{ marginBottom: 20 }}>
        {PLAYER.career.awards.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: T.goldBg, borderRadius: 12, border: `1px solid ${T.goldBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🥇</span>
              <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 700, color: T.text }}>{a.title} · <span style={{ color: T.goldLight }}>{a.detail}</span></span>
            </div>
            <VerifyBadge source={a.source} verifier={a.verifier} compact />
          </div>
        ))}
      </div>

      <SectionHeader title="소속 이력" right={<AddButton label="이력 추가" />} />
      <div style={{ borderRadius: 12, border: `1px solid ${T.cardBorder}`, overflow: "hidden" }}>
        {PLAYER.career.history.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,0.015)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.current ? T.gold : T.textDim, flexShrink: 0 }} />
            <span style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>{c.team}</span>
            <span style={{ fontFamily: font.display, fontSize: 12, color: T.textDim }}>{c.period}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Bottom Nav
// ═══════════════════════════════════════

function BottomNav() {
  return (
    <div style={{ position: "sticky", bottom: 0, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(14px)", borderTop: `1px solid ${T.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "6px 0 10px", zIndex: 100 }}>
      {[{ icon: "🏠", label: "홈" }, { icon: "🏆", label: "MVP" }, { icon: "+", label: "업로드", center: true }, { icon: "🔍", label: "탐색" }, { icon: "👤", label: "내 프로필", active: true }].map((tab) =>
        tab.center ? (
          <div key="center" style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(145deg, ${T.gold}, #a88a2d)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#000", fontWeight: 700, marginTop: -14, boxShadow: `0 4px 20px rgba(201,168,76,0.25)` }}>+</div>
        ) : (
          <div key={tab.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", opacity: tab.active ? 1 : 0.35 }}>
            <span style={{ fontSize: 17 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontFamily: font.body, color: tab.active ? T.goldLight : T.textSub, fontWeight: tab.active ? 600 : 400 }}>{tab.label}</span>
            {tab.active && <div style={{ width: 14, height: 2, borderRadius: 1, background: T.gold, marginTop: 1 }} />}
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

export default function FootoryProfileV5() {
  const [activeTab, setActiveTab] = useState("highlights");
  const [teamState, setTeamState] = useState("has-team");
  const states = ["has-team", "no-team", "transferring"];
  const stateLabels = { "has-team": "팀 있음", "no-team": "팀 없음", "transferring": "진학/이적" };

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: T.dark, fontFamily: font.body, position: "relative", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", position: "sticky", top: 0, zIndex: 50, background: "rgba(8,8,8,0.94)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.cardBorder}` }}>
        <span style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, color: T.goldLight, letterSpacing: "0.08em" }}>FOOTORY</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* 팀 상태 토글 (데모용) */}
          <button onClick={() => { const i = states.indexOf(teamState); setTeamState(states[(i + 1) % states.length]); }} style={{
            padding: "3px 8px", borderRadius: 5,
            background: teamState === "has-team" ? T.greenBg : teamState === "transferring" ? T.blueBg : "rgba(248,113,113,0.08)",
            border: `1px solid ${teamState === "has-team" ? T.greenBorder : teamState === "transferring" ? T.blueBorder : "rgba(248,113,113,0.18)"}`,
            color: teamState === "has-team" ? T.green : teamState === "transferring" ? T.blue : T.red,
            fontSize: 9, fontFamily: font.body, cursor: "pointer",
          }}>
            {stateLabels[teamState]} ↔
          </button>
          <span style={{ fontSize: 16, cursor: "pointer" }}>💬</span>
          <span style={{ fontSize: 16, cursor: "pointer" }}>🔔</span>
          <span style={{ fontSize: 16, cursor: "pointer" }}>⚙️</span>
        </div>
      </div>

      <HeroSection teamState={teamState} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div key={activeTab} style={{ flex: 1, background: T.dark, paddingBottom: 70, animation: "fadeIn 0.2s ease-out" }}>
        {activeTab === "highlights" && <HighlightsTab />}
        {activeTab === "records" && <RecordsTab />}
        {activeTab === "career" && <CareerTab />}
      </div>

      <BottomNav />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        button:active { opacity: 0.7; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
