"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_PLAYER_DATA, type PlayerData } from "@/components/editor/types";
import { type TemplateId } from "@/components/editor/constants";
import { useExportPng, useExportMp4 } from "@/components/editor/useExport";
import { useBackgroundRemoval } from "@/components/editor/useBackgroundRemoval";
import EditorForm from "@/components/editor/EditorForm";
import CardPreview from "@/components/editor/CardPreview";
import EditorHeader from "@/components/editor/EditorHeader";
import MobileBlock from "@/components/editor/MobileBlock";

export default function EditorPage() {
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [template, setTemplate] = useState<TemplateId>("fifa");
  const [isMobile, setIsMobile] = useState(false);

  const { exportPng, status: pngStatus } = useExportPng();
  const { exportMp4, status: mp4Status, progress: mp4Progress } = useExportMp4();
  const { removeBackground, status: bgRemovalStatus } = useBackgroundRemoval();

  const handleRemoveBackground = useCallback(async () => {
    if (!data.photoUrl) return;
    const result = await removeBackground(data.photoUrl);
    if (result) {
      setData((prev) => ({ ...prev, photoUrl: result }));
    }
  }, [data.photoUrl, removeBackground]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) return <MobileBlock />;

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        onExportPng={exportPng}
        onExportMp4={exportMp4}
        pngStatus={pngStatus}
        mp4Status={mp4Status}
        mp4Progress={mp4Progress}
      />
      <div className="flex flex-1 overflow-hidden">
        <EditorForm
          data={data}
          onChange={setData}
          onRemoveBackground={handleRemoveBackground}
          bgRemovalStatus={bgRemovalStatus}
        />
        <CardPreview data={data} template={template} onTemplateChange={setTemplate} />
      </div>
    </div>
  );
}
