"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/Toast";

interface RecentDm {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title?: string;
  recentDms?: RecentDm[];
}

export default function ShareSheet({ open, onClose, shareUrl, title, recentDms = [] }: ShareSheetProps) {
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
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: "보러 가기", link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
    } else if (typeof window !== "undefined") {
      window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}`, "_blank");
    }
    onClose();
  };

  const handleInstagram = () => {
    if (navigator.share) {
      navigator.share({ title: title ?? "Footory", url: shareUrl }).catch(() => {});
    } else {
      window.open(`instagram://story-camera`, "_blank");
    }
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("링크가 복사되었습니다");
    } catch {
      toast("링크 복사에 실패했습니다", "error");
    }
    onClose();
  };

  const handleDm = () => {
    toast("DM 기능은 준비 중입니다");
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
            { icon: "📱", label: "DM으로 보내기", onClick: handleDm },
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

        {/* Recent DMs — shown when DM history is available */}
        {recentDms.length > 0 && (
          <div className="px-4 pb-4 border-t border-border pt-3">
            <p className="text-[11px] text-text-3 mb-2">최근 DM</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recentDms.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => { toast(`${dm.name}님에게 전송 (준비 중)`); onClose(); }}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-[14px] font-semibold text-text-1">
                    {dm.name[0]}
                  </div>
                  <span className="text-[11px] text-text-2 max-w-[44px] truncate">{dm.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
