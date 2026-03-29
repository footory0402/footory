import type { HudPlayerData } from "@/components/video/hud/types";

/** card DB 레코드(player_cards row)를 HudPlayerData로 변환 */
export function buildHudData(card: Record<string, unknown>): HudPlayerData {
  const cardData = (card.card_data ?? {}) as Record<string, string>;

  // position 풀네임 → 약자 매핑
  const POSITION_SHORT: Record<string, string> = {
    ST: "FW", CF: "FW", LW: "FW", RW: "FW", SS: "FW",
    CM: "MF", CAM: "MF", CDM: "MF", LM: "MF", RM: "MF",
    CB: "DF", LB: "DF", RB: "DF", LWB: "DF", RWB: "DF",
    GK: "GK",
    FW: "FW", MF: "MF", DF: "DF",
  };

  const position = cardData.position ?? "FW";
  const positionShort = POSITION_SHORT[position.toUpperCase()] ?? position.slice(0, 2).toUpperCase();

  return {
    firstName:      cardData.firstName    ?? "",
    lastName:       cardData.lastName     ?? "",
    number:         cardData.number       ?? "0",
    position,
    positionShort,
    club:           cardData.customClubName || (card.club_name as string) || cardData.club || "",
    clubFull:       cardData.customClubName || (card.club_name as string) || "",
    age:            cardData.age          ?? "",
    birthDate:      cardData.birthDate    ?? "",
    height:         cardData.height       ?? "",
    weight:         cardData.weight       ?? "",
    foot:           cardData.foot         ?? "",
    nationality:    cardData.nationality  ?? "",
    photoUrl:       (cardData.photoUrl && !cardData.photoUrl.startsWith("blob:")) ? cardData.photoUrl : "",
    mainColor:      (card.main_color as string)   || "#37474F",
    accentColor:    (card.accent_color as string) || "#78909C",
  };
}
