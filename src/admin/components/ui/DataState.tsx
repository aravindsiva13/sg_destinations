import type { ReactNode } from 'react';
import AdminButton from './AdminButton';

/** Standard loading/empty/error presentations for any data-driven view. */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-line bg-paper py-16 text-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-forest/40 border-t-forest" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  message = 'Could not load this data.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 py-16 text-rose-700">
      <span className="text-sm font-medium">{message}</span>
      {onRetry && (
        <AdminButton variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </AdminButton>
      )}
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-line bg-paper py-16 text-center">
      <span className="font-serif text-lg text-ink">{title}</span>
      {description && <span className="max-w-sm text-sm text-muted">{description}</span>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
