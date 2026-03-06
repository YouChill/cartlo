export default function FamilyLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Family name skeleton */}
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-surface-raised" />

      {/* Members section skeleton */}
      <div className="mb-8">
        <div className="mb-3 h-6 w-24 animate-pulse rounded bg-surface-raised" />
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border-light px-4 py-3 last:border-b-0"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-surface-raised" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
              </div>
              <div className="h-3 w-14 animate-pulse rounded bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>

      {/* Invite section skeleton */}
      <div>
        <div className="mb-3 h-6 w-36 animate-pulse rounded bg-surface-raised" />
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 h-10 animate-pulse rounded-xl bg-surface-raised" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-surface-raised" />
        </div>
      </div>
    </div>
  );
}
