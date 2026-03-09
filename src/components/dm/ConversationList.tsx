"use client";

import Link from "next/link";
import Image from "next/image";
import { timeAgo } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

function AvatarCircle({ url, name }: { url?: string; name: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={48}
        height={48}
        sizes="48px"
        className="h-12 w-12 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-lg font-bold text-text-2">
      {name.charAt(0)}
    </div>
  );
}

export default function ConversationList({
  conversations,
}: {
  conversations: Conversation[];
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-3">
        <span className="text-4xl">💬</span>
        <p className="mt-3 text-sm">아직 대화가 없습니다</p>
        <p className="mt-1 text-xs">프로필에서 메시지 버튼을 눌러 대화를 시작하세요</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/dm/${conv.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-card"
        >
          <AvatarCircle
            url={conv.otherUser?.avatarUrl}
            name={conv.otherUser?.name ?? "?"}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-text-1 truncate">
                {conv.otherUser?.name ?? "알 수 없음"}
              </span>
              <span className="flex-shrink-0 text-xs text-text-3">
                {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ""}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[13px] text-text-2 truncate">
                {conv.lastMessagePreview ?? "대화를 시작하세요"}
              </p>
              {(conv.unreadCount ?? 0) > 0 && (
                <span className="ml-2 flex-shrink-0 h-2 w-2 rounded-full bg-accent" />
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
