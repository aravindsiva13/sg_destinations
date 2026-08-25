import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { useModerateReview, useDeleteReview, useReviews } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import { formatDate } from '../constants';
import type { Review, ReviewStatus } from '../types';

const TONE: Record<ReviewStatus, 'amber' | 'green' | 'red'> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
};
const FILTERS: { value: ReviewStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function Stars({ n }: { n: number }) {
  return <span className="text-terracotta">{'★'.repeat(n)}<span className="text-line">{'★'.repeat(5 - n)}</span></span>;
}

export default function Reviews() {
  const [filter, setFilter] = useState<ReviewStatus | ''>('');
  const { data, isLoading, isError, refetch } = useReviews(filter);
  const moderate = useModerateReview();
  const remove = useDeleteReview();
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate guest reviews before they appear publicly." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              filter === f.value ? 'bg-forest text-cream' : 'bg-paper text-ink ring-1 ring-line hover:bg-cream'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading reviews…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No reviews here" description="Submitted reviews will appear for moderation." />
      ) : (
        <div className="space-y-3">
          {data.map((r: Review) => (
            <div key={r.id} className="rounded-xl border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{r.author}</span>
                    <Stars n={r.rating} />
                    <Badge tone={TONE[r.status]}>{r.status}</Badge>
                  </div>
                  {r.title && <p className="font-serif text-ink">{r.title}</p>}
                  <p className="mt-1 max-w-2xl text-sm text-ink/80">{r.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDate(r.createdAt)}</p>
                  {r.reply && (
                    <p className="mt-2 rounded-lg bg-cream/60 px-3 py-2 text-sm text-ink">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted">Reply</span>
                      <br />
                      {r.reply}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {r.status !== 'APPROVED' && (
                    <AdminButton
                      size="sm"
                      onClick={() =>
                        moderate.mutate(
                          { id: r.id, status: 'APPROVED' },
                          { onError: (err) => notifyError(apiErrorMessage(err, 'Could not approve review')) },
                        )
                      }
                    >
                      Approve
                    </AdminButton>
                  )}
                  {r.status !== 'REJECTED' && (
                    <AdminButton
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        moderate.mutate(
                          { id: r.id, status: 'REJECTED' },
                          { onError: (err) => notifyError(apiErrorMessage(err, 'Could not reject review')) },
                        )
                      }
                    >
                      Reject
                    </AdminButton>
                  )}
                  <button
                    onClick={() => {
                      setReplyFor(replyFor === r.id ? null : r.id);
                      setReplyText(r.reply ?? '');
                    }}
                    className="text-xs text-terracotta hover:underline"
                  >
                    {r.reply ? 'Edit reply' : 'Reply'}
                  </button>
                  <button
                    onClick={() =>
                      window.confirm('Delete this review?') &&
                      remove.mutate(r.id, {
                        onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete review')),
                      })
                    }
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {replyFor === r.id && (
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a public reply…"
                    className={inputCls}
                  />
                  <AdminButton
                    size="sm"
                    loading={moderate.isPending}
                    onClick={() => {
                      moderate.mutate(
                        { id: r.id, reply: replyText || null },
                        { onError: (err) => notifyError(apiErrorMessage(err, 'Could not save reply')) },
                      );
                      setReplyFor(null);
                    }}
                  >
                    Save
                  </AdminButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
