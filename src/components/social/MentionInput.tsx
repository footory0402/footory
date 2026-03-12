"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Avatar from "@/components/ui/Avatar";

interface MentionCandidate {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  level: number;
  position: string;
}

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  feedItemId?: string; // to fetch uploader + same-team members
}

// Parse @[handle] tokens for display
export function renderMentionText(text: string): React.ReactNode[] {
  const parts = text.split(/(@\[\w+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\[(\w+)\]$/);
    if (match) {
      return (
        <span key={i} className="text-accent font-semibold">
          @{match[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "댓글 입력...",
  disabled = false,
  feedItemId,
}: MentionInputProps) {
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch mention candidates when @ is typed
  const fetchCandidates = useCallback(async (q: string) => {
    try {
      const params = new URLSearchParams({ q });
      if (feedItemId) params.set("feedItemId", feedItemId);
      const res = await fetch(`/api/social/mention-candidates?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch {
      setCandidates([]);
    }
  }, [feedItemId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const cursor = e.target.selectionStart ?? newVal.length;

    // Find if cursor is inside a @query
    const beforeCursor = newVal.slice(0, cursor);
    const atMatch = beforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      const start = cursor - atMatch[0].length;
      setMentionStart(start);
      setMentionQuery(atMatch[1]);
      setShowDropdown(true);
      fetchCandidates(atMatch[1]);
    } else {
      setShowDropdown(false);
      setMentionStart(null);
      setMentionQuery("");
    }

    onChange(newVal);
  };

  const selectCandidate = (candidate: MentionCandidate) => {
    if (mentionStart === null) return;
    // Replace @query with @[handle]
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    const inserted = `@[${candidate.handle}] `;
    const newVal = before + inserted + after;
    onChange(newVal);
    setShowDropdown(false);
    setMentionStart(null);
    setMentionQuery("");
    // Restore focus
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const pos = before.length + inserted.length;
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Display value: convert @[handle] → @handle for the input field
  const displayValue = value.replace(/@\[(\w+)\]/g, "@$1");

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !showDropdown) onSubmit();
          if (e.key === "Escape") setShowDropdown(false);
        }}
        placeholder={placeholder}
        maxLength={500}
        disabled={disabled}
        className="w-full bg-surface rounded-full px-4 py-2 text-[13px] text-text-1 placeholder:text-text-3 outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50"
      />

      {showDropdown && candidates.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 right-0 rounded-[10px] bg-[#1E1E22] border border-border shadow-xl z-50 max-h-[200px] overflow-y-auto"
        >
          {candidates.map((c) => (
            <button
              key={c.id}
              onMouseDown={(e) => { e.preventDefault(); selectCandidate(c); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/5 transition-colors text-left"
            >
              <Avatar name={c.name} size="xs" imageUrl={c.avatar_url ?? undefined} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text-1 truncate">{c.name}</p>
                <p className="text-[11px] text-text-3">@{c.handle} · {c.position}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
