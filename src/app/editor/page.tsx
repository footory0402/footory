"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_PLAYER_DATA, type PlayerData } from "@/components/editor/types";
import { type TemplateId } from "@/components/editor/constants";
import { useBackgroundRemoval } from "@/components/editor/useBackgroundRemoval";
import EditorForm from "@/components/editor/EditorForm";
import CardPreview from "@/components/editor/CardPreview";
import EditorHeader from "@/components/editor/EditorHeader";

export default function EditorPage() {
  const [data, setData] = useState<PlayerData>(DEFAULT_PLAYER_DATA);
  const [template, setTemplate] = useState<TemplateId>("fifa");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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
          if (profile.avatar_url) profileDefaults.photoUrl = profile.avatar_url;
        }

        if (card) {
          // Restore saved card data
          const cardData = card.card_data as Record<string, string>;
          // Normalize foot value to Korean
          const normalizedFoot = mapFoot(cardData.foot || profileDefaults.foot || null);
          // Skip blob URLs (not persistent) — fall back to profile avatar
          const savedPhoto = cardData.photoUrl && !cardData.photoUrl.startsWith("blob:") ? cardData.photoUrl : undefined;
          setData({
            ...DEFAULT_PLAYER_DATA,
            ...profileDefaults,
            ...cardData,
            photoUrl: savedPhoto || profileDefaults.photoUrl || "",
            foot: normalizedFoot,
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
      const hasNewPhoto = data.photoUrl && data.photoUrl.startsWith("data:");
      const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

      const res = await fetch("/api/player-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          clubName: data.customClubName || data.club,
          mainColor: data.customClubColor,
          accentColor: data.customClubAccent,
          needPhotoUploadUrl: hasNewPhoto,
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
            // Store R2 URL if already uploaded, otherwise will upload below
            photoUrl: data.photoUrl && !data.photoUrl.startsWith("data:") ? data.photoUrl : undefined,
          },
        }),
      });

      const result = await res.json();

      // Upload photo to R2 if we have a new base64 photo
      if (hasNewPhoto && result.photoUploadUrl) {
        // Convert base64 to blob
        const base64 = data.photoUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/jpeg" });

        await fetch(result.photoUploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: blob,
        });

        // Update card with R2 photo URL
        const photoKey = `card-photos/${result.card.profile_id}/photo.jpg`;
        const photoR2Url = `${r2Url}/${photoKey}?t=${Date.now()}`;

        await fetch("/api/player-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template,
            clubName: data.customClubName || data.club,
            mainColor: data.customClubColor,
            accentColor: data.customClubAccent,
            cardData: {
              ...result.card.card_data,
              photoUrl: photoR2Url,
            },
          }),
        });

        // Update local state with R2 URL
        setData((prev) => ({ ...prev, photoUrl: photoR2Url }));
      }

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
      <EditorHeader onSave={handleSave} saveStatus={saveStatus} />
      <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* Mobile: Card first, then form. Desktop: Form left, Card right */}
        <div className="md:hidden">
          <CardPreview data={data} template={template} onTemplateChange={setTemplate} />
        </div>
        <EditorForm
          data={data}
          onChange={setData}
          onRemoveBackground={handleRemoveBackground}
          bgRemovalStatus={bgRemovalStatus}
        />
        <div className="hidden md:flex md:flex-1">
          <CardPreview data={data} template={template} onTemplateChange={setTemplate} />
        </div>
      </div>
    </div>
  );
}
