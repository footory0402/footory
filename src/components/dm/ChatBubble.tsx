"use client";

import type { Message } from "@/lib/types";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBubble({
  message,
  isMine,
  onLongPress,
}: {
  message: Message;
  isMine: boolean;
  onLongPress?: () => void;
}) {
  if (message.deletedAt) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-0.5`}>
        <div className="rounded-xl bg-surface px-3 py-2 text-[13px] italic text-text-3">
          삭제된 메시지입니다
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-4 py-0.5`}>
      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
        <button
          className={`rounded-[14px] px-3 py-2 text-[14px] leading-relaxed text-left ${
            isMine
              ? "rounded-br-[4px] border border-[rgba(212,168,67,0.3)] bg-[rgba(212,168,67,0.15)] text-text-1"
              : "rounded-bl-[4px] bg-elevated text-text-1"
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            onLongPress?.();
          }}
        >
          {message.content}
        </button>
        <div className={`mt-0.5 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className="text-[11px] text-text-3">
            {formatTime(message.createdAt)}
          </span>
          {isMine && message.isRead && (
            <span className="text-[11px] text-accent">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
