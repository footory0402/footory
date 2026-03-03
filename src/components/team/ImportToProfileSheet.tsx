"use client";

import { useState } from "react";
import Image from "next/image";
import type { TeamAlbumItem } from "@/lib/types";
import Button from "@/components/ui/Button";

interface ImportToProfileSheetProps {
  open: boolean;
  onClose: () => void;
  albums: TeamAlbumItem[];
}

export default function ImportToProfileSheet({ open, onClose, albums }: ImportToProfileSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    // TODO: Import selected album items to profile clips
    setTimeout(() => {
      setImporting(false);
      onClose();
      setSelected(new Set());
    }, 1000);
  };

  if (!open) return null;

  const videoAlbums = albums.filter((a) => a.mediaType === "video");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[70vh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-surface px-5 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-[17px] font-bold text-text-1">내 프로필로 가져오기</h2>

        {videoAlbums.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-text-3">가져올 영상이 없어요</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {videoAlbums.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`relative aspect-square overflow-hidden rounded-[8px] border-2 ${
                    selected.has(item.id) ? "border-accent" : "border-transparent"
                  }`}
                >
                  {item.thumbnailUrl ? (
                    <Image src={item.thumbnailUrl} alt="" fill sizes="(max-width: 430px) 33vw, 130px" className="object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-card">
                      <svg className="h-5 w-5 text-text-3" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  )}
                  {selected.has(item.id) && (
                    <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-bg">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Button
                variant="primary"
                size="full"
                onClick={onImport}
                disabled={selected.size === 0 || importing}
              >
                {importing ? "가져오는 중..." : `${selected.size}개 가져오기`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
