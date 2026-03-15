import type { TimelineEventType } from "@/lib/types";

interface TimelineEventConfig {
  icon: string;
  label: string;
  getTitle: (data: Record<string, unknown>) => string;
}

export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, TimelineEventConfig> = {
  first_upload: {
    icon: "🎬",
    label: "첫 영상",
    getTitle: () => "첫 영상을 업로드했어요!",
  },
  level_up: {
    icon: "⬆️",
    label: "레벨업",
    getTitle: (data) => `레벨 ${data.level ?? "?"}로 승급!`,
  },
  mvp_win: {
    icon: "🏆",
    label: "MVP",
    getTitle: (data) => `월간 MVP ${data.rank === 1 ? "1위" : `${data.rank}위`} 달성!`,
  },
  team_join: {
    icon: "👥",
    label: "팀 합류",
    getTitle: (data) => `${data.team_name ?? "팀"}에 합류했어요`,
  },
  team_leave: {
    icon: "👋",
    label: "팀 이동",
    getTitle: (data) => `${data.team_name ?? "팀"}을 떠났어요`,
  },
  achievement: {
    icon: "🏅",
    label: "수상",
    getTitle: (data) => {
      const parts: string[] = [];
      if (data.competition) parts.push(data.competition as string);
      if (data.title) parts.push(data.title as string);
      return parts.join(" · ") || "수상/성과 등록";
    },
  },
  follower_milestone: {
    icon: "🎉",
    label: "팔로워",
    getTitle: (data) => `팔로워 ${data.count ?? "?"}명 달성!`,
  },
  kudos_milestone: {
    icon: "👏",
    label: "응원",
    getTitle: (data) => `총 응원 ${data.count ?? "?"}개 달성!`,
  },
};

export function formatTimelineDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${date.getFullYear()}.${month}.${day}`;
}
