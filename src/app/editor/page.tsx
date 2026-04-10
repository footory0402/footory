"use client";

import { useState, useEffect, useCallback } from "react";
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

  const { removeBackground, status: bgRemovalStatus } = useBackgroundRemoval();

  // Load saved card + profile data on mount
  useEffect(() => {
    loadPlayerCardData()
      .then((nextData) => {
        setData(nextData);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
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
    <div className="flex h-full flex-col">
      <EditorHeader onSave={handleSave} saveStatus={saveStatus} />
      <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* Mobile: Card → Form seamlessly stacked. Desktop: Form left, Card right */}
        <div className="md:hidden">
          <CardPreview data={data} />
          {/* Seamless transition line */}
          <div className="mx-4 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-[10px] font-medium tracking-widest text-text-3/50">EDIT</span>
            <div className="h-px flex-1 bg-white/6" />
          </div>
        </div>
        <EditorForm
          data={data}
          onChange={setData}
          onRemoveBackground={handleRemoveBackground}
          bgRemovalStatus={bgRemovalStatus}
        />
        <div className="hidden md:flex md:flex-1">
          <CardPreview data={data} />
        </div>
      </div>
    </div>
  );
}
