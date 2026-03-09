import { create } from "zustand";

export type UploadStatus = "idle" | "uploading" | "thumbnail" | "saving" | "done" | "error";
export type UploadContext = "general" | "challenge" | "parent";

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
  highlightStart: number;

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
  setHighlightStart: (t: number) => void;
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
  highlightStart: 0,
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
  setHighlightStart: (t) => set({ highlightStart: t }),
  reset: () => set(initial),
}));
