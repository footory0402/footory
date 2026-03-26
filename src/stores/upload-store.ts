import { create } from "zustand";

export type UploadStatus =
  | "idle"
  | "composing"
  | "uploading"
  | "thumbnail"
  | "saving"
  | "done"
  | "error"
  // v1.3 렌더 파이프라인
  | "editing"
  | "uploading_raw"
  | "creating_job"
  | "rendering";
export type UploadContext = "general" | "challenge" | "parent";
export type ClipVisibility = "public" | "followers" | "team" | "private";
export type CompressStatus =
  | "idle"
  | "loading"
  | "compressing"
  | "done"
  | "error"
  | "skipped"
  | "unsupported";

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
  highlightStart: number;

  // v1.3 렌더 파이프라인용 - 현재 미사용
  step: number;
  trimStart: number;
  trimEnd: number | null;
  duration: number | null; // 트리머에서 감지된 영상 길이 (초)
  spotlightX: number | null; // 스포트라이트 오버레이 좌표 (0~1 정규화)
  spotlightY: number | null; // 스포트라이트 오버레이 좌표 (0~1 정규화)
  skillLabels: string[];
  customLabels: string[];
  effects: { color: boolean; cinematic: boolean; eafc: boolean; intro: boolean };
  visibility: ClipVisibility;
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
  setHighlightStart: (t: number) => void;

  // v1.3 setters
  setStep: (s: number) => void;
  setTrimStart: (t: number) => void;
  setTrimEnd: (t: number | null) => void;
  setDuration: (d: number | null) => void;
  setSpotlight: (x: number | null, y: number | null) => void;
  setSkillLabels: (labels: string[]) => void;
  setCustomLabels: (labels: string[]) => void;
  setEffects: (effects: Partial<UploadState["effects"]>) => void;
  setVisibility: (v: ClipVisibility) => void;
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

const initial = {
  file: null as File | null,
  tags: [] as string[],
  memo: "",
  clipId: null as string | null,
  progress: 0,
  status: "idle" as UploadStatus,
  error: null as string | null,
  context: "general" as UploadContext,
  challengeTag: null as string | null,
  childId: null as string | null,
  childName: null as string | null,
  childHandle: null as string | null,
  highlightStart: 0,

  // v1.3
  step: 1,
  trimStart: 0,
  trimEnd: null as number | null,
  duration: null as number | null,
  spotlightX: null as number | null,
  spotlightY: null as number | null,
  skillLabels: [] as string[],
  customLabels: [] as string[],
  effects: { color: false, cinematic: false, eafc: false, intro: false },
  visibility: "followers" as ClipVisibility,
  renderJobId: null as string | null,
  renderProgress: 0,

  // v1.4
  compressStatus: "idle" as CompressStatus,
  compressProgress: 0,
  compressedFile: null as File | null,
  originalSize: null as number | null,
  compressedSize: null as number | null,

  // v2.0 instant upload
  r2Status: "idle" as "idle" | "uploading" | "done" | "error",
  r2Progress: 0,
  r2Key: null as string | null,
  r2ClipId: null as string | null,
  r2RetryCount: 0,
  lastProgressTime: null as number | null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initial,
  setFile: (file) => set({ file, r2Status: "idle" as const, r2Progress: 0, r2Key: null, r2ClipId: null }),
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
  setHighlightStart: (t) => set({ highlightStart: t }),

  // v1.3 setters
  setStep: (step) => set({ step }),
  setTrimStart: (trimStart) => set({ trimStart }),
  setTrimEnd: (trimEnd) => set({ trimEnd }),
  setDuration: (duration) => set({ duration }),
  setSpotlight: (x, y) => set({ spotlightX: x, spotlightY: y }),
  setSkillLabels: (skillLabels) => set({ skillLabels }),
  setCustomLabels: (customLabels) => set({ customLabels }),
  setEffects: (partial) => set((state) => ({
    effects: { ...state.effects, ...partial },
  })),
  setVisibility: (visibility) => set({ visibility }),
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
