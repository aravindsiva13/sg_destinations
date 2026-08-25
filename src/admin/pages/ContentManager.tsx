import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import AdminIcon from '../components/AdminIcon';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import ContentForm, { type TypeConfig } from './ContentForm';
import { useContent, useDeleteContent } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { ContentItem } from '../types';

interface Props {
  config: TypeConfig & { title: string; subtitle: string };
}

/** One reusable CRUD screen for any content type (amenities, dining, events, offers). */
export default function ContentManager({ config }: Props) {
  const { hasRole } = useAdminAuth();
  const { data, isLoading, isError, refetch } = useContent(config.type);
  const deleteMut = useDeleteContent(config.type);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canWrite = hasRole('SUPER_ADMIN', 'MANAGER');

  async function handleDelete(item: ContentItem) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setError(null);
    try {
      await deleteMut.mutateAsync(item.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete'));
    }
  }

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          canWrite && (
            <AdminButton onClick={() => setCreating(true)}>
              <AdminIcon name="plus" className="h-4 w-4" />
              New {config.singular}
            </AdminButton>
          )
        }
      />

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {isLoading ? (
        <LoadingState label="Loading…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title={`No ${config.title.toLowerCase()} yet`}
          description={`Create your first ${config.singular}.`}
          action={canWrite && <AdminButton onClick={() => setCreating(true)}>New {config.singular}</AdminButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-line bg-paper">
              <div className="relative aspect-[4/3]">
                <img src={item.heroImage} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {item.featured && <Badge tone="amber">Featured</Badge>}
                  {!item.published && <Badge tone="slate">Draft</Badge>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg text-ink">{item.title}</h3>
                    <p className="text-xs text-muted">
                      {item.category ?? '—'} · /{item.slug}
                    </p>
                  </div>
                  {item.priceLabel && <span className="whitespace-nowrap text-sm font-medium text-ink">{item.priceLabel}</span>}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{item.excerpt}</p>
                {canWrite && (
                  <div className="mt-3 flex gap-2">
                    <AdminButton size="sm" variant="secondary" onClick={() => setEditing(item)}>
                      Edit
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="ghost"
                      className="text-rose-600"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </AdminButton>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ContentForm
          config={config}
          item={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
