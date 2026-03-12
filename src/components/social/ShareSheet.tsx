"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/Toast";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  shareUrl?: string;
  url?: string;
  title?: string;
  text?: string;
}

export default function ShareSheet({ open, onClose, shareUrl, url, title }: ShareSheetProps) {
  const resolvedUrl = shareUrl ?? url ?? "";
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleKakao = () => {
    // Kakao SDK share — if SDK not loaded, open in new tab
    const win = window as unknown as { Kakao?: { isInitialized?: () => boolean; Share?: { sendDefault: (opts: Record<string, unknown>) => void } } };
    if (typeof window !== "undefined" && win.Kakao?.isInitialized?.()) {
      win.Kakao?.Share?.sendDefault({
        objectType: "feed",
        content: {
          title: title ?? "Footory 하이라이트",
          description: "유소년 축구 하이라이트",
          imageUrl: "",
          link: { mobileWebUrl: resolvedUrl, webUrl: resolvedUrl },
        },
        buttons: [{ title: "보러 가기", link: { mobileWebUrl: resolvedUrl, webUrl: resolvedUrl } }],
      });
    } else if (typeof window !== "undefined") {
      window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(resolvedUrl)}`, "_blank");
    }
    onClose();
  };

  const handleInstagram = () => {
    if (navigator.share) {
      navigator.share({ title: title ?? "Footory", url: resolvedUrl }).catch(() => {});
    } else {
      window.open(`instagram://story-camera`, "_blank");
    }
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      toast("링크가 복사되었습니다");
    } catch {
      toast("링크 복사에 실패했습니다", "error");
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-[430px] rounded-t-[14px] bg-[#161618] animate-slide-up pb-[env(safe-area-inset-bottom)]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-8 rounded-full bg-border" />
        </div>

        {/* Title */}
        <div className="px-4 pb-3 border-b border-border">
          <h3 className="text-[15px] font-semibold text-text-1 text-center">공유</h3>
        </div>

        {/* Share options */}
        <div className="px-4 py-2">
          {[
            { icon: "💬", label: "카카오톡", onClick: handleKakao },
            { icon: "📷", label: "인스타 스토리", onClick: handleInstagram },
            { icon: "🔗", label: "링크 복사", onClick: handleCopyLink },
          ].map(({ icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center gap-3 w-full h-[48px] px-2 rounded-[10px] hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-[20px] w-8 text-center">{icon}</span>
              <span className="text-[14px] text-text-1">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
