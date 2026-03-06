export default function Loading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl">
      {/* Search bar skeleton */}
      <div className="mb-4">
        <div className="h-11 animate-pulse rounded-xl bg-surface-raised" />
      </div>

      {/* Category filters skeleton */}
      <div className="mb-6 flex gap-2 overflow-hidden px-1">
        {[72, 96, 88, 80].map((w, i) => (
          <div
            key={i}
            className="h-8 shrink-0 animate-pulse rounded-full bg-surface-raised"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Items skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((group) => (
          <div key={group}>
            {/* Category header skeleton */}
            <div className="mb-2 flex items-center gap-2 px-4">
              <div className="h-5 w-5 animate-pulse rounded bg-surface-raised" />
              <div className="h-4 w-24 animate-pulse rounded bg-surface-raised" />
            </div>

            {/* Items in group */}
            <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              {Array.from({ length: group === 1 ? 3 : 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-border-light px-4 py-3 last:border-b-0"
                >
                  <div className="h-6 w-6 animate-pulse rounded-lg bg-surface-raised" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-28 animate-pulse rounded bg-surface-raised" />
                    <div className="h-3 w-20 animate-pulse rounded bg-surface-raised" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
