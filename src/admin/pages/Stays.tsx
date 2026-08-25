import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import AdminIcon from '../components/AdminIcon';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import StayForm from './StayForm';
import { useDeleteStay, useStays } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { inr } from '../constants';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { Stay } from '../types';

export default function Stays() {
  const { hasRole } = useAdminAuth();
  const { data, isLoading, isError, refetch } = useStays();
  const deleteMut = useDeleteStay();

  const [editing, setEditing] = useState<Stay | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canWrite = hasRole('SUPER_ADMIN', 'MANAGER');
  const canDelete = hasRole('SUPER_ADMIN');

  async function handleDelete(stay: Stay) {
    if (!window.confirm(`Delete “${stay.name}”? This cannot be undone.`)) return;
    setDeleteError(null);
    try {
      await deleteMut.mutateAsync(stay.id);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Could not delete stay'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Stays"
        subtitle="Rooms and cottages guests can book."
        actions={
          canWrite && (
            <AdminButton onClick={() => setCreating(true)}>
              <AdminIcon name="plus" className="h-4 w-4" />
              New stay
            </AdminButton>
          )
        }
      />

      {deleteError && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{deleteError}</p>
      )}

      {isLoading ? (
        <LoadingState label="Loading stays…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No stays yet"
          description="Create your first room to start taking bookings."
          action={canWrite && <AdminButton onClick={() => setCreating(true)}>New stay</AdminButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((stay) => (
            <div
              key={stay.id}
              className="overflow-hidden rounded-xl border border-line bg-paper"
            >
              <div className="relative aspect-[4/3]">
                <img
                  src={stay.heroImage}
                  alt={stay.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {stay.featured && <Badge tone="amber">Featured</Badge>}
                  {!stay.published && <Badge tone="slate">Draft</Badge>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-lg text-ink">{stay.name}</h3>
                    <p className="text-xs text-muted">/{stay.slug}</p>
                  </div>
                  <p className="whitespace-nowrap font-medium text-ink">
                    {inr(stay.pricePerNight)}
                    <span className="text-xs font-normal text-muted"> /night</span>
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                  <span>★ {stay.rating}</span>
                  <span>·</span>
                  <span>{stay.capacity} guests</span>
                  <span>·</span>
                  <span>{stay.inventory} in stock</span>
                </div>
                {canWrite && (
                  <div className="mt-4 flex gap-2">
                    <AdminButton size="sm" variant="secondary" onClick={() => setEditing(stay)}>
                      Edit
                    </AdminButton>
                    {canDelete && (
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        className="text-rose-600"
                        loading={deleteMut.isPending}
                        onClick={() => handleDelete(stay)}
                      >
                        Delete
                      </AdminButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <StayForm
          stay={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
