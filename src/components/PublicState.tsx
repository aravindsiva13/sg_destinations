/** Lightweight loading / error / empty states for public data-driven sections. */

export function PublicLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid place-items-center gap-3 py-20 text-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-forest/30 border-t-forest" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function PublicError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="grid place-items-center gap-3 py-20 text-center">
      <p className="text-sm text-muted">We couldn’t load this just now.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-forest"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function PublicEmpty({ message = 'Nothing to show yet.' }: { message?: string }) {
  return <p className="py-20 text-center text-sm text-muted">{message}</p>;
}

export function StayCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="aspect-[4/3] w-full rounded-card bg-line/30" />
      <div>
        <div className="h-6 w-3/4 rounded bg-line/30" />
        <div className="mt-2 h-4 w-1/3 rounded bg-line/30" />
      </div>
    </div>
  );
}

export function StaysGridSkeleton() {
  return (
    <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      <StayCardSkeleton />
      <StayCardSkeleton />
      <StayCardSkeleton />
      <StayCardSkeleton />
      <StayCardSkeleton />
      <StayCardSkeleton />
    </div>
  );
}
