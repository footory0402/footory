"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import {
  buildShortFormCopy,
  buildMatchHighlightCopy,
  getMatchHighlightPresetConfig,
  getShortFormPresetConfig,
  MATCH_HIGHLIGHT_PRESETS,
  parseMatchRanges,
  SHORT_FORM_PRESETS,
  SHORT_FORM_TAGS,
  type MatchHighlightPreset,
  type ShortFormPreset,
  type ShortFormTag,
} from "@/lib/video-lab";

const MAX_SHORT_FILE_SIZE = 100 * 1024 * 1024;
const MAX_MATCH_FILE_SIZE = 300 * 1024 * 1024;

interface RenderResult {
  outputUrl: string;
  durationSeconds: number;
  renderMs: number;
  headline: string;
  caption: string;
  badge: string;
  bgmLabel: string;
  bgmHint: string;
}

interface MatchRenderResult {
  outputUrl: string;
  durationSeconds: number;
  renderMs: number;
  title: string;
  subtitle: string;
  bgmLabel: string;
  rangeCount: number;
  rangeLabels: string[];
}

type LabTab = "short" | "match";

export default function VideoLabClient({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<LabTab>("short");

  return (
    <div className="min-h-screen bg-bg">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-brand text-base font-bold tracking-wide text-text-1">
                Video Lab
              </span>
              <span className="rounded-full bg-[rgba(212,168,83,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-text-3">{adminEmail}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-t border-border">
          <TabBtn active={tab === "short"} onClick={() => setTab("short")}>
            🎬 숏폼
          </TabBtn>
          <TabBtn active={tab === "match"} onClick={() => setTab("match")}>
            🏟️ 풀경기
          </TabBtn>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="pb-12">
        {tab === "short" ? <ShortFormLab /> : <MatchHighlightLab />}
      </div>
    </div>
  );
}

// ── Short Form Lab ──────────────────────────────────────────────

function ShortFormLab() {
  const [file, setFile] = useState<File | null>(null);
  const [playerName, setPlayerName] = useState("FOOTORY PLAYER");
  const [tag, setTag] = useState<ShortFormTag>("슈팅");
  const [preset, setPreset] = useState<ShortFormPreset>("clean");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const presetConfig = getShortFormPresetConfig(preset);
  const copy = buildShortFormCopy(playerName, tag, preset);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || isRendering) return;
    if (!file.type.startsWith("video/")) { setError("영상 파일만 업로드할 수 있어요."); return; }
    if (file.size > MAX_SHORT_FILE_SIZE) { setError("파일 크기는 100MB 이하만 가능합니다."); return; }

    setError(null);
    setResult(null);
    setIsRendering(true);

    const fd = new FormData();
    fd.append("video", file);
    fd.append("playerName", playerName);
    fd.append("tag", tag);
    fd.append("preset", preset);

    try {
      const res = await fetch("/api/admin/video-lab/short-form", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "렌더링에 실패했어요.");
      setResult(body.result as RenderResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "렌더링에 실패했어요.");
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* 파일 업로드 */}
      <Section title="원본 클립" subtitle="9:16 숏폼으로 렌더됩니다 · 최대 100MB">
        <input ref={inputRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null); }} />

        <button type="button" onClick={() => inputRef.current?.click()}
          className="relative flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors active:bg-card-alt">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg text-2xl">
            {file ? "✅" : "🎬"}
          </div>
          <div className="min-w-0 flex-1">
            {file ? (
              <>
                <p className="truncate text-[13px] font-semibold text-text-1">{file.name}</p>
                <p className="text-xs text-text-3">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-text-1">파일 선택</p>
                <p className="text-xs text-text-3">MP4, MOV 지원</p>
              </>
            )}
          </div>
          {file && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="shrink-0 text-text-3 active:text-red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </button>

        {/* 인라인 미리보기 */}
        {previewUrl && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <video src={previewUrl} controls className="aspect-video w-full bg-bg object-cover" />
          </div>
        )}
      </Section>

      {/* 설정 */}
      <Section title="설정">
        <div className="space-y-4">
          <Field label="선수명">
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)}
              className="field-input" placeholder="FOOTORY PLAYER" />
          </Field>

          <Field label="기술 태그">
            <div className="flex flex-wrap gap-2">
              {SHORT_FORM_TAGS.map((t) => (
                <button key={t} type="button" onClick={() => setTag(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    tag === t ? "bg-accent text-bg" : "bg-card-alt text-text-2 active:bg-elevated"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="프리셋">
            <div className="grid grid-cols-3 gap-2">
              {SHORT_FORM_PRESETS.map((item) => (
                <button key={item.id} type="button" onClick={() => setPreset(item.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    preset === item.id
                      ? "border-[rgba(212,168,83,0.5)] bg-[rgba(212,168,83,0.08)]"
                      : "border-border bg-card active:bg-card-alt"
                  }`}>
                  <span className="mb-1.5 block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                  <p className="text-[12px] font-semibold text-text-1">{item.label}</p>
                  <p className="mt-0.5 text-[10px] text-text-3 line-clamp-1">{item.bgmHint}</p>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* 렌더 예상 */}
      <Section title="렌더 예상">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="자막" value={copy.headline} dot={presetConfig.accent} />
          <MetricCard label="캡션" value={copy.caption} dot={presetConfig.accent} />
          <MetricCard label="BGM" value={copy.bgmLabel} sub={copy.bgmHint} dot={presetConfig.accent} className="col-span-2" />
        </div>
      </Section>

      {/* 에러 */}
      {error && (
        <div className="mx-4 mb-4 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-[13px] text-red">
          {error}
        </div>
      )}

      {/* 렌더 버튼 */}
      <div className="px-4 pb-4">
        <Button type="submit" size="full" disabled={!file || isRendering}>
          {isRendering ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/40 border-t-bg" />
              렌더링 중...
            </span>
          ) : "실제 MP4 뽑기 →"}
        </Button>
      </div>

      {/* 결과 */}
      {result && <ShortFormResult result={result} />}
    </form>
  );
}

function ShortFormResult({ result }: { result: RenderResult }) {
  return (
    <Section title="결과" rightSlot={
      <a href={result.outputUrl} target="_blank" rel="noreferrer"
        className="text-xs text-accent active:opacity-70">새 탭 ↗</a>
    }>
      <div className="overflow-hidden rounded-xl border border-border">
        <video src={result.outputUrl} controls className="aspect-[9/16] w-full bg-bg object-cover" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatRow label="렌더 시간" value={`${(result.renderMs / 1000).toFixed(1)}s`} />
        <StatRow label="영상 길이" value={`${result.durationSeconds.toFixed(1)}s`} />
        <StatRow label="자막" value={result.headline} />
        <StatRow label="뱃지" value={result.badge} />
      </div>

      <div className="mt-3 rounded-xl bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.15)] p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-accent">검토 포인트</p>
        <ul className="space-y-1.5">
          {["자막 카피가 장면 톤과 맞는지", "크롭·배경 처리가 공유용으로 좋은지", "사운드 분위기가 영상을 올려주는지", "한 번에 '쓸 만하다'는 느낌이 오는지"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-[12px] text-text-2">
              <span className="text-accent">·</span>{item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

// ── Match Highlight Lab ──────────────────────────────────────────

function MatchHighlightLab() {
  const [matchFile, setMatchFile] = useState<File | null>(null);
  const [matchPlayerName, setMatchPlayerName] = useState("FOOTORY PLAYER");
  const [matchPreset, setMatchPreset] = useState<MatchHighlightPreset>("focus");
  const [matchRanges, setMatchRanges] = useState("00:00-00:02\n00:03-00:06");
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchRenderResult | null>(null);
  const [isMatchRendering, setIsMatchRendering] = useState(false);
  const matchInputRef = useRef<HTMLInputElement>(null);

  const matchPreviewUrl = useMemo(() => (matchFile ? URL.createObjectURL(matchFile) : null), [matchFile]);
  useEffect(() => () => { if (matchPreviewUrl) URL.revokeObjectURL(matchPreviewUrl); }, [matchPreviewUrl]);

  const matchPresetConfig = getMatchHighlightPresetConfig(matchPreset);
  const parsedMatchRanges = useMemo(() => { try { return parseMatchRanges(matchRanges); } catch { return []; } }, [matchRanges]);
  const matchCopy = buildMatchHighlightCopy(matchPlayerName, matchPreset, parsedMatchRanges.length);

  async function handleMatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matchFile || isMatchRendering) return;
    if (!matchFile.type.startsWith("video/")) { setMatchError("영상 파일만 업로드할 수 있어요."); return; }
    if (matchFile.size > MAX_MATCH_FILE_SIZE) { setMatchError("파일은 300MB 이하만 가능합니다."); return; }

    try { parseMatchRanges(matchRanges); }
    catch (err) { setMatchError(err instanceof Error ? err.message : "range 형식을 확인해주세요."); return; }

    setMatchError(null);
    setMatchResult(null);
    setIsMatchRendering(true);

    const fd = new FormData();
    fd.append("video", matchFile);
    fd.append("playerName", matchPlayerName);
    fd.append("preset", matchPreset);
    fd.append("ranges", matchRanges);

    try {
      const res = await fetch("/api/admin/video-lab/match-highlight", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "렌더링에 실패했어요.");
      setMatchResult(body.result as MatchRenderResult);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "렌더링에 실패했어요.");
    } finally {
      setIsMatchRendering(false);
    }
  }

  return (
    <form onSubmit={handleMatchSubmit} className="space-y-0">
      {/* 파일 업로드 */}
      <Section title="풀경기 원본" subtitle="16:9 하이라이트로 렌더됩니다 · 최대 300MB">
        <input ref={matchInputRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => { setMatchFile(e.target.files?.[0] ?? null); setMatchResult(null); setMatchError(null); }} />

        <button type="button" onClick={() => matchInputRef.current?.click()}
          className="relative flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors active:bg-card-alt">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg text-2xl">
            {matchFile ? "✅" : "🏟️"}
          </div>
          <div className="min-w-0 flex-1">
            {matchFile ? (
              <>
                <p className="truncate text-[13px] font-semibold text-text-1">{matchFile.name}</p>
                <p className="text-xs text-text-3">{(matchFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-text-1">경기 영상 선택</p>
                <p className="text-xs text-text-3">MP4, MOV 지원</p>
              </>
            )}
          </div>
          {matchFile && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); setMatchFile(null); setMatchResult(null); }}
              className="shrink-0 text-text-3 active:text-red">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </button>

        {matchPreviewUrl && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <video src={matchPreviewUrl} controls className="aspect-video w-full bg-bg object-cover" />
          </div>
        )}
      </Section>

      {/* 설정 */}
      <Section title="설정">
        <div className="space-y-4">
          <Field label="대상 선수">
            <input value={matchPlayerName} onChange={(e) => setMatchPlayerName(e.target.value)}
              className="field-input" placeholder="FOOTORY PLAYER" />
          </Field>

          <Field label="프리셋">
            <div className="grid grid-cols-3 gap-2">
              {MATCH_HIGHLIGHT_PRESETS.map((item) => (
                <button key={item.id} type="button" onClick={() => setMatchPreset(item.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    matchPreset === item.id
                      ? "border-[rgba(212,168,83,0.5)] bg-[rgba(212,168,83,0.08)]"
                      : "border-border bg-card active:bg-card-alt"
                  }`}>
                  <span className="mb-1.5 block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                  <p className="text-[12px] font-semibold text-text-1">{item.label}</p>
                  <p className="mt-0.5 text-[10px] text-text-3 line-clamp-2">{item.description}</p>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Range 입력 */}
      <Section title="시간 구간"
        subtitle="한 줄에 하나씩, mm:ss-mm:ss 형식"
        rightSlot={
          parsedMatchRanges.length > 0 ? (
            <span className="rounded-full bg-green/10 px-2 py-0.5 text-[11px] font-semibold text-green">
              {parsedMatchRanges.length}개 인식
            </span>
          ) : null
        }>
        <textarea value={matchRanges} onChange={(e) => setMatchRanges(e.target.value)}
          rows={6}
          className="field-input resize-none font-stat text-[13px] leading-7"
          placeholder={"00:12-00:20\n01:10-01:24\n03:02-03:11"} />

        {/* 렌더 예상 */}
        {parsedMatchRanges.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MetricCard label="타이틀" value={matchCopy.title} dot={matchPresetConfig.accent} />
            <MetricCard label="서브타이틀" value={matchCopy.subtitle} dot={matchPresetConfig.accent} />
            <MetricCard label="BGM" value={matchCopy.bgmLabel} dot={matchPresetConfig.accent} />
            <MetricCard label="구간 수" value={`${parsedMatchRanges.length}개`} dot={matchPresetConfig.accent} />
          </div>
        )}
      </Section>

      {/* 에러 */}
      {matchError && (
        <div className="mx-4 mb-4 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-[13px] text-red">
          {matchError}
        </div>
      )}

      {/* 렌더 버튼 */}
      <div className="px-4 pb-4">
        <Button type="submit" size="full" disabled={!matchFile || isMatchRendering}>
          {isMatchRendering ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/40 border-t-bg" />
              렌더링 중...
            </span>
          ) : "풀경기 하이라이트 뽑기 →"}
        </Button>
      </div>

      {/* 결과 */}
      {matchResult && <MatchResult result={matchResult} />}
    </form>
  );
}

function MatchResult({ result }: { result: MatchRenderResult }) {
  return (
    <Section title="결과" rightSlot={
      <a href={result.outputUrl} target="_blank" rel="noreferrer"
        className="text-xs text-accent active:opacity-70">새 탭 ↗</a>
    }>
      <div className="overflow-hidden rounded-xl border border-border">
        <video src={result.outputUrl} controls className="aspect-video w-full bg-bg object-cover" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatRow label="렌더 시간" value={`${(result.renderMs / 1000).toFixed(1)}s`} />
        <StatRow label="영상 길이" value={`${result.durationSeconds.toFixed(1)}s`} />
        <StatRow label="구간 수" value={`${result.rangeCount}개`} />
        <StatRow label="BGM" value={result.bgmLabel} />
      </div>

      {result.rangeLabels.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] text-text-3">적용된 구간</p>
          <div className="flex flex-wrap gap-1.5">
            {result.rangeLabels.map((label) => (
              <span key={label} className="rounded-full bg-card-alt px-3 py-1 font-stat text-[11px] text-text-2">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ── 공통 서브 컴포넌트 ──────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
        active
          ? "border-b-2 border-accent text-accent"
          : "text-text-3 active:text-text-2"
      }`}>
      {children}
    </button>
  );
}

function Section({ title, subtitle, rightSlot, children }: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-4 py-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[15px] font-bold text-text-1">{title}</p>
          {subtitle && <p className="mt-0.5 text-[11px] text-text-3">{subtitle}</p>}
        </div>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-3">{label}</p>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, dot, className = "" }: {
  label: string;
  value: string;
  sub?: string;
  dot: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-card-alt p-3 ${className}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-3">{label}</p>
      </div>
      <p className="text-[12px] font-semibold leading-5 text-text-1">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-text-3">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card-alt px-3 py-2.5">
      <p className="text-[10px] text-text-3">{label}</p>
      <p className="mt-1 font-stat text-[14px] font-semibold text-text-1">{value}</p>
    </div>
  );
}
