"use client";

import { useState, useRef } from "react";

export default function MessageInput({
  onSend,
  onAttach,
  disabled,
}: {
  onSend: (content: string) => void;
  onAttach?: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 border-t border-border bg-bg px-4 py-2">
      {onAttach && (
        <button
          onClick={onAttach}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-text-3 active:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
      )}
      <div className="flex flex-1 items-center rounded-full bg-card px-4 h-[44px]">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSend();
          }}
          placeholder="메시지 입력..."
          disabled={disabled}
          className="flex-1 bg-transparent text-[14px] text-text-1 placeholder:text-text-3 outline-none"
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-accent disabled:opacity-30"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}
