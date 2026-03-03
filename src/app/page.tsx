"use client";

import { useState } from "react";
import FeedList from "@/components/feed/FeedList";
import { useProfile } from "@/hooks/useProfile";
import ParentHomeSection from "@/components/parent/ParentHomeSection";

export default function HomePage() {
  const { profile } = useProfile();
  const isParent = profile?.role === "parent";

  return (
    <div className="px-4 pt-2">
      {isParent && <ParentHomeSection />}
      <FeedList />
    </div>
  );
}
