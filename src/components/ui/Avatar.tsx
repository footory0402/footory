import Image from "next/image";
import { LEVELS } from "@/lib/constants";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  level?: number;
  imageUrl?: string;
}

const sizes = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-[15px]",
  lg: "h-14 w-14 text-[17px]",
};

const pxSizes = { xs: 28, sm: 36, md: 48, lg: 56 };

export default function Avatar({ name, size = "md", level = 1, imageUrl }: AvatarProps) {
  const lvl = LEVELS[Math.min(level, 5) - 1];
  const borderColor = lvl.color;
  const hasGlow = level >= 3;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{
        boxShadow: hasGlow ? `0 0 12px ${borderColor}40` : undefined,
        border: `2.5px solid ${borderColor}`,
      }}
    >
      <div className={`${sizes[size]} flex items-center justify-center bg-card-alt font-semibold text-text-2`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={pxSizes[size]}
            height={pxSizes[size]}
            className="h-full w-full object-cover"
            unoptimized={imageUrl.includes("?t=")}
          />
        ) : (
          name.charAt(0)
        )}
      </div>
    </div>
  );
}
