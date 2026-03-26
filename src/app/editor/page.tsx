"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_PLAYER_DATA, type PlayerData } from "@/components/editor/types";
import { type TemplateId } from "@/components/editor/constants";
import { useExportPng, useExportMp4 } from "@/components/editor/useExport";
import { useBackgroundRemoval } from "@/components/editor/useBackgroundRemoval";
import EditorForm from "@/components/editor/EditorForm";
import CardPreview from "@/components/editor/CardPreview";
import EditorHeader from "@/components/editor/EditorHeader";

export default function EditorPage() {
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [template, setTemplate] = useState<TemplateId>("fifa");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const { exportPng, status: pngStatus } = useExportPng();
  const { exportMp4, status: mp4Status, progress: mp4Progress } = useExportMp4();
  const { removeBackground, status: bgRemovalStatus } = useBackgroundRemoval();

  // Load saved card + profile data on mount
  useEffect(() => {
    // Map broad position (FW/MF/DF/GK) to specific position for card
    const mapPosition = (pos: string | null): string => {
      if (!pos) return "ST";
      const map: Record<string, string> = { FW: "ST", MF: "CM", DF: "CB", GK: "GK" };
      return map[pos] || pos;
    };

    // Map foot to Korean
    const mapFoot = (foot: string | null): string => {
      if (!foot) return "오른발";
      const map: Record<string, string> = { right: "오른발", left: "왼발", both: "양발" };
      return map[foot] || foot;
    };

    fetch("/api/player-card")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((res) => {
        if (!res) { setLoaded(true); return; }

        const { card, profile } = res;

        // Start with profile data as defaults
        const profileDefaults: Partial<PlayerData> = {};
        if (profile) {
          if (profile.name) {
            // Korean names: first char = last name, rest = first name
            const name = profile.name.trim();
            if (name.length >= 2) {
              profileDefaults.lastName = name.charAt(0);
              profileDefaults.firstName = name.substring(1);
            } else {
              profileDefaults.lastName = name;
            }
          }
          profileDefaults.position = mapPosition(profile.position);
          if (profile.height_cm) profileDefaults.height = String(profile.height_cm);
          if (profile.weight_kg) profileDefaults.weight = String(profile.weight_kg);
          profileDefaults.foot = mapFoot(profile.preferred_foot);
          if (profile.birth_year) profileDefaults.birthDate = String(profile.birth_year);
        }

        if (card) {
          // Restore saved card data
          const cardData = card.card_data as Record<string, string>;
          setData({
            ...DEFAULT_PLAYER_DATA,
            ...profileDefaults,
            ...cardData,
            // Always use saved colors
            customClubColor: card.main_color || "#37474F",
            customClubAccent: card.accent_color || "#78909C",
            club: cardData.club || "직접 입력",
            customClubName: card.club_name || cardData.customClubName || "",
          });
          setTemplate(card.template || "fifa");
        } else {
          // No saved card — use profile defaults
          setData({
            ...DEFAULT_PLAYER_DATA,
            ...profileDefaults,
            club: "직접 입력",
          });
        }
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
      await fetch("/api/player-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          clubName: data.customClubName || data.club,
          mainColor: data.customClubColor,
          accentColor: data.customClubAccent,
          cardData: {
            firstName: data.firstName,
            lastName: data.lastName,
            number: data.number,
            position: data.position,
            club: data.club,
            customClubName: data.customClubName,
            age: data.age,
            birthDate: data.birthDate,
            height: data.height,
            weight: data.weight,
            foot: data.foot,
            nationality: data.nationality,
          },
        }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [data, template]);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0c]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        onExportPng={exportPng}
        onExportMp4={exportMp4}
        onSave={handleSave}
        pngStatus={pngStatus}
        mp4Status={mp4Status}
        mp4Progress={mp4Progress}
        saveStatus={saveStatus}
      />
      <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
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
