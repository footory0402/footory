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

/**
 * 경기 영상 위에 올라가는 전체 HUD 오버레이.
 * 상단: TopBar (FOOTORY / FOOTBALL HIGHLIGHT)
 * 하단: [MiniCard(25%) | InfoBar(flex-1) | GoalCounter(15%)] 통합 바
 */
export default function HudOverlay({ data, config }: HudOverlayProps) {
  const showBottom = config.showMiniCard || config.showInfoBar || config.showGoalCounter;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top bar */}
      {config.showTopBar && <TopBar />}

      {/* Bottom integrated bar */}
      {showBottom && (
        <div className="absolute inset-x-0 bottom-0">
          {/* Gold accent line */}
          <div
            className="h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${data.accentColor}, #E74C3C, ${data.accentColor})`,
            }}
          />

          {/* Main bar — 반투명으로 영상이 비치게 */}
          <div
            className="flex items-stretch backdrop-blur-sm"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.65))",
            }}
          >
            {config.showMiniCard && <MiniCard data={data} />}
            {config.showInfoBar && <InfoBar data={data} />}
            {config.showGoalCounter && <GoalCounter data={data} goalCount={config.goalCount} />}
          </div>
        </div>
      )}
    </div>
  );
}
