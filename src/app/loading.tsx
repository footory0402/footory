export default function Loading() {
  return (
    <div className="px-4 pt-4 pb-24 animate-pulse">
      {/* Header area skeleton */}
      <div className="mb-4 rounded-xl bg-card p-4">
        <div className="h-4 w-28 rounded bg-card-alt mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-card-alt" />
          <div className="h-3 w-3/4 rounded bg-card-alt" />
        </div>
      </div>
      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-3 rounded-xl bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-card-alt" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-card-alt" />
              <div className="h-2.5 w-16 rounded bg-card-alt" />
            </div>
          </div>
          <div className="aspect-video w-full rounded-xl bg-card-alt" />
        </div>
      ))}
    </div>
  );
}
