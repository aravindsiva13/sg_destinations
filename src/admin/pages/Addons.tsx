import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import { useAddons, useCreateAddon, useDeleteAddon, useUpdateAddon } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import { inr } from '../constants';

const empty = {
  name: '',
  description: '',
  category: '',
  price: 0,
  complimentary: false,
  sortOrder: 0,
};

export default function Addons() {
  const { data, isLoading, isError, refetch } = useAddons();
  const createMut = useCreateAddon();
  const updateMut = useUpdateAddon();
  const deleteMut = useDeleteAddon();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ ...empty });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setError(null);
    if (!f.name.trim()) {
      setError('A name is required.');
      return;
    }
    try {
      await createMut.mutateAsync({
        name: f.name.trim(),
        description: f.description || null,
        category: f.category || null,
        price: f.complimentary ? 0 : Number(f.price) || 0,
        complimentary: f.complimentary,
        active: true,
        sortOrder: Number(f.sortOrder) || 0,
      });
      setShowForm(false);
      setF({ ...empty });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save add-on'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Add-ons & Complimentary"
        subtitle="Extras guests can pick during booking — free or priced."
        actions={
          <AdminButton variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New add-on'}
          </AdminButton>
        }
      />

      {showForm && (
        <div className="mb-6 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name">
            <input value={f.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Candlelight dinner" />
          </Field>
          <Field label="Category">
            <input value={f.category} onChange={(e) => set('category', e.target.value)} className={inputCls} placeholder="Dining" />
          </Field>
          <Field label="Price (₹)">
            <input
              type="number"
              value={f.price}
              disabled={f.complimentary}
              onChange={(e) => set('price', Number(e.target.value))}
              className={`${inputCls} disabled:opacity-50`}
            />
          </Field>
          <Field label="Sort order">
            <input type="number" value={f.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Description">
            <input value={f.description} onChange={(e) => set('description', e.target.value)} className={inputCls} placeholder="Shown under the name" />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={f.complimentary}
              onChange={(e) => set('complimentary', e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            Complimentary (free)
          </label>
          <div className="flex items-end lg:col-span-2">
            <AdminButton onClick={submit} loading={createMut.isPending} className="w-full">
              Save add-on
            </AdminButton>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-4">{error}</p>}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading add-ons…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No add-ons yet" description="Create a complimentary or priced extra above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream/60 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Add-on</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{a.name}</span>
                      {a.description && <p className="text-xs text-muted">{a.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted">{a.category || '—'}</td>
                    <td className="px-4 py-3 text-ink">
                      {a.complimentary ? (
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs text-forest">Complimentary</span>
                      ) : (
                        inr(a.price)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                        updateMut.mutate(
                          { id: a.id, input: { active: !a.active } },
                          { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update add-on')) },
                        )
                      }
                        className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                          a.active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-200 text-slate-600 ring-slate-300'
                        }`}
                      >
                        {a.active ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                        window.confirm(`Delete ${a.name}?`) &&
                        deleteMut.mutate(a.id, {
                          onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete add-on')),
                        })
                      }
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
