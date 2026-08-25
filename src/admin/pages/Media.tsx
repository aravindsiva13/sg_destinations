import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { useAddMedia, useDeleteMedia, useMedia } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';

export default function Media() {
  const { data, isLoading, isError, refetch } = useMedia();
  const addMut = useAddMedia();
  const deleteMut = useDeleteMedia();
  const [f, setF] = useState({ url: '', alt: '', folder: '' });
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (!f.url.trim()) {
      setError('Paste an image URL.');
      return;
    }
    try {
      await addMut.mutateAsync({ url: f.url.trim(), alt: f.alt || undefined, folder: f.folder || undefined });
      setF({ url: '', alt: '', folder: '' });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add media'));
    }
  }

  return (
    <div>
      <PageHeader title="Media Library" subtitle="Centralized image URLs you can reuse across content." />

      <div className="mb-6 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Image URL">
          <input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className={inputCls} placeholder="https://…" />
        </Field>
        <Field label="Alt text">
          <input value={f.alt} onChange={(e) => setF({ ...f, alt: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Folder">
          <input value={f.folder} onChange={(e) => setF({ ...f, folder: e.target.value })} className={inputCls} placeholder="stays" />
        </Field>
        <div className="flex items-end">
          <AdminButton onClick={add} loading={addMut.isPending} className="w-full">
            Add to library
          </AdminButton>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-4">{error}</p>}
      </div>

      {isLoading ? (
        <LoadingState label="Loading media…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No media yet" description="Add image URLs above to build your library." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-line bg-paper">
              <img src={m.url} alt={m.alt ?? ''} loading="lazy" className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-muted">{m.folder ?? '—'}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard?.writeText(m.url)}
                    className="text-xs text-terracotta hover:underline"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      deleteMut.mutate(m.id, {
                        onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete media')),
                      })
                    }
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
