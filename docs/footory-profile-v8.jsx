import { useState, useEffect } from "react";

/*
 * FOOTORY 프로필 v8 — Premium
 * 
 * v7 피드백 반영:
 * 1. 신체정보 칩 → 인라인 subtle 텍스트
 * 2. 사진 오른쪽 각짐 → 전체 둥글게 처리
 * 3. 팔로워/팔로잉 → 터치 가능한 크기
 * 4. 액션바-탭바 간격 → 8px gap 분리
 * 5. 전반적 프리미엄 퀄리티 올림
 */

const C = {
  bg: "#070707",
  card: "#111111",
  elevated: "#161616",
  surface: "rgba(255,255,255,0.035)",
  gold: "#c9a84c",
  goldLight: "#e8d48b",
  goldSoft: "#bfa255",
  goldBg: "rgba(201,168,76,0.08)",
  goldBorder: "rgba(201,168,76,0.18)",
  text: "#f5f5f5",
  sub: "rgba(255,255,255,0.52)",
  muted: "rgba(255,255,255,0.24)",
  faint: "rgba(255,255,255,0.10)",
  green: "#4ade80",
  greenBg: "rgba(74,222,128,0.08)",
  greenBd: "rgba(74,222,128,0.20)",
  red: "#f87171",
  redBg: "rgba(248,113,113,0.08)",
  blue: "#60a5fa",
  blueBg: "rgba(96,165,250,0.08)",
  blueBd: "rgba(96,165,250,0.20)",
  bd: "rgba(255,255,255,0.06)",
};
const R = { xl: 24, lg: 20, md: 14, sm: 10, pill: 50 };
const F = { d: "'Oswald', sans-serif", b: "'Noto Sans KR', sans-serif" };

// Data
const P = {
  name: "박로건", handle: "@logan", position: "FW",
  team: "FC서울 U-15", teamSince: "2025",
  birthYear: 2010, region: "서울", height: 165, weight: 55, foot: "오른발",
  mvpCount: 2, followers: 2, following: 1, views: 359,
  playStyle: "공격형 드리블러",
  tests: [
    { key: "50m 달리기", val: "7.3", u: "초", date: "3/13", src: "team", by: "FC서울 U-15" },
    { key: "1000m", val: "5:20", u: "", date: "3/15", src: "team", by: "FC서울 U-15", ch: { v: "1:05", d: "up" } },
    { key: "슈팅 속도", val: "86", u: "km/h", date: "3/15", src: "team", by: "FC서울 U-15", ch: { v: 6, d: "up" } },
    { key: "리프팅", val: "500", u: "회", date: "3/15", src: "self", ch: { v: 180, d: "up" } },
  ],
  tournaments: [
    { name: "2026 전국 소년체전", type: "공식대회", date: "2026.02", result: "8강", g: 3, a: 1, mvp: true, src: "team", by: "FC서울 U-15" },
    { name: "2025 추계 유소년 리그", type: "리그", date: "2025.09~11", result: "리그 3위", g: 5, a: 2, mvp: false, src: "team", by: "FC서울 U-15" },
    { name: "2025 여름 친선 교류전", type: "친선", date: "2025.07", result: null, g: 2, a: 0, mvp: false, src: "self" },
  ],
  awards: [{ title: "2026 소년체전", detail: "MVP", src: "team", by: "대한축구협회" }],
  history: [{ team: "FC서울 U-15", period: "2025 ~", current: true }],
  featured: { title: "소년체전 8강 하이라이트", dur: "0:42", views: 124, tags: ["드리블", "슈팅"] },
  clips: [
    { title: "vs 수원전 드리블 돌파", dur: "0:14", date: "3/10", tags: ["드리블"], views: 52 },
    { title: "연습경기 프리킥 골", dur: "0:08", date: "3/08", tags: ["슈팅"], views: 31 },
    { title: "1대1 수비수 제치기", dur: "0:11", date: "2/20", tags: ["드리블"], views: 28 },
    { title: "크로스에서 헤딩 골", dur: "0:06", date: "2/15", tags: ["슈팅"], views: 19 },
  ],
};

// ═══════════════════════════════════════
// Shared
// ═══════════════════════════════════════

function Badge({ src, by }) {
  const t = src === "team";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: R.pill, fontSize: 10,
      fontFamily: F.b, fontWeight: 500, letterSpacing: "-0.01em",
      background: t ? C.greenBg : C.surface,
      border: `1px solid ${t ? C.greenBd : C.bd}`,
      color: t ? C.green : C.muted,
    }}>{t ? "✓ " + (by || "팀 인증") : "○ 자기 기록"}</span>
  );
}

function Sec({ title, count, right, style: s }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, ...s }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: C.gold }} />
        <span style={{ fontFamily: F.b, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{title}</span>
        {count != null && <span style={{ fontFamily: F.d, fontSize: 11, color: C.muted, background: C.surface, borderRadius: R.pill, padding: "2px 8px" }}>{count}</span>}
      </div>
      {right}
    </div>
  );
}

function Btn({ children, gold }) {
  return (
    <button style={{
      padding: "6px 14px", borderRadius: R.md,
      background: gold ? C.goldBg : C.surface,
      border: `1px solid ${gold ? C.goldBorder : C.bd}`,
      color: gold ? C.goldLight : C.muted,
      fontSize: 11, fontFamily: F.b, fontWeight: 600, cursor: "pointer",
    }}>{children}</button>
  );
}

function TType({ type }) {
  const m = { "공식대회": { c: C.goldLight, bg: C.goldBg, bd: C.goldBorder }, "리그": { c: C.blue, bg: C.blueBg, bd: C.blueBd }, "친선": { c: C.sub, bg: C.surface, bd: C.bd } };
  const s = m[type] || m["친선"];
  return <span style={{ padding: "2px 9px", borderRadius: R.sm, fontSize: 10, fontFamily: F.b, fontWeight: 600, background: s.bg, border: `1px solid ${s.bd}`, color: s.c }}>{type}</span>;
}

// ═══════════════════════════════════════
// HERO — 프리미엄 리디자인
// ═══════════════════════════════════════

function Hero({ noTeam }) {
  return (
    <div style={{ padding: "8px 14px 0" }}>
      <div style={{
        background: C.card, borderRadius: R.xl,
        border: `1px solid ${C.bd}`, overflow: "hidden",
      }}>
        {/* 상단: 사진 + 정보 */}
        <div style={{ display: "flex", padding: 14, gap: 16 }}>
          {/* 사진 — 둥근 모서리 */}
          <div style={{
            width: 120, height: 150, flexShrink: 0,
            borderRadius: R.lg, overflow: "hidden",
            position: "relative",
            background: "linear-gradient(170deg, #1a1a1a, #0c0c0c)",
          }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 40% 55%, rgba(201,168,76,0.07), transparent 60%)` }} />
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="48" height="60" viewBox="0 0 120 140" fill="none" opacity="0.18">
                <circle cx="60" cy="42" r="28" fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.3)" strokeWidth="1" />
                <path d="M22 132 Q22 94 60 87 Q98 94 98 132" fill="rgba(201,168,76,0.12)" />
              </svg>
            </div>
            {/* Position */}
            <div style={{
              position: "absolute", top: 8, left: 8,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
              borderRadius: 8, padding: "3px 10px",
              border: `1px solid rgba(201,168,76,0.25)`,
            }}>
              <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: C.goldLight }}>{P.position}</span>
            </div>
            {/* MVP */}
            {P.mvpCount > 0 && (
              <div style={{
                position: "absolute", bottom: 8, left: 8, right: 8,
                background: "rgba(201,168,76,0.15)", backdropFilter: "blur(8px)",
                borderRadius: 8, padding: "4px 0",
                textAlign: "center",
                border: `1px solid rgba(201,168,76,0.3)`,
              }}>
                <span style={{ fontFamily: F.d, fontSize: 11, fontWeight: 600, color: C.goldLight }}>MVP ×{P.mvpCount}</span>
              </div>
            )}
          </div>

          {/* 정보 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* 이름 */}
            <h1 style={{
              fontFamily: F.b, fontSize: 22, fontWeight: 800,
              color: C.text, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1,
            }}>{P.name}</h1>
            <p style={{
              fontFamily: F.b, fontSize: 12, color: C.muted,
              margin: "4px 0 12px", letterSpacing: "-0.01em",
            }}>{P.handle} · {P.region}</p>

            {/* 신체정보 — 칩 대신 인라인 */}
            <p style={{
              fontFamily: F.b, fontSize: 12, color: C.sub,
              margin: "0 0 10px", lineHeight: 1.6, letterSpacing: "-0.01em",
            }}>
              {P.birthYear}년생 · {P.height}cm · {P.weight}kg · {P.foot}
            </p>

            {/* 플레이 스타일 */}
            <div style={{
              display: "inline-flex", alignSelf: "flex-start",
              padding: "5px 14px", borderRadius: R.pill,
              background: C.goldBg, border: `1px solid ${C.goldBorder}`,
              marginBottom: 12,
            }}>
              <span style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.goldLight, letterSpacing: "-0.01em" }}>{P.playStyle}</span>
            </div>

            {/* 팀 */}
            {!noTeam ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontFamily: F.b, fontSize: 12, fontWeight: 600, color: C.sub, flex: 1 }}>{P.team}</span>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: F.b, padding: "2px 8px", borderRadius: R.sm, border: `1px solid ${C.bd}`, cursor: "pointer" }}>변경</span>
              </div>
            ) : (
              <div style={{
                padding: "10px 12px", borderRadius: R.md,
                background: C.goldBg, border: `1px solid ${C.goldBorder}`, cursor: "pointer",
              }}>
                <span style={{ fontFamily: F.b, fontSize: 12, fontWeight: 700, color: C.goldLight, display: "block", marginBottom: 4 }}>팀에 소속되어 보세요</span>
                <span style={{ fontSize: 10, color: C.goldSoft, fontFamily: F.b }}>초대코드 가입 · 팀 만들기</span>
              </div>
            )}
          </div>
        </div>

        {/* 팔로워 — 터치 가능한 크기 */}
        <div style={{
          display: "flex",
          margin: "0 14px",
          borderRadius: R.md,
          overflow: "hidden",
          border: `1px solid ${C.bd}`,
          marginBottom: 14,
        }}>
          {[
            { label: "팔로워", val: P.followers },
            { label: "팔로잉", val: P.following },
            { label: "조회", val: P.views },
          ].map(({ label, val }, i) => (
            <div key={label} style={{
              flex: 1, padding: "12px 0", textAlign: "center",
              background: C.surface, cursor: "pointer",
              borderRight: i < 2 ? `1px solid ${C.bd}` : "none",
              transition: "background 0.15s",
            }}>
              <span style={{
                display: "block", fontFamily: F.d, fontSize: 18,
                fontWeight: 700, color: C.text, lineHeight: 1,
              }}>{val}</span>
              <span style={{
                display: "block", fontSize: 10, color: C.muted,
                fontFamily: F.b, marginTop: 3,
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* 액션 바 */}
        <div style={{
          display: "flex",
          borderTop: `1px solid ${C.bd}`,
        }}>
          {["공유", "PDF", "편집"].map((label, i) => (
            <button key={label} style={{
              flex: 1, padding: "13px 0",
              background: "transparent", border: "none",
              borderRight: i < 2 ? `1px solid ${C.bd}` : "none",
              color: i === 0 ? C.goldLight : C.muted,
              fontSize: 13, fontFamily: F.b,
              fontWeight: i === 0 ? 600 : 400,
              cursor: "pointer", letterSpacing: "-0.01em",
            }}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB BAR — 분리감
// ═══════════════════════════════════════

function Tabs({ active, set }) {
  return (
    <div style={{
      margin: "10px 14px 0", /* 액션바와 간격 */
      background: C.card,
      borderRadius: R.lg, overflow: "hidden",
      border: `1px solid ${C.bd}`,
      display: "flex",
      position: "sticky", top: 49, zIndex: 40,
    }}>
      {["하이라이트", "기록", "커리어"].map((t, i) => {
        const keys = ["hl", "rec", "car"];
        const on = active === keys[i];
        return (
          <button key={t} onClick={() => set(keys[i])} style={{
            flex: 1, padding: "14px 0 12px",
            background: on ? C.surface : "transparent",
            border: "none",
            borderBottom: on ? `2.5px solid ${C.gold}` : "2.5px solid transparent",
            color: on ? C.goldLight : C.muted,
            fontFamily: F.b, fontSize: 13,
            fontWeight: on ? 700 : 400,
            cursor: "pointer",
            letterSpacing: "-0.01em",
            transition: "all 0.15s",
          }}>{t}</button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════
// 하이라이트
// ═══════════════════════════════════════

function HlTab() {
  const [tag, setTag] = useState("전체");
  const tags = ["전체", "드리블", "슈팅", "패스"];
  const list = tag === "전체" ? P.clips : P.clips.filter((c) => c.tags.includes(tag));
  const fc = P.featured;

  return (
    <div style={{ padding: "20px 14px" }}>
      {/* 대표 영상 */}
      {fc && (
        <div style={{ marginBottom: 28 }}>
          <Sec title="대표 영상" right={<span style={{ fontSize: 10, color: C.muted, fontFamily: F.b }}>스카우터가 가장 먼저 봅니다</span>} />
          <div style={{
            borderRadius: R.xl, overflow: "hidden", position: "relative",
            border: `1.5px solid rgba(201,168,76,0.25)`,
            boxShadow: `0 4px 24px rgba(201,168,76,0.06)`,
          }}>
            <div style={{
              width: "100%", aspectRatio: "16/9",
              background: "linear-gradient(140deg, #151515, #090909)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 35% 50%, rgba(201,168,76,0.04), transparent 50%)` }} />
              {/* Play */}
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "rgba(201,168,76,0.10)", backdropFilter: "blur(10px)",
                border: `1.5px solid rgba(201,168,76,0.30)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 0, height: 0, borderLeft: "18px solid rgba(232,212,139,0.85)", borderTop: "11px solid transparent", borderBottom: "11px solid transparent", marginLeft: 4 }} />
              </div>

              <div style={{ position: "absolute", top: 12, left: 12, background: C.gold, borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 800, fontFamily: F.d, color: "#000", letterSpacing: "0.04em" }}>FEATURED</div>
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "3px 8px", fontSize: 11, color: C.sub, fontFamily: F.d }}>{fc.dur}</div>

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 16px 14px", background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}>
                <h3 style={{ fontFamily: F.b, fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{fc.title}</h3>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {fc.tags.map((t) => (
                    <span key={t} style={{ padding: "2px 10px", borderRadius: R.pill, fontSize: 10, background: "rgba(201,168,76,0.12)", border: `1px solid rgba(201,168,76,0.2)`, color: C.goldLight, fontFamily: F.b }}>#{t}</span>
                  ))}
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: F.d, marginLeft: "auto" }}>{fc.views}회</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 클립 */}
      <Sec title="전체 클립" count={P.clips.length} right={<Btn gold>+ 영상 추가</Btn>} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 16 }}>
        {tags.map((t) => {
          const on = tag === t;
          const n = t === "전체" ? P.clips.length : P.clips.filter((c) => c.tags.includes(t)).length;
          if (t !== "전체" && n === 0) return null;
          return (
            <button key={t} onClick={() => setTag(t)} style={{
              padding: "7px 18px", borderRadius: R.pill, whiteSpace: "nowrap",
              background: on ? C.goldBg : C.surface,
              border: `1px solid ${on ? C.goldBorder : C.bd}`,
              color: on ? C.goldLight : C.muted,
              fontSize: 12, fontFamily: F.b, fontWeight: on ? 600 : 400, cursor: "pointer",
            }}>{t !== "전체" ? `#${t}` : t} <span style={{ opacity: 0.4, marginLeft: 3, fontSize: 10 }}>{n}</span></button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{
          aspectRatio: "3/4", borderRadius: R.xl,
          border: `1.5px dashed rgba(201,168,76,0.18)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", background: "rgba(201,168,76,0.015)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.goldBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, color: C.goldSoft, fontWeight: 300 }}>+</span>
          </div>
          <span style={{ fontSize: 11, color: C.goldSoft, fontFamily: F.b }}>영상 추가</span>
        </div>

        {list.map((c, i) => (
          <div key={i} style={{
            aspectRatio: "3/4", borderRadius: R.xl,
            background: C.card, border: `1px solid ${C.bd}`,
            overflow: "hidden", position: "relative", cursor: "pointer",
          }}>
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(${150 + i * 7}deg, rgba(255,255,255,0.01), rgba(201,168,76,0.015))`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 0, height: 0, borderLeft: "12px solid rgba(255,255,255,0.35)", borderTop: "7px solid transparent", borderBottom: "7px solid transparent", marginLeft: 2 }} />
              </div>
            </div>
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4 }}>
              {c.tags.slice(0, 2).map((t) => <span key={t} style={{ padding: "2px 7px", borderRadius: 6, fontSize: 9, background: "rgba(201,168,76,0.18)", color: C.goldLight, fontFamily: F.b }}>#{t}</span>)}
            </div>
            <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 6px", fontSize: 10, color: C.sub, fontFamily: F.d }}>{c.dur}</span>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 12px 12px", background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
              <p style={{ fontFamily: F.b, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.72)", margin: "0 0 3px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{c.title}</p>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9, color: C.muted }}>{c.date}</span>
                <span style={{ fontSize: 9, color: C.muted, fontFamily: F.d }}>{c.views}회</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <p style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: C.muted }}>#{tag} 태그의 클립이 없어요</p>}
    </div>
  );
}

// ═══════════════════════════════════════
// 기록
// ═══════════════════════════════════════

function RecTab() {
  return (
    <div style={{ padding: "20px 14px" }}>
      {/* 플레이 스타일 */}
      <div style={{
        background: C.card, borderRadius: R.xl, border: `1px solid ${C.bd}`,
        padding: "16px 18px", marginBottom: 28,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: F.b, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{P.playStyle}</span>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: F.b, padding: "5px 12px", borderRadius: R.sm, border: `1px solid ${C.bd}`, cursor: "pointer" }}>다시 테스트</span>
      </div>

      <Sec title="체력 측정" right={<Btn gold>+ 기록 추가</Btn>} />
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Badge src="team" by="팀 인증" />
        <Badge src="self" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {P.tests.map((t) => {
          const tm = t.src === "team";
          return (
            <div key={t.key} style={{
              borderRadius: R.xl, padding: "14px 14px 12px",
              background: tm ? "rgba(74,222,128,0.015)" : C.card,
              border: `1px solid ${tm ? C.greenBd : C.bd}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: F.b, fontSize: 12, fontWeight: 600, color: C.sub, letterSpacing: "-0.01em" }}>{t.key}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{t.date}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <span style={{ fontFamily: F.d, fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1 }}>{t.val}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{t.u}</span>
                {t.ch && <span style={{ fontSize: 11, fontFamily: F.d, color: t.ch.d === "up" ? C.green : C.red, marginLeft: 3 }}>{t.ch.d === "up" ? "↑" : "↓"}{t.ch.v}</span>}
              </div>
              <Badge src={t.src} by={t.by} />
            </div>
          );
        })}
      </div>

      <Sec title="성장 추이" />
      <div style={{ borderRadius: R.xl, border: `1px solid ${C.bd}`, overflow: "hidden" }}>
        {P.tests.filter((t) => t.ch).map((t, i, a) => (
          <div key={t.key} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", background: C.card,
            borderBottom: i < a.length - 1 ? `1px solid ${C.faint}` : "none",
          }}>
            <span style={{ fontFamily: F.b, fontSize: 13, color: C.sub, letterSpacing: "-0.01em" }}>{t.key}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: F.d, fontSize: 15, fontWeight: 600, color: C.text }}>{t.val}{t.u}</span>
              <span style={{
                fontSize: 12, fontFamily: F.d, fontWeight: 600,
                color: t.ch.d === "up" ? C.green : C.red,
                background: t.ch.d === "up" ? C.greenBg : C.redBg,
                padding: "3px 10px", borderRadius: R.sm,
              }}>{t.ch.d === "up" ? "▲" : "▼"}{t.ch.v}</span>
            </div>
          </div>
        ))}
        <div style={{ padding: "8px", textAlign: "center" }}>
          <span style={{ fontSize: 10, color: C.muted }}>첫 기록 대비 변화량</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 커리어
// ═══════════════════════════════════════

function CarTab() {
  return (
    <div style={{ padding: "20px 14px" }}>
      <div style={{ background: C.card, borderRadius: R.xl, border: `1px solid ${C.bd}`, padding: "16px 18px", marginBottom: 28 }}>
        <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.b }}>현재 소속</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <div>
            <span style={{ fontFamily: F.b, fontSize: 16, fontWeight: 700, color: C.text, display: "block", letterSpacing: "-0.01em" }}>{P.team}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{P.teamSince} ~</span>
          </div>
          <span style={{ padding: "7px 14px", borderRadius: R.md, background: C.surface, border: `1px solid ${C.bd}`, color: C.sub, fontSize: 12, fontFamily: F.b, cursor: "pointer" }}>팀 보기 ›</span>
        </div>
      </div>

      <Sec title="대회 기록" count={P.tournaments.length} right={<Btn gold>+ 대회 추가</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {P.tournaments.map((t, i) => {
          const tm = t.src === "team";
          return (
            <div key={i} style={{
              borderRadius: R.xl, padding: "16px",
              background: tm ? "rgba(74,222,128,0.015)" : C.card,
              border: `1px solid ${tm ? C.greenBd : C.bd}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <TType type={t.type} />
                    <span style={{ fontSize: 10, color: C.muted }}>{t.date}</span>
                  </div>
                  <h3 style={{ fontFamily: F.b, fontSize: 15, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.01em" }}>{t.name}</h3>
                </div>
                <Badge src={t.src} by={t.by} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {t.result && <span style={{ padding: "4px 12px", borderRadius: R.sm, background: C.goldBg, border: `1px solid ${C.goldBorder}`, fontSize: 12, fontWeight: 700, color: C.goldLight }}>{t.result}</span>}
                <div style={{ display: "flex", gap: 14 }}>
                  {t.g > 0 && <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.text }}>{t.g}<span style={{ fontSize: 10, color: C.muted, fontFamily: F.b, marginLeft: 2 }}>골</span></span>}
                  {t.a > 0 && <span style={{ fontFamily: F.d, fontSize: 16, fontWeight: 700, color: C.text }}>{t.a}<span style={{ fontSize: 10, color: C.muted, fontFamily: F.b, marginLeft: 2 }}>도움</span></span>}
                  {t.mvp && <span style={{ fontSize: 11, fontWeight: 700, color: C.goldLight, fontFamily: F.b }}>MVP</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Sec title="수상 / 성과" right={<Btn gold>+ 추가</Btn>} />
      {P.awards.map((a, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", background: C.goldBg, borderRadius: R.xl,
          border: `1px solid ${C.goldBorder}`, marginBottom: 12,
        }}>
          <span style={{ fontFamily: F.b, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
            {a.title} · <span style={{ color: C.goldLight }}>{a.detail}</span>
          </span>
          <Badge src={a.src} by={a.by} />
        </div>
      ))}

      <Sec title="소속 이력" right={<Btn gold>+ 이력 추가</Btn>} style={{ marginTop: 16 }} />
      <div style={{ borderRadius: R.xl, border: `1px solid ${C.bd}`, overflow: "hidden" }}>
        {P.history.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.card }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.current ? C.gold : C.muted }} />
            <span style={{ fontFamily: F.b, fontSize: 14, fontWeight: 600, color: C.text, flex: 1, letterSpacing: "-0.01em" }}>{c.team}</span>
            <span style={{ fontFamily: F.d, fontSize: 12, color: C.muted }}>{c.period}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// NAV
// ═══════════════════════════════════════

function Nav() {
  return (
    <div style={{
      position: "sticky", bottom: 0, background: "rgba(7,7,7,0.97)", backdropFilter: "blur(16px)",
      borderTop: `1px solid ${C.bd}`, display: "flex", alignItems: "center",
      justifyContent: "space-around", padding: "8px 0 14px", zIndex: 100,
    }}>
      {["홈", "MVP", "+", "탐색", "내 프로필"].map((t, i) =>
        t === "+" ? (
          <div key="c" style={{
            width: 46, height: 46, borderRadius: "50%",
            background: `linear-gradient(145deg, ${C.gold}, #a08030)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "#000", fontWeight: 700, marginTop: -14,
            boxShadow: `0 4px 20px rgba(201,168,76,0.25)`,
          }}>+</div>
        ) : (
          <div key={t} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            cursor: "pointer", opacity: i === 4 ? 1 : 0.28,
            padding: "0 4px",
          }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: i === 4 ? C.gold : "transparent", marginBottom: 2 }} />
            <span style={{ fontSize: 10, fontFamily: F.b, color: i === 4 ? C.goldLight : C.sub, fontWeight: i === 4 ? 600 : 400, letterSpacing: "-0.01em" }}>{t}</span>
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

export default function FootoryV8() {
  const [tab, setTab] = useState("hl");
  const [noTeam, setNoTeam] = useState(false);

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: C.bg, fontFamily: F.b, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", position: "sticky", top: 0, zIndex: 50,
        background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)",
      }}>
        <span style={{ fontFamily: F.d, fontSize: 19, fontWeight: 700, color: C.goldLight, letterSpacing: "0.08em" }}>FOOTORY</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => setNoTeam(!noTeam)} style={{
            padding: "3px 8px", borderRadius: R.sm,
            background: noTeam ? C.redBg : C.greenBg,
            border: `1px solid ${noTeam ? "rgba(248,113,113,0.2)" : C.greenBd}`,
            color: noTeam ? C.red : C.green, fontSize: 9, fontFamily: F.b, cursor: "pointer",
          }}>{noTeam ? "팀X" : "팀O"}</button>
          {["DM", "알림"].map((t) => (
            <span key={t} style={{ fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: F.b, letterSpacing: "-0.01em" }}>{t}</span>
          ))}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" style={{ cursor: "pointer" }}>
            <circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.6-7.4-1.4 1.4M6 6 4.6 4.6m0 14.8L6 18m12 0 1.4 1.4" />
          </svg>
        </div>
      </div>

      <Hero noTeam={noTeam} />
      <Tabs active={tab} set={setTab} />

      <div key={tab} style={{ flex: 1, paddingBottom: 80, animation: "fadeUp 0.2s ease-out" }}>
        {tab === "hl" && <HlTab />}
        {tab === "rec" && <RecTab />}
        {tab === "car" && <CarTab />}
      </div>

      <Nav />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; }
        button { font-family: inherit; }
        button:active { opacity: 0.7; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
