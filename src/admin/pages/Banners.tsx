import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import {
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useUpdateBanner,
  type BannerInput,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import type { Banner, BannerType } from '../types';

const TYPE_LABEL: Record<BannerType, string> = {
  ANNOUNCEMENT: 'Announcement bar',
  HERO: 'Hero slides',
  PROMO: 'Promo banners',
};

export default function Banners() {
  const { data, isLoading, isError, refetch } = useBanners();
  const createMut = useCreateBanner();
  const updateMut = useUpdateBanner();
  const deleteMut = useDeleteBanner();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<BannerInput>({
    type: 'ANNOUNCEMENT',
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaLabel: '',
    ctaHref: '',
    active: true,
    sortOrder: 0,
    startDate: null,
    endDate: null,
  });
  const set = <K extends keyof BannerInput>(k: K, v: BannerInput[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setError(null);
    if (!f.title.trim()) {
      setError('A title is required.');
      return;
    }
    try {
      await createMut.mutateAsync({
        ...f,
        subtitle: f.subtitle || null,
        imageUrl: f.imageUrl || null,
        ctaLabel: f.ctaLabel || null,
        ctaHref: f.ctaHref || null,
        endDate: f.endDate || null,
      });
      setShowForm(false);
      setF((p) => ({ ...p, title: '', subtitle: '' }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save banner'));
    }
  }

  const groups: BannerType[] = ['ANNOUNCEMENT', 'HERO', 'PROMO'];

  return (
    <div>
      <PageHeader
        title="Home Content & Banners"
        subtitle="Announcement bar, hero slides and promo banners shown on the public site."
        actions={
          <AdminButton variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New banner'}
          </AdminButton>
        }
      />

      {showForm && (
        <div className="mb-6 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Type">
            <select value={f.type} onChange={(e) => set('type', e.target.value as BannerType)} className={inputCls}>
              <option value="ANNOUNCEMENT">Announcement bar</option>
              <option value="HERO">Hero slide</option>
              <option value="PROMO">Promo banner</option>
            </select>
          </Field>
          <Field label="Title">
            <input value={f.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Subtitle">
            <input value={f.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Image URL">
            <input value={f.imageUrl ?? ''} onChange={(e) => set('imageUrl', e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <Field label="CTA label">
            <input value={f.ctaLabel ?? ''} onChange={(e) => set('ctaLabel', e.target.value)} className={inputCls} placeholder="Check availability" />
          </Field>
          <Field label="CTA link">
            <input value={f.ctaHref ?? ''} onChange={(e) => set('ctaHref', e.target.value)} className={inputCls} placeholder="/reserve" />
          </Field>
          <Field label="Sort order">
            <input type="number" value={f.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Ends (promo countdown)">
            <input type="date" value={(f.endDate as string) ?? ''} onChange={(e) => set('endDate', e.target.value || null)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <AdminButton onClick={submit} loading={createMut.isPending} className="w-full">
              Save banner
            </AdminButton>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-3">{error}</p>}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading banners…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No banners yet" description="Add an announcement, hero slide or promo above." />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const items = data.filter((b) => b.type === g);
            if (items.length === 0) return null;
            return (
              <section key={g}>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{TYPE_LABEL[g]}</h2>
                <div className="space-y-2">
                  {items.map((b: Banner) => (
                    <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper p-3">
                      {b.imageUrl && <img src={b.imageUrl} alt="" className="h-12 w-16 rounded object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{b.title}</p>
                        {b.subtitle && <p className="truncate text-xs text-muted">{b.subtitle}</p>}
                        {b.ctaLabel && <p className="text-xs text-terracotta">{b.ctaLabel} → {b.ctaHref}</p>}
                      </div>
                      {b.endDate && <Badge tone="amber">ends {new Date(b.endDate).toLocaleDateString('en-IN')}</Badge>}
                      <button
                        onClick={() =>
                          updateMut.mutate(
                            { id: b.id, input: { active: !b.active } },
                            { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update banner')) },
                          )
                        }
                        className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                          b.active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-200 text-slate-600 ring-slate-300'
                        }`}
                      >
                        {b.active ? 'Live' : 'Off'}
                      </button>
                      <button
                        onClick={() =>
                          deleteMut.mutate(b.id, {
                            onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete banner')),
                          })
                        }
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
