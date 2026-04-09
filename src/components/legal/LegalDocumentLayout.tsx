"use client";

import Link from "next/link";

interface LegalDocumentLayoutProps {
  title: string;
  summary: string;
  effectiveDate: string;
  revisedDate: string;
  children: React.ReactNode;
}

export function LegalDocumentLayout({
  title,
  summary,
  effectiveDate,
  revisedDate,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="min-h-screen bg-bg text-text-1">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-16 pt-8">
        <div className="mb-6 flex items-center justify-between text-xs text-text-3">
          <Link href="/login" className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-accent hover:text-accent">
            로그인으로
          </Link>
          <Link href="/" className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-accent hover:text-accent">
            홈으로
          </Link>
        </div>

        <header className="rounded-[24px] border border-white/8 bg-card/80 px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">FOOTORY Policy</p>
          <h1 className="mt-3 text-[28px] font-bold leading-tight">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-text-2">{summary}</p>
          <div className="mt-4 grid gap-2 text-xs text-text-3">
            <p>시행일: {effectiveDate}</p>
            <p>최종 수정일: {revisedDate}</p>
          </div>
        </header>

        <article className="mt-5 space-y-4">
          {children}
        </article>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-white/6 bg-card px-5 py-5">
      <h2 className="text-base font-bold text-text-1">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-text-2">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="rounded-2xl bg-bg/70 px-4 py-3 leading-6 text-text-2">
          {item}
        </li>
      ))}
    </ul>
  );
}
