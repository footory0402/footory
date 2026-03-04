"use client";

import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import type { DiscoverHighlight } from "@/types/discover";

interface HotHighlightsProps {
  items: DiscoverHighlight[];
  loading: boolean;
}

export default function HotHighlights({ items, loading }: HotHighlightsProps) {
  if (loading) {
    return <SectionSkeleton count={2} />;
  }

  if (items.length === 0) {
    return <EmptySection text="아직 하이라이트가 없어요" />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const profile = item.profiles;
        const meta = item.metadata;
        return (
          <div key={item.id} className="rounded-[12px] bg-card overflow-hidden">
            {meta?.thumbnail_url && (
              <div className="relative aspect-video w-full bg-card-alt">
                <Image
                  src={meta.thumbnail_url}
                  alt="Highlight"
                  fill
                  sizes="(max-width: 430px) 100vw, 430px"
                  className="object-cover"
                />
                {meta.duration && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                    {Math.floor(meta.duration)}초
                  </span>
                )}
              </div>
            )}
            <div className="p-3">
              {profile && (
                <Link href={`/p/${profile.handle}`} className="flex items-center gap-2">
                  <Avatar name={profile.name} size="xs" level={profile.level} imageUrl={profile.avatar_url ?? undefined} />
                  <span className="text-[13px] font-medium text-text-1 truncate">{profile.name}</span>
                </Link>
              )}
              {meta?.tags && meta.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {meta.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-card-alt px-2 py-0.5 text-[10px] text-text-3">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-[12px] bg-card" />
      ))}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-[12px] bg-card py-8">
      <p className="text-[13px] text-text-3">{text}</p>
    </div>
  );
}
