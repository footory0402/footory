"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  playerId: string;
}

export default function AddToWatchlistButton({ playerId }: Props) {
  const [watching, setWatching] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("role, is_verified")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_verified && data.role === "scout") {
            setVisible(true);
            fetch(`/api/watchlist/${playerId}`)
              .then((r) => r.json())
              .then((d) => setWatching(d.watching ?? false))
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        });
    });
  }, [playerId]);

  const handleToggle = async () => {
    if (watching) {
      await fetch(`/api/watchlist/${playerId}`, { method: "DELETE" });
      setWatching(false);
    } else {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      setWatching(true);
    }
  };

  if (!visible || loading) return null;

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
        watching
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-text-2"
      }`}
    >
      <span>{watching ? "⭐" : "☆"}</span>
      <span>{watching ? "관심 선수" : "관심 선수 추가"}</span>
    </button>
  );
}
