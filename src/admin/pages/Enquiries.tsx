import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import NewBookingDrawer, { type BookingPrefill } from './NewBookingDrawer';
import { useEnquiries, useUpdateEnquiry } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import { STAFF, formatDate } from '../constants';
import type { Enquiry } from '../types';

const STATUS_TONE: Record<Enquiry['status'], 'amber' | 'blue' | 'slate'> = {
  NEW: 'amber',
  CONTACTED: 'blue',
  CLOSED: 'slate',
};

const NEXT: Record<Enquiry['status'], Enquiry['status'] | null> = {
  NEW: 'CONTACTED',
  CONTACTED: 'CLOSED',
  CLOSED: null,
};

const FILTERS: { value: Enquiry['status'] | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function Enquiries() {
  const { data, isLoading, isError, refetch } = useEnquiries();
  const updateMut = useUpdateEnquiry();
  const [filter, setFilter] = useState<Enquiry['status'] | 'ALL'>('ALL');
  const [convert, setConvert] = useState<BookingPrefill | null>(null);

  const filtered = useMemo(
    () => (data ?? []).filter((e) => filter === 'ALL' || e.status === filter),
    [data, filter],
  );

  return (
    <div>
      <PageHeader title="Enquiries" subtitle="Leads from the enquiry and contact forms." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.value === 'ALL' ? data?.length ?? 0 : (data ?? []).filter((e) => e.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                filter === f.value ? 'bg-forest text-cream' : 'bg-paper text-ink ring-1 ring-line hover:bg-cream'
              }`}
            >
              {f.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <LoadingState label="Loading enquiries…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No enquiries here" description="New leads will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const next = NEXT[e.status];
            const isUpdating = updateMut.isPending && updateMut.variables?.id === e.id;
            return (
              <div key={e.id} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-ink">{e.name}</h3>
                      <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                      {e.occasion && <span className="text-xs text-muted">· {e.occasion}</span>}
                      {e.guests ? <span className="text-xs text-muted">· {e.guests} guests</span> : null}
                    </div>
                    <p className="text-sm text-muted">
                      {e.email}
                      {e.phone ? ` · ${e.phone}` : ''}
                    </p>
                    {e.message && <p className="mt-1.5 max-w-2xl text-sm text-ink/80">{e.message}</p>}
                    <p className="mt-1 text-xs text-muted">{formatDate(e.createdAt)}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {next && (
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        loading={isUpdating}
                        onClick={() =>
                          updateMut.mutate(
                            { id: e.id, status: next },
                            { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update enquiry')) },
                          )
                        }
                      >
                        Mark {next.toLowerCase()}
                      </AdminButton>
                    )}
                    <AdminButton
                      size="sm"
                      onClick={() =>
                        setConvert({
                          customerName: e.name,
                          customerEmail: e.email,
                          customerPhone: e.phone ?? undefined,
                          guests: e.guests ?? 2,
                          source: 'Enquiry',
                          notes: e.occasion ? `Converted from enquiry — ${e.occasion}` : 'Converted from enquiry',
                        })
                      }
                    >
                      Convert to booking
                    </AdminButton>
                  </div>
                </div>

                {/* Assignee */}
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <span className="text-xs text-muted">Assigned to</span>
                  <select
                    value={e.assignee ?? ''}
                    onChange={(ev) =>
                      updateMut.mutate(
                        { id: e.id, assignee: ev.target.value || null },
                        { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update assignee')) },
                      )
                    }
                    className="rounded-lg border border-line bg-cream px-2 py-1 text-xs outline-none focus:border-forest"
                  >
                    <option value="">Unassigned</option>
                    {STAFF.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {convert && <NewBookingDrawer prefill={convert} onClose={() => setConvert(null)} />}
    </div>
  );
}
