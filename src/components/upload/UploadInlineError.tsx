"use client";

interface UploadInlineErrorProps {
  message: string;
}

export default function UploadInlineError({ message }: UploadInlineErrorProps) {
  return (
    <div className="rounded-xl bg-[#2a1f1f] px-4 py-3 ring-1 ring-[#ff6b6b]/20">
      <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#ff8a8a]">{message}</p>
    </div>
  );
}
