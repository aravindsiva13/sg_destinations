import { useState } from 'react';
import Drawer from '../components/ui/Drawer';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { useCreateContent, useUpdateContent, type ContentInput } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import type { ContentItem, ContentType } from '../types';
import DiningCard from '../../components/DiningCard';
import type { ApiContent } from '../../lib/publicTypes';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const linesToArr = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const parasToArr = (s: string) => s.split(/\n\s*\n/).map((l) => l.trim()).filter(Boolean);
const commaToArr = (s: string) => s.split(',').map((l) => l.trim()).filter(Boolean);

export interface TypeConfig {
  type: ContentType;
  singular: string;
  hasIcon?: boolean;
  hasPrice?: boolean;
}

export default function ContentForm({
  config,
  item,
  onClose,
}: {
  config: TypeConfig;
  item: ContentItem | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(item);
  const createMut = useCreateContent();
  const updateMut = useUpdateContent();
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    title: item?.title ?? '',
    slug: item?.slug ?? '',
    category: item?.category ?? '',
    icon: item?.icon ?? '',
    excerpt: item?.excerpt ?? '',
    heroImage: item?.heroImage ?? '',
    priceLabel: item?.priceLabel ?? '',
    tags: item?.tags.join(', ') ?? '',
    body: item?.body.join('\n\n') ?? '',
    gallery: item?.gallery.join('\n') ?? '',
    whatToExpect: ((item?.meta?.whatToExpect as string[]) ?? []).join('\n'),
    featured: item?.featured ?? false,
    published: item?.published ?? true,
    sortOrder: item?.sortOrder ?? 0,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setError(null);
    if (!f.title || !f.slug || !f.excerpt || !f.heroImage) {
      setError('Title, slug, excerpt and hero image are required.');
      return;
    }
    const meta: Record<string, unknown> = { ...(item?.meta ?? {}) };
    if (f.whatToExpect.trim()) meta.whatToExpect = linesToArr(f.whatToExpect);
    else delete meta.whatToExpect;

    const payload: ContentInput = {
      type: config.type,
      slug: f.slug,
      title: f.title,
      category: f.category || null,
      icon: config.hasIcon ? f.icon || null : null,
      excerpt: f.excerpt,
      body: parasToArr(f.body || f.excerpt),
      heroImage: f.heroImage,
      gallery: linesToArr(f.gallery),
      tags: commaToArr(f.tags),
      priceLabel: config.hasPrice ? f.priceLabel || null : null,
      meta,
      featured: f.featured,
      published: f.published,
      sortOrder: Number(f.sortOrder) || 0,
    };

    try {
      if (isEdit && item) await updateMut.mutateAsync({ id: item.id, input: payload });
      else await createMut.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save'));
    }
  }

  // Construct a preview object for DiningCard
  const previewItem: ApiContent = {
    id: 'preview',
    type: config.type as 'AMENITY' | 'DINING' | 'EVENT' | 'OFFER',
    slug: f.slug || 'preview',
    title: f.title || 'Preview Title',
    category: f.category || null,
    icon: f.icon || null,
    excerpt: f.excerpt || 'This is how your excerpt will look...',
    body: [],
    heroImage: f.heroImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    gallery: [],
    tags: commaToArr(f.tags),
    priceLabel: f.priceLabel || null,
    meta: {},
    featured: f.featured,
    sortOrder: 0
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? `Edit ${config.singular}` : `New ${config.singular}`}
      width="max-w-4xl" // Increased width to fit preview side-by-side
    >
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Form Column */}
        <div className="flex-1 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                value={f.title}
                onChange={(e) => set('title', e.target.value)}
                onBlur={() => !isEdit && f.title && !f.slug && set('slug', slugify(f.title))}
                className={inputCls}
              />
            </Field>
            <Field label="Slug">
              <input value={f.slug} onChange={(e) => set('slug', e.target.value)} className={inputCls} placeholder="swimming-pool" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category">
              <input value={f.category} onChange={(e) => set('category', e.target.value)} className={inputCls} placeholder="Wellness" />
            </Field>
            {config.hasIcon && (
              <Field label="Icon name">
                <input value={f.icon} onChange={(e) => set('icon', e.target.value)} className={inputCls} placeholder="pool" />
              </Field>
            )}
            {config.hasPrice && (
              <Field label="Price label">
                <input value={f.priceLabel} onChange={(e) => set('priceLabel', e.target.value)} className={inputCls} placeholder="₹650" />
              </Field>
            )}
            <Field label="Sort order">
              <input type="number" value={f.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className={inputCls} />
            </Field>
          </div>

          <Field label="Excerpt">
            <input value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={inputCls} />
          </Field>

          <Field label="Hero image URL">
            <input value={f.heroImage} onChange={(e) => set('heroImage', e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>

          <Field label="Tags (comma separated)">
            <input value={f.tags} onChange={(e) => set('tags', e.target.value)} className={inputCls} placeholder="Veg, Signature" />
          </Field>

          <Field label="Body (separate paragraphs with a blank line)">
            <textarea value={f.body} onChange={(e) => set('body', e.target.value)} rows={4} className={inputCls} />
          </Field>

          <Field label="Gallery image URLs (one per line)">
            <textarea value={f.gallery} onChange={(e) => set('gallery', e.target.value)} rows={3} className={inputCls} />
          </Field>

          <Field label="What to expect (one per line — shown on detail pages)">
            <textarea value={f.whatToExpect} onChange={(e) => set('whatToExpect', e.target.value)} rows={3} className={inputCls} />
          </Field>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} className="h-4 w-4 accent-forest" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} className="h-4 w-4 accent-forest" />
              Published
            </label>
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <AdminButton variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton onClick={submit} loading={createMut.isPending || updateMut.isPending}>
              {isEdit ? 'Save changes' : `Create ${config.singular}`}
            </AdminButton>
          </div>
        </div>

        {/* Live Preview Column (Only for DINING) */}
        {config.type === 'DINING' && (
          <div className="hidden lg:block w-[340px] shrink-0">
            <div className="sticky top-6">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Live Preview</p>
              <DiningCard item={previewItem} />
              <p className="text-xs text-muted mt-3 text-center">
                This is exactly how it will appear on the public Home page.
              </p>
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
