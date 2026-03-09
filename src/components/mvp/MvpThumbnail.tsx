"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const brokenThumbnailUrls = new Set<string>();

interface MvpThumbnailProps {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

export default function MvpThumbnail({
  src,
  alt,
  sizes,
  className,
  fallbackClassName,
  priority = false,
}: MvpThumbnailProps) {
  const [failed, setFailed] = useState(() =>
    !src || (typeof src === "string" && brokenThumbnailUrls.has(src))
  );

  useEffect(() => {
    setFailed(!src || brokenThumbnailUrls.has(src));
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-card-alt text-[20px] opacity-30",
          fallbackClassName
        )}
      >
        <span aria-hidden="true">🎬</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => {
        brokenThumbnailUrls.add(src);
        setFailed(true);
      }}
    />
  );
}
