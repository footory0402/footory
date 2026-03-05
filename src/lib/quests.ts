import { createClient } from "@/lib/supabase/client";

export type QuestAction = "upload" | "follow" | "kudos" | "dm" | "vote" | "profile_photo";

export interface QuestDef {
  key: string;
  type: "onboarding" | "weekly";
  label: string;
  xp: number;
  action: QuestAction;
}

function getWeekKey(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export const ONBOARDING_QUESTS: QuestDef[] = [
  { key: "profile_photo", type: "onboarding", label: "프사 등록하기", xp: 10, action: "profile_photo" },
  { key: "first_upload", type: "onboarding", label: "첫 영상 올리기", xp: 50, action: "upload" },
  { key: "first_follow", type: "onboarding", label: "친구 1명 팔로우", xp: 10, action: "follow" },
  { key: "first_kudos", type: "onboarding", label: "첫 응원 보내기", xp: 10, action: "kudos" },
  { key: "first_dm", type: "onboarding", label: "첫 DM 보내기", xp: 10, action: "dm" },
];

export function getWeeklyQuests(): QuestDef[] {
  const weekKey = getWeekKey();
  return [
    { key: `weekly_upload_${weekKey}`, type: "weekly", label: "영상 1개 업로드", xp: 30, action: "upload" },
    { key: `weekly_vote_${weekKey}`, type: "weekly", label: "MVP 투표 3표 사용", xp: 20, action: "vote" },
    { key: `weekly_kudos_${weekKey}`, type: "weekly", label: "응원 5개 보내기", xp: 10, action: "kudos" },
  ];
}

/** 퀘스트 완료 처리: quest_progress upsert + XP 누적 */
export async function checkQuestCompletion(
  profileId: string,
  action: QuestAction
): Promise<{ completedKeys: string[]; xpGained: number }> {
  const supabase = createClient();
  const weekKey = getWeekKey();

  // 해당 action에 매핑되는 퀘스트 키 목록
  const actionQuests = [
    ...ONBOARDING_QUESTS.filter((q) => q.action === action),
    ...getWeeklyQuests().filter((q) => q.action === action),
  ];
  if (actionQuests.length === 0) return { completedKeys: [], xpGained: 0 };

  // 이미 완료된 퀘스트 조회
  const keys = actionQuests.map((q) => q.key);
  const { data: existing } = await supabase
    .from("quest_progress")
    .select("quest_key, completed_at")
    .eq("profile_id", profileId)
    .in("quest_key", keys);

  const completedSet = new Set(
    (existing ?? [])
      .filter((r) => r.completed_at !== null)
      .map((r) => r.quest_key)
  );

  // 새로 완료할 퀘스트
  const toComplete = actionQuests.filter((q) => !completedSet.has(q.key));
  if (toComplete.length === 0) return { completedKeys: [], xpGained: 0 };

  const now = new Date().toISOString();
  const upserts = toComplete.map((q) => ({
    profile_id: profileId,
    quest_type: q.type,
    quest_key: q.key,
    completed_at: now,
  }));

  await supabase.from("quest_progress").upsert(upserts, { onConflict: "profile_id,quest_key" });

  const xpGained = toComplete.reduce((sum, q) => sum + q.xp, 0);

  // XP 누적 (profiles.xp += xpGained)
  if (xpGained > 0) {
    await supabase.rpc("increment_xp", { profile_id: profileId, amount: xpGained });
  }

  // 온보딩 전체 완료 시 뱃지 기록
  const completedOnboarding = [
    ...ONBOARDING_QUESTS.filter((q) => completedSet.has(q.key) || toComplete.some((c) => c.key === q.key)),
  ];
  if (completedOnboarding.length === ONBOARDING_QUESTS.length) {
    await supabase.from("quest_progress").upsert(
      [{ profile_id: profileId, quest_type: "onboarding", quest_key: "onboarding_complete", completed_at: now }],
      { onConflict: "profile_id,quest_key" }
    );
  }

  // 주간 퀘스트 전체 완료 시 보너스 XP
  const weeklyQuests = getWeeklyQuests();
  const allWeeklyCompleted = weeklyQuests.every(
    (q) => completedSet.has(q.key) || toComplete.some((c) => c.key === q.key)
  );
  if (allWeeklyCompleted) {
    const bonusKey = `weekly_bonus_${weekKey}`;
    const { data: bonusExisting } = await supabase
      .from("quest_progress")
      .select("quest_key")
      .eq("profile_id", profileId)
      .eq("quest_key", bonusKey)
      .single();

    if (!bonusExisting) {
      await supabase.from("quest_progress").upsert(
        [{ profile_id: profileId, quest_type: "weekly", quest_key: bonusKey, completed_at: now }],
        { onConflict: "profile_id,quest_key" }
      );
      await supabase.rpc("increment_xp", { profile_id: profileId, amount: 50 });
    }
  }

  return { completedKeys: toComplete.map((q) => q.key), xpGained };
}
