"use client";

import Link from "next/link";

interface Props {
  handle: string;
}

export default function SignupCTA({ handle }: Props) {
  const next = encodeURIComponent(`/p/${handle}`);

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
      <div className="glass-nav rounded-2xl border border-white/[0.08] p-4">
        <p className="mb-1 text-center text-[13px] font-semibold text-text-1">
          이 선수의 활약이 궁금하다면?
        </p>
        <p className="mb-3 text-center text-[11px] text-text-3">
          선수 · 부모 · 코치/스카우터 모두 환영해요
        </p>
        <Link
          href={`/login?next=${next}`}
          className="block w-full rounded-full bg-accent py-3 text-center text-[14px] font-bold text-bg"
        >
          무료로 시작하기
        </Link>
      </div>
    </div>
  );
}
