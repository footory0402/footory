import { create } from "zustand";

export type UploadStep = 1 | 2 | 3;
export type UploadStatus = "idle" | "uploading" | "thumbnail" | "saving" | "done" | "error";

interface UploadState {
  file: File | null;
  step: UploadStep;
  tags: string[];
  memo: string;
  clipId: string | null;
  progress: number;
  status: UploadStatus;
  error: string | null;

  setFile: (file: File) => void;
  setTags: (tags: string[]) => void;
  setMemo: (memo: string) => void;
  setClipId: (id: string) => void;
  setProgress: (p: number) => void;
  setStatus: (s: UploadStatus) => void;
  setError: (e: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initial = {
  file: null,
  step: 1 as UploadStep,
  tags: [] as string[],
  memo: "",
  clipId: null,
  progress: 0,
  status: "idle" as UploadStatus,
  error: null,
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
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 3) as UploadStep })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) as UploadStep })),
  reset: () => set(initial),
}));
