"use client";

import type { HudPlayerData, HudConfig } from "./types";
import TopBar from "./TopBar";
import MiniCard from "./MiniCard";
import InfoBar from "./InfoBar";
import GoalCounter from "./GoalCounter";

interface HudOverlayProps {
  data: HudPlayerData;
  config: HudConfig;
}

/** 경기 영상 위에 올라가는 전체 HUD 오버레이 */
export default function HudOverlay({ data, config }: HudOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {config.showTopBar && <TopBar />}
      {config.showMiniCard && <MiniCard data={data} />}
      {config.showInfoBar && <InfoBar data={data} />}
      {config.showGoalCounter && <GoalCounter data={data} goalCount={config.goalCount} />}
    </div>
  );
}
