"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { respondDmRequest } from "@/lib/dm";
import { timeAgo } from "@/lib/utils";
import type { DmRequest } from "@/lib/types";

export default function DmRequestCard({ request }: { request: DmRequest }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [handled, setHandled] = useState(false);

  const handleRespond = async (accept: boolean) => {
    setLoading(true);
    const convId = await respondDmRequest(request.id, accept);
    setLoading(false);
    setHandled(true);

    if (convId) {
      router.push(`/dm/${convId}`);
    }
  };

  if (handled) return null;

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex items-start gap-3">
        {request.sender?.avatarUrl ? (
          <img
            src={request.sender.avatarUrl}
            alt={request.sender.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sm font-bold text-text-2">
            {request.sender?.name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-text-1">
              {request.sender?.name ?? "알 수 없음"}
            </p>
            <span className="text-[11px] text-text-3">
              {timeAgo(request.createdAt)}
            </span>
          </div>
          {request.sender?.position && (
            <p className="text-[12px] text-text-3">
              {request.sender.position}
              {request.sender.teamName
                ? ` · ${request.sender.teamName}`
                : ""}
            </p>
          )}
          {request.previewMessage && (
            <p className="mt-1 text-[13px] text-text-2 line-clamp-2">
              &ldquo;{request.previewMessage}&rdquo;
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleRespond(false)}
              disabled={loading}
              className="flex-1 rounded-lg bg-surface py-2 text-[13px] font-semibold text-text-2 disabled:opacity-40"
            >
              거절
            </button>
            <button
              onClick={() => handleRespond(true)}
              disabled={loading}
              className="flex-1 rounded-lg bg-accent py-2 text-[13px] font-semibold text-black disabled:opacity-40"
            >
              수락
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
