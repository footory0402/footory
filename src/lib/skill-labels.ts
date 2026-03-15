/** 17개 프리셋 스킬 라벨 + 포지션별 정렬 */

export interface SkillLabel {
  id: string;
  labelKo: string;
  category: "common" | "attack" | "defense" | "gk";
}

export const SKILL_LABELS: SkillLabel[] = [
  // 공용
  { id: "first_touch", labelKo: "퍼스트터치", category: "common" },
  { id: "body_feint", labelKo: "바디페인트", category: "common" },
  { id: "speed", labelKo: "스피드", category: "common" },
  { id: "stamina", labelKo: "체력", category: "common" },
  { id: "vision", labelKo: "시야", category: "common" },
  // 공격
  { id: "dribble", labelKo: "드리블", category: "attack" },
  { id: "shooting", labelKo: "슈팅", category: "attack" },
  { id: "volley", labelKo: "발리슛", category: "attack" },
  { id: "heading", labelKo: "헤딩", category: "attack" },
  { id: "through_pass", labelKo: "스루패스", category: "attack" },
  { id: "cross", labelKo: "크로스", category: "attack" },
  // 수비
  { id: "tackle", labelKo: "태클", category: "defense" },
  { id: "interception", labelKo: "인터셉트", category: "defense" },
  { id: "marking", labelKo: "마킹", category: "defense" },
  { id: "clearance", labelKo: "클리어링", category: "defense" },
  // GK
  { id: "gk_save", labelKo: "세이브", category: "gk" },
  { id: "gk_punch", labelKo: "펀칭", category: "gk" },
];

const CATEGORY_LABELS: Record<string, string> = {
  common: "공용",
  attack: "공격",
  defense: "수비",
  gk: "GK",
};

export type Position = "FW" | "MF" | "DF" | "GK";

/** 포지션에 따라 카테고리 순서 정렬 */
export function getSkillLabelsByPosition(position?: Position | null) {
  const order: string[] =
    position === "GK"
      ? ["gk", "common"]
      : position === "DF"
        ? ["defense", "common", "attack"]
        : position === "MF"
          ? ["common", "attack", "defense"]
          : ["attack", "common", "defense"]; // FW or default

  const grouped = new Map<string, SkillLabel[]>();
  for (const label of SKILL_LABELS) {
    if (position === "GK" && !["gk", "common"].includes(label.category)) continue;
    if (position !== "GK" && label.category === "gk") continue;

    const list = grouped.get(label.category) ?? [];
    list.push(label);
    grouped.set(label.category, list);
  }

  return order
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat] ?? cat,
      labels: grouped.get(cat)!,
    }));
}
