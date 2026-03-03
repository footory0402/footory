"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FollowList from "@/components/social/FollowList";

export default function FollowsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>}>
      <FollowsContent />
    </Suspense>
  );
}

function FollowsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "following" ? "following" : "followers";
  const profileId = searchParams.get("profileId") ?? undefined;
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    // Fetch current user id for follow button logic
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.id))
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 pb-24 pt-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-3 hover:text-text-1 p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-text-1">
          {tab === "followers" ? "팔로워" : "팔로잉"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {(["followers", "following"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              tab === t
                ? "text-accent border-accent"
                : "text-text-3 border-transparent hover:text-text-2"
            }`}
          >
            {t === "followers" ? "팔로워" : "팔로잉"}
          </button>
        ))}
      </div>

      <FollowList type={tab} profileId={profileId} currentUserId={currentUserId} />
    </div>
  );
}
