"use client";

import type { TeamAlbumItem } from "@/lib/types";

interface TeamAlbumProps {
  albums: TeamAlbumItem[];
}

export default function TeamAlbum({ albums }: TeamAlbumProps) {
  if (albums.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-text-3">
        아직 앨범이 비어있어요
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {albums.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square overflow-hidden rounded-[4px] bg-card"
        >
          {item.mediaType === "video" ? (
            <>
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-card">
                  <svg className="h-6 w-6 text-text-3" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                <svg className="inline h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </>
          ) : (
            <img
              src={item.mediaUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}
