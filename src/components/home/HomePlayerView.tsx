"use client";

import type { MvpLeaderData } from "@/lib/server/feed";
import MvpTeaser from "@/components/mvp/MvpTeaser";

interface HomePlayerViewProps {
  mvpLeader: MvpLeaderData | null;
}

export default function HomePlayerView({
  mvpLeader,
}: HomePlayerViewProps) {
  return <MvpTeaser leader={mvpLeader} />;
}
