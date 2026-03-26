import type { Metadata } from "next";
import "./editor.css";

export const metadata: Metadata = {
  title: "FOOTORY Editor — 선수 프로필 카드 제작",
  description: "프로급 선수 프로필 카드를 자동 생성하고 영상으로 내보내세요",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0a0a0c]">
      {children}
    </div>
  );
}
