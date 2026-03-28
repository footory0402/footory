/** 상단 타이틀바: "FOOTORY" + "FOOTBALL HIGHLIGHT" */
export default function TopBar() {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-center bg-black/85 py-1.5">
      <span className="font-[var(--font-brand)] text-[11px] font-bold tracking-[6px] text-white/90">
        FOOTORY
      </span>
      <span className="ml-2 text-[8px] tracking-[3px] text-white/40">
        FOOTBALL HIGHLIGHT
      </span>
    </div>
  );
}
