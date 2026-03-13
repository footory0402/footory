"use client";

import Image from "next/image";
import { timeAgo } from "@/lib/utils";
import type { DmRequest } from "@/lib/types";

export default function SentRequestCard({ request }: { request: DmRequest }) {
  const user = request.receiver;

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex items-start gap-3">
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            sizes="40px"
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-bold text-text-2">
            {user?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-text-1">
              {user?.name ?? "알 수 없음"}
            </p>
            <span className="text-[11px] text-text-3">
              {timeAgo(request.createdAt)}
            </span>
          </div>
          {user?.position && (
            <p className="text-[12px] text-text-3">{user.position}</p>
          )}
          {request.previewMessage && (
            <p className="mt-1 text-[13px] text-text-2 line-clamp-2">
              &ldquo;{request.previewMessage}&rdquo;
            </p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="text-[12px] text-amber-400">수락 대기 중</span>
          </div>
        </div>
      </div>
    </div>
  );
}
