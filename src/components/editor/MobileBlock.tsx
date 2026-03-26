import Link from "next/link";
import { Monitor } from "lucide-react";

export default function MobileBlock() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1C22] ring-1 ring-white/8">
        <Monitor className="h-8 w-8 text-text-2" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-1">PC에서 이용해주세요</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-3">
          에디터 기능은 데스크톱 환경에서만
          <br />
          사용할 수 있습니다.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
