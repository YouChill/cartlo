export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Profile section skeleton */}
      <div className="mb-8">
        <div className="mb-3 h-6 w-16 animate-pulse rounded bg-surface-raised" />
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-4">
            <div className="mb-1.5 h-4 w-12 animate-pulse rounded bg-surface-raised" />
            <div className="h-11 animate-pulse rounded-xl bg-surface-raised" />
          </div>
          <div className="mb-3">
            <div className="mb-1.5 h-4 w-10 animate-pulse rounded bg-surface-raised" />
            <div className="h-11 animate-pulse rounded-xl bg-surface-raised" />
          </div>
          <div className="h-11 animate-pulse rounded-xl bg-surface-raised" />
        </div>
      </div>

      {/* Konto section skeleton */}
      <div>
        <div className="mb-3 h-6 w-16 animate-pulse rounded bg-surface-raised" />
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="h-11 animate-pulse rounded-xl bg-surface-raised" />
        </div>
      </div>
    </div>
  );
}
