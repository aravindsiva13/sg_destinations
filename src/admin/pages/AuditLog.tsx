import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { useAudit } from '../lib/queries';

const ENTITIES = ['', 'Auth', 'Booking', 'Stay', 'Enquiry'];

const ACTION_TONE = (action: string): 'green' | 'red' | 'blue' | 'amber' | 'slate' => {
  if (action.startsWith('create') || action === 'login') return 'green';
  if (action.startsWith('delete') || action.includes('CANCELLED')) return 'red';
  if (action.startsWith('payment')) return 'amber';
  if (action.startsWith('status')) return 'blue';
  return 'slate';
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const { data, isLoading, isError, refetch } = useAudit(page, entity || undefined);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="A record of every change made in the admin portal." />

      <div className="mb-4 flex flex-wrap gap-2">
        {ENTITIES.map((e) => (
          <button
            key={e || 'all'}
            onClick={() => {
              setEntity(e);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              entity === e ? 'bg-forest text-cream' : 'bg-paper text-ink ring-1 ring-line hover:bg-cream'
            }`}
          >
            {e || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading audit log…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No activity yet" description="Admin actions will be recorded here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <ul className="divide-y divide-line">
            {data.data.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <Badge tone={ACTION_TONE(entry.action)}>{entry.action}</Badge>
                <span className="text-muted">{entry.entity}</span>
                {entry.entityId && (
                  <span className="font-mono text-xs text-muted/70">{entry.entityId.slice(0, 8)}</span>
                )}
                <span className="ml-auto flex items-center gap-3">
                  <span className="text-ink">{entry.actor}</span>
                  <span className="text-xs text-muted">{timeAgo(entry.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
            <span className="text-muted">
              {data.total} entr{data.total === 1 ? 'y' : 'ies'} · page {data.page} of {Math.max(1, data.pageCount)}
            </span>
            <div className="flex gap-2">
              <AdminButton size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </AdminButton>
              <AdminButton
                size="sm"
                variant="secondary"
                disabled={data.page >= data.pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
