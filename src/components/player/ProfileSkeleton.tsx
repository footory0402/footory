export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse px-4 pt-4">
      {/* ProfileCard skeleton */}
      <div className="rounded-[10px] bg-card p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-border" />
          {/* Info */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-5 w-28 rounded bg-border" />
            <div className="h-3 w-20 rounded bg-border" />
            <div className="h-3 w-40 rounded bg-border" />
          </div>
        </div>
        <div className="my-3 h-px bg-border" />
        <div className="flex gap-4">
          <div className="h-4 w-16 rounded bg-border" />
          <div className="h-4 w-16 rounded bg-border" />
          <div className="ml-auto h-4 w-12 rounded bg-border" />
        </div>
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-border" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="mt-4 flex gap-2">
        <div className="h-9 w-20 rounded-full bg-border" />
        <div className="h-9 w-20 rounded-full bg-border" />
        <div className="h-9 w-20 rounded-full bg-border" />
      </div>

      {/* Content skeleton */}
      <div className="mt-5 space-y-4">
        <div className="h-40 rounded-[10px] bg-card" />
        <div className="h-24 rounded-[10px] bg-card" />
      </div>
    </div>
  );
}
