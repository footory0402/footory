import { create } from "zustand";
import type { EventTag } from "@/components/editor/video/types";
import { DEFAULT_FOCUS_ZOOM } from "@/lib/focus-zoom";
import type { TrackingMode, TrackingPoint } from "@/lib/playback-focus";
import type { SingleClipEditingDraft } from "@/lib/single-clip-playback";

export interface Caption {
  text: string;       // 최대 30자
  startTime: number;  // trim 기준 상대 초
  endTime: number;
  style: "sports" | "minimal" | "gold";
  position: "top" | "center" | "bottom";
}

export type UploadPhase =
  | "select"
  | "processing"
  | "choice"
  | "edit"
  | "decorate"
  | "share"
  | "uploading"
  | "done";
export type UploadStatus =
  | "idle"
  | "composing"
  | "uploading"
  | "thumbnail"
  | "saving"
  | "analyzing"
  | "done"
  | "error"
  // v1.3 렌더 파이프라인
  | "editing"
  | "uploading_raw"
  | "creating_job"
  | "rendering";
export type UploadContext = "general" | "challenge" | "parent";
export type CompressStatus =
  | "idle"
  | "loading"
  | "compressing"
  | "done"
  | "error"
  | "skipped"
  | "unsupported";

export interface UploadEffects {
  color: boolean;
  cinematic: boolean;
  eafc: boolean;
  intro: boolean;
  showLowerThird: boolean;
  focusZoom: number;
}

interface UploadState {
  file: File | null;
  tags: string[];
  memo: string;
  clipId: string | null;
  progress: number;
  status: UploadStatus;
  error: string | null;
  context: UploadContext;
  challengeTag: string | null;
  childId: string | null;
  childName: string | null;
  childHandle: string | null;
  editorDraft: SingleClipEditingDraft | null;

  // v3.0 릴스 스타일 단일 플로우
  phase: UploadPhase;
  eventTag: EventTag | null;
  trimStart: number;
  trimEnd: number | null;
  duration: number | null; // 트리머에서 감지된 영상 길이 (초)
  spotlightX: number | null; // 스포트라이트 오버레이 좌표 (0~1 정규화)
  spotlightY: number | null; // 스포트라이트 오버레이 좌표 (0~1 정규화)
  freezeAt: number | null; // 프리즈 프레임 시점 (초)
  trackingMode: TrackingMode;
  trackingPoints: TrackingPoint[];
  skillLabels: string[];
  customLabels: string[];
  effects: UploadEffects;
  // v4.0 슬로모션
  slowmoStart: number | null;
  slowmoEnd: number | null;
  slowmoSpeed: number;
  // v4.0 캡션
  captions: Caption[];
  // v4.0 BGM
  bgmId: string | null;
  bgmVolume: number;       // 0~100
  originalVolume: number;  // 0~100
  renderJobId: string | null;
  renderProgress: number;

  // v1.4 클라이언트 압축
  compressStatus: CompressStatus;
  compressProgress: number;
  compressedFile: File | null;
  originalSize: number | null;
  compressedSize: number | null;

  // v2.0 instant upload (background R2 upload)
  r2Status: "idle" | "uploading" | "done" | "error";
  r2Progress: number;
  r2Key: string | null;
  r2ClipId: string | null;
  r2RetryCount: number;
  lastProgressTime: number | null;

  setFile: (file: File | null) => void;
  setTags: (tags: string[]) => void;
  setMemo: (memo: string) => void;
  setClipId: (id: string) => void;
  setProgress: (p: number) => void;
  setStatus: (s: UploadStatus) => void;
  setError: (e: string | null) => void;
  setContext: (c: UploadContext) => void;
  setChallengeTag: (tag: string | null) => void;
  setChildId: (id: string | null) => void;
  setChildInfo: (info: { id: string; name: string; handle: string } | null) => void;
  setEditorDraft: (draft: SingleClipEditingDraft | null) => void;
  // v3.0 setters
  setPhase: (p: UploadPhase) => void;
  setEventTag: (t: EventTag | null) => void;
  setTrimStart: (t: number) => void;
  setTrimEnd: (t: number | null) => void;
  setDuration: (d: number | null) => void;
  setSpotlight: (x: number | null, y: number | null) => void;
  setFreezeAt: (t: number | null) => void;
  setTrackingMode: (mode: TrackingMode) => void;
  setTrackingPoints: (points: TrackingPoint[]) => void;
  setSkillLabels: (labels: string[]) => void;
  setCustomLabels: (labels: string[]) => void;
  setEffects: (effects: Partial<UploadState["effects"]>) => void;
  // v4.0 슬로모션
  setSlowmo: (start: number | null, end: number | null) => void;
  setSlowmoSpeed: (speed: number) => void;
  // v4.0 캡션
  setCaptions: (captions: Caption[]) => void;
  addCaption: (caption: Caption) => void;
  removeCaption: (index: number) => void;
  // v4.0 BGM
  setBgm: (id: string | null) => void;
  setBgmVolume: (v: number) => void;
  setOriginalVolume: (v: number) => void;
  setRenderJobId: (id: string | null) => void;
  setRenderProgress: (p: number) => void;

  // v1.4 압축 setters
  setCompressStatus: (s: CompressStatus) => void;
  setCompressProgress: (p: number) => void;
  setCompressedFile: (f: File | null) => void;
  setCompressStats: (original: number | null, compressed: number | null) => void;

  // v2.0 instant upload setters
  setR2Status: (s: "idle" | "uploading" | "done" | "error") => void;
  setR2Progress: (p: number) => void;
  setR2Upload: (key: string, clipId: string) => void;
  setR2RetryCount: (n: number) => void;
  setLastProgressTime: (t: number | null) => void;

  reset: () => void;
}

function createClipFlowStateDefaults() {
  return {
    tags: [] as string[],
    memo: "",
    clipId: null as string | null,
    progress: 0,
    status: "idle" as UploadStatus,
    error: null as string | null,
    editorDraft: null as SingleClipEditingDraft | null,
    phase: "select" as UploadPhase,
    eventTag: null as EventTag | null,
    trimStart: 0,
    trimEnd: null as number | null,
    duration: null as number | null,
    spotlightX: null as number | null,
    spotlightY: null as number | null,
    freezeAt: null as number | null,
    trackingMode: "fixed" as TrackingMode,
    trackingPoints: [] as TrackingPoint[],
    skillLabels: [] as string[],
    customLabels: [] as string[],
    effects: {
      color: false,
      cinematic: false,
      eafc: false,
      intro: true,
      showLowerThird: true,
      focusZoom: DEFAULT_FOCUS_ZOOM,
    } as UploadEffects,
    slowmoStart: null as number | null,
    slowmoEnd: null as number | null,
    slowmoSpeed: 0.5,
    captions: [] as Caption[],
    bgmId: null as string | null,
    bgmVolume: 40,
    originalVolume: 100,
    renderJobId: null as string | null,
    renderProgress: 0,
    compressStatus: "idle" as CompressStatus,
    compressProgress: 0,
    compressedFile: null as File | null,
    originalSize: null as number | null,
    compressedSize: null as number | null,
    r2Status: "idle" as "idle" | "uploading" | "done" | "error",
    r2Progress: 0,
    r2Key: null as string | null,
    r2ClipId: null as string | null,
    r2RetryCount: 0,
    lastProgressTime: null as number | null,
  };
}

const initial = {
  file: null as File | null,
  ...createClipFlowStateDefaults(),
  context: "general" as UploadContext,
  challengeTag: null as string | null,
  childId: null as string | null,
  childName: null as string | null,
  childHandle: null as string | null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initial,
  setFile: (file) => set((state) => ({
    ...createClipFlowStateDefaults(),
    file,
    // 업로드 경로 컨텍스트(선수/부모)와 대상 아동 정보는 유지한다.
    context: state.context,
    challengeTag: state.challengeTag,
    childId: state.childId,
    childName: state.childName,
    childHandle: state.childHandle,
  })),
  setTags: (tags) => set({ tags }),
  setMemo: (memo) => set({ memo }),
  setClipId: (id) => set({ clipId: id }),
  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setContext: (context) => set({ context }),
  setChallengeTag: (tag) => set({ challengeTag: tag }),
  setChildId: (id) => set({ childId: id }),
  setChildInfo: (info) => set(info ? { childId: info.id, childName: info.name, childHandle: info.handle } : { childId: null, childName: null, childHandle: null }),
  setEditorDraft: (editorDraft) => set({ editorDraft }),
  // v3.0 setters
  setPhase: (phase) => set({ phase }),
  setEventTag: (eventTag) => set({ eventTag }),
  setTrimStart: (trimStart) => set({ trimStart }),
  setTrimEnd: (trimEnd) => set({ trimEnd }),
  setDuration: (duration) => set({ duration }),
  setSpotlight: (x, y) => set({ spotlightX: x, spotlightY: y }),
  setFreezeAt: (t) => set({ freezeAt: t }),
  setTrackingMode: (trackingMode) => set({ trackingMode }),
  setTrackingPoints: (trackingPoints) => set({ trackingPoints }),
  setSkillLabels: (skillLabels) => set({ skillLabels }),
  setCustomLabels: (customLabels) => set({ customLabels }),
  setEffects: (partial) => set((state) => ({
    effects: { ...state.effects, ...partial },
  })),
  // v4.0 슬로모션
  setSlowmo: (slowmoStart, slowmoEnd) => set({ slowmoStart, slowmoEnd }),
  setSlowmoSpeed: (slowmoSpeed) => set({ slowmoSpeed }),
  // v4.0 캡션
  setCaptions: (captions) => set({ captions }),
  addCaption: (caption) => set((state) => ({ captions: [...state.captions, caption] })),
  removeCaption: (index) => set((state) => ({ captions: state.captions.filter((_, i) => i !== index) })),
  // v4.0 BGM
  setBgm: (bgmId) => set({ bgmId }),
  setBgmVolume: (bgmVolume) => set({ bgmVolume }),
  setOriginalVolume: (originalVolume) => set({ originalVolume }),
  setRenderJobId: (renderJobId) => set({ renderJobId }),
  setRenderProgress: (renderProgress) => set({ renderProgress }),

  // v1.4 압축 setters
  setCompressStatus: (compressStatus) => set({ compressStatus }),
  setCompressProgress: (compressProgress) => set({ compressProgress }),
  setCompressedFile: (compressedFile) => set({ compressedFile }),
  setCompressStats: (originalSize, compressedSize) =>
    set({ originalSize, compressedSize }),

  // v2.0 instant upload setters
  setR2Status: (r2Status) => set({ r2Status }),
  setR2Progress: (r2Progress) => set({ r2Progress }),
  setR2Upload: (r2Key, r2ClipId) => set({ r2Key, r2ClipId }),
  setR2RetryCount: (r2RetryCount) => set({ r2RetryCount }),
  setLastProgressTime: (lastProgressTime) => set({ lastProgressTime }),

  reset: () => set(initial),
}));
