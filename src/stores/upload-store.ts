import { create } from "zustand";

export type UploadStatus =
  | "idle"
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

  // v1.3 — 5스텝 위저드
  step: number;
  trimStart: number;
  trimEnd: number | null;
  duration: number | null; // 트리머에서 감지된 영상 길이 (초)
  spotlightX: number | null;
  spotlightY: number | null;
  skillLabels: string[];
  customLabels: string[];
  slowmoStart: number | null;
  slowmoEnd: number | null;
  slowmoSpeed: number;
  bgmId: string | null;
  effects: { color: boolean; cinematic: boolean; eafc: boolean; intro: boolean };
  visibility: ClipVisibility;
  renderJobId: string | null;

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
  setSlowmo: (start: number | null, end: number | null, speed?: number) => void;
  setBgmId: (id: string | null) => void;
  setEffects: (effects: Partial<UploadState["effects"]>) => void;
  setVisibility: (v: ClipVisibility) => void;
  setRenderJobId: (id: string | null) => void;

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
  step: 0,
  trimStart: 0,
  trimEnd: null as number | null,
  duration: null as number | null,
  spotlightX: null as number | null,
  spotlightY: null as number | null,
  skillLabels: [] as string[],
  customLabels: [] as string[],
  slowmoStart: null as number | null,
  slowmoEnd: null as number | null,
  slowmoSpeed: 0.5,
  bgmId: null as string | null,
  effects: { color: false, cinematic: false, eafc: false, intro: false },
  visibility: "followers" as ClipVisibility,
  renderJobId: null as string | null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initial,
  setFile: (file) => set({ file }),
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
  setSlowmo: (start, end, speed) => set({
    slowmoStart: start,
    slowmoEnd: end,
    ...(speed !== undefined ? { slowmoSpeed: speed } : {}),
  }),
  setBgmId: (bgmId) => set({ bgmId }),
  setEffects: (partial) => set((state) => ({
    effects: { ...state.effects, ...partial },
  })),
  setVisibility: (visibility) => set({ visibility }),
  setRenderJobId: (renderJobId) => set({ renderJobId }),

  reset: () => set(initial),
}));
