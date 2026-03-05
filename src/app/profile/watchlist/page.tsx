"use client";

import WatchlistPanel from "@/components/scout/WatchlistPanel";
import { useRouter } from "next/navigation";

export default function WatchlistPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-[430px] min-h-screen">
      <WatchlistPanel onClose={() => router.back()} />
    </div>
  );
}
