"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { DEFAULT_PLAYER_DATA, type PlayerData } from "@/components/editor/types";
import { useBackgroundRemoval } from "@/components/editor/useBackgroundRemoval";
import EditorForm from "@/components/editor/EditorForm";
import CardPreview from "@/components/editor/CardPreview";
import EditorHeader from "@/components/editor/EditorHeader";
import { loadPlayerCardData, savePlayerCardData } from "@/lib/player-card-editor";

export default function EditorPage() {
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const { removeBackground, status: bgRemovalStatus } = useBackgroundRemoval();

  useEffect(() => {
    loadPlayerCardData()
      .then((nextData) => {
        setData(nextData);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setData((prev) => ({ ...prev, photoUrl: ev.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!data.photoUrl) return;
    const result = await removeBackground(data.photoUrl);
    if (result) {
      setData((prev) => ({ ...prev, photoUrl: result }));
    }
  }, [data.photoUrl, removeBackground]);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const savedData = await savePlayerCardData(data);
      setData(savedData);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [data]);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0c]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a0c]">
      <EditorHeader onSave={handleSave} saveStatus={saveStatus} />

      {/* 모바일 탭 — lg 이상에서 숨김 */}
      <div className="sticky top-0 z-10 flex border-b border-white/8 bg-[#0a0a0c]/95 backdrop-blur-sm lg:hidden">
        <button
          onClick={() => setActiveTab("edit")}
          className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === "edit" ? "text-text-1" : "text-text-3"
          }`}
        >
          편집
          {activeTab === "edit" && (
            <span className="absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === "preview" ? "text-text-1" : "text-text-3"
          }`}
        >
          미리보기
          {activeTab === "preview" && (
            <span className="absolute bottom-0 left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-5 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-4 md:px-6 md:pt-6 lg:flex-row lg:items-start lg:gap-6 lg:overflow-visible">

        {/* 미리보기 패널 — 모바일: 탭 전환, 데스크톱: sticky 사이드 */}
        <section
          className={`flex flex-col gap-4 lg:sticky lg:top-6 lg:w-[400px] lg:shrink-0 ${
            activeTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_42%),linear-gradient(180deg,_rgba(17,17,20,0.98),_rgba(10,10,12,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="border-b border-white/8 px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent/80">
                실시간 미리보기
              </p>
              <p className="mt-0.5 text-sm text-text-3">
                편집 내용이 바로 반영됩니다
              </p>
            </div>
            <div className="px-3 pb-3 pt-3 md:px-4">
              <CardPreview data={data} />
            </div>
          </div>

          {/* 모바일 미리보기 탭에서만 보이는 저장 버튼 */}
          <div className="lg:hidden">
            <SaveButton status={saveStatus} onSave={handleSave} />
          </div>
        </section>

        {/* 편집 폼 패널 — 모바일: 탭 전환, 데스크톱: 항상 표시 */}
        <section
          className={`min-w-0 flex-1 ${
            activeTab === "edit" ? "block" : "hidden lg:block"
          }`}
        >
          <EditorForm
            data={data}
            onChange={setData}
            onPhotoChange={handlePhoto}
            onRemoveBackground={handleRemoveBackground}
            bgRemovalStatus={bgRemovalStatus}
          />

          {/* 폼 하단 저장 버튼 */}
          <div className="mt-3 pb-2">
            <SaveButton status={saveStatus} onSave={handleSave} />
          </div>
        </section>
      </main>
    </div>
  );
}

function SaveButton({
  status,
  onSave,
}: {
  status: "idle" | "saving" | "saved" | "error";
  onSave: () => void;
}) {
  return (
    <button
      onClick={onSave}
      disabled={status === "saving"}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold transition-all disabled:opacity-50 ${
        status === "error"
          ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
          : status === "saved"
          ? "bg-white/8 text-green-400"
          : "bg-accent text-black"
      }`}
    >
      {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === "saved" && <Check className="h-4 w-4" />}
      {status === "error" && <AlertCircle className="h-4 w-4" />}
      {status === "saving"
        ? "저장 중..."
        : status === "saved"
        ? "저장 완료!"
        : status === "error"
        ? "저장 실패 — 다시 시도"
        : "카드 저장하기"}
    </button>
  );
}
