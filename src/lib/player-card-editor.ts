import { CARD_THEMES } from "@/components/editor/constants";
import { DEFAULT_PLAYER_DATA, type PlayerData } from "@/components/editor/types";

interface PlayerCardResponse {
  card?: {
    profile_id?: string;
    club_name?: string | null;
    main_color?: string | null;
    accent_color?: string | null;
    card_data?: Record<string, unknown> | null;
  } | null;
  profile?: {
    name?: string | null;
    position?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    preferred_foot?: string | null;
    birth_year?: number | null;
    avatar_url?: string | null;
  } | null;
}

function mapPosition(pos: string | null | undefined): string {
  if (!pos) return "ST";
  const mapped: Record<string, string> = { FW: "ST", MF: "CM", DF: "CB", GK: "GK" };
  return mapped[pos] || pos;
}

function mapFoot(foot: string | null | undefined): string {
  if (!foot) return "오른발";
  const mapped: Record<string, string> = { right: "오른발", left: "왼발", both: "양발" };
  return mapped[foot] || foot;
}

function buildRequestUrl(profileId?: string | null) {
  const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  return `/api/player-card${query}`;
}

export function hydratePlayerCardData(response: PlayerCardResponse | null | undefined): PlayerData {
  if (!response) return DEFAULT_PLAYER_DATA;

  const { card, profile } = response;
  const cardData =
    card?.card_data && typeof card.card_data === "object"
      ? (card.card_data as Record<string, string>)
      : {};

  const profileDefaults: Partial<PlayerData> = {};
  if (profile?.name) {
    profileDefaults.name = profile.name.trim();
  }
  profileDefaults.position = mapPosition(profile?.position);
  if (profile?.height_cm) profileDefaults.height = String(profile.height_cm);
  if (profile?.weight_kg) profileDefaults.weight = String(profile.weight_kg);
  profileDefaults.foot = mapFoot(profile?.preferred_foot);
  if (profile?.birth_year) profileDefaults.birthDate = String(profile.birth_year);
  if (profile?.avatar_url) profileDefaults.photoUrl = profile.avatar_url;

  if (!card) {
    return {
      ...DEFAULT_PLAYER_DATA,
      ...profileDefaults,
    };
  }

  const savedColor = card.main_color || DEFAULT_PLAYER_DATA.customClubColor;
  const savedAccent = card.accent_color || DEFAULT_PLAYER_DATA.customClubAccent;
  const matchedTheme = CARD_THEMES.find((theme) => theme.color === savedColor) ?? null;
  const savedPhoto =
    cardData.photoUrl && !cardData.photoUrl.startsWith("blob:")
      ? cardData.photoUrl
      : undefined;

  return {
    ...DEFAULT_PLAYER_DATA,
    ...profileDefaults,
    name: cardData.name || profileDefaults.name || "",
    number: cardData.number || DEFAULT_PLAYER_DATA.number,
    position: cardData.position || profileDefaults.position || DEFAULT_PLAYER_DATA.position,
    age: cardData.age || DEFAULT_PLAYER_DATA.age,
    birthDate: cardData.birthDate || DEFAULT_PLAYER_DATA.birthDate,
    height: cardData.height || profileDefaults.height || DEFAULT_PLAYER_DATA.height,
    weight: cardData.weight || profileDefaults.weight || DEFAULT_PLAYER_DATA.weight,
    nationality: cardData.nationality || DEFAULT_PLAYER_DATA.nationality,
    photoUrl: savedPhoto || profileDefaults.photoUrl || "",
    foot: mapFoot(cardData.foot || profileDefaults.foot),
    teamName: card.club_name || cardData.teamName || "",
    themeId: matchedTheme?.id || cardData.themeId || DEFAULT_PLAYER_DATA.themeId,
    customClubColor: savedColor,
    customClubAccent: savedAccent,
  };
}

export async function loadPlayerCardData(profileId?: string | null): Promise<PlayerData> {
  const response = await fetch(buildRequestUrl(profileId), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("선수 카드 정보를 불러오지 못했습니다.");
  }

  const payload = (await response.json()) as PlayerCardResponse;
  return hydratePlayerCardData(payload);
}

export async function savePlayerCardData(
  data: PlayerData,
  options: { profileId?: string | null } = {},
): Promise<PlayerData> {
  const hasNewPhoto = data.photoUrl.startsWith("data:");
  const response = await fetch("/api/player-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profileId: options.profileId ?? undefined,
      template: "fifa",
      clubName: data.teamName,
      mainColor: data.customClubColor,
      accentColor: data.customClubAccent,
      needPhotoUploadUrl: hasNewPhoto,
      cardData: {
        name: data.name,
        number: data.number,
        position: data.position,
        teamName: data.teamName,
        themeId: data.themeId,
        age: data.age,
        birthDate: data.birthDate,
        height: data.height,
        weight: data.weight,
        foot: data.foot,
        nationality: data.nationality,
        photoUrl:
          data.photoUrl && !data.photoUrl.startsWith("data:")
            ? data.photoUrl
            : undefined,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("선수 카드 저장에 실패했습니다.");
  }

  const result = (await response.json()) as {
    photoUploadUrl?: string;
    card?: {
      profile_id?: string;
      card_data?: Record<string, unknown>;
    };
  };

  if (!hasNewPhoto || !result.photoUploadUrl || !result.card?.profile_id) {
    return data;
  }

  const base64 = data.photoUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  await fetch(result.photoUploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: new Blob([bytes], { type: "image/jpeg" }),
  });

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  const photoKey = `card-photos/${result.card.profile_id}/photo.jpg`;
  const photoR2Url = `${r2Url}/${photoKey}?t=${Date.now()}`;

  const finalizeResponse = await fetch("/api/player-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profileId: options.profileId ?? undefined,
      template: "fifa",
      clubName: data.teamName,
      mainColor: data.customClubColor,
      accentColor: data.customClubAccent,
      cardData: {
        ...(result.card.card_data ?? {}),
        photoUrl: photoR2Url,
      },
    }),
  });

  if (!finalizeResponse.ok) {
    throw new Error("선수 카드 사진 저장에 실패했습니다.");
  }

  return {
    ...data,
    photoUrl: photoR2Url,
  };
}
