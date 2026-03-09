export default function MvpPageSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-28 animate-pulse rounded-xl bg-card" />
          <div className="h-3 w-24 animate-pulse rounded bg-card-alt" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-full bg-card" />
      </div>

      <div className="h-16 animate-pulse rounded-xl bg-card" />
      <div className="h-56 animate-pulse rounded-xl bg-card" />

      <div className="grid grid-cols-2 gap-2">
        <div className="h-44 animate-pulse rounded-xl bg-card" />
        <div className="h-44 animate-pulse rounded-xl bg-card" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl bg-card"
          />
        ))}
      </div>

      <div className="flex gap-1 rounded-xl bg-card p-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-9 flex-1 animate-pulse rounded-lg bg-card-alt"
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-card">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-card-alt px-4 py-3 last:border-b-0"
          >
            <div className="h-5 w-6 animate-pulse rounded bg-card-alt" />
            <div className="h-[42px] w-14 animate-pulse rounded-xl bg-card-alt" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-card-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 animate-pulse rounded bg-card-alt" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-card-alt" />
            </div>
            <div className="h-8 w-14 animate-pulse rounded-lg bg-card-alt" />
          </div>
        ))}
      </div>
    </div>
  );
}
