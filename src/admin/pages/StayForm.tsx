import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Drawer from '../components/ui/Drawer';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { useCreateStay, useUpdateStay, type StayInput } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import type { Stay } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  badge: z.string().optional(),
  pricePerNight: z.coerce.number().int().positive('Must be a positive number'),
  rating: z.coerce.number().min(0).max(5),
  capacity: z.coerce.number().int().positive(),
  inventory: z.coerce.number().int().min(0),
  beds: z.string().min(1),
  shortIntro: z.string().min(1, 'A short intro is required'),
  heroImage: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  gallery: z.string().optional(),
  amenities: z.string().optional(),
  featured: z.boolean(),
  published: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const linesToArray = (s?: string) =>
  (s ?? '').split('\n').map((l) => l.trim()).filter(Boolean);

const parasToArray = (s?: string) =>
  (s ?? '').split(/\n\s*\n/).map((l) => l.trim()).filter(Boolean);

const amenitiesToArray = (s?: string) =>
  linesToArray(s).map((line) => {
    const [label, icon] = line.split('|').map((p) => p.trim());
    return { label, icon: icon || 'check' };
  });

export default function StayForm({
  stay,
  onClose,
}: {
  stay: Stay | null; // null => create
  onClose: () => void;
}) {
  const isEdit = Boolean(stay);
  const createMut = useCreateStay();
  const updateMut = useUpdateStay();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: stay
      ? {
          name: stay.name,
          slug: stay.slug,
          badge: stay.badge ?? '',
          pricePerNight: stay.pricePerNight,
          rating: stay.rating,
          capacity: stay.capacity,
          inventory: stay.inventory,
          beds: stay.beds,
          shortIntro: stay.shortIntro,
          heroImage: stay.heroImage,
          description: stay.description.join('\n\n'),
          gallery: stay.gallery.join('\n'),
          amenities: stay.amenities.map((a) => `${a.label}|${a.icon}`).join('\n'),
          featured: stay.featured,
          published: stay.published,
        }
      : {
          name: '',
          slug: '',
          badge: '',
          pricePerNight: 15000,
          rating: 4.8,
          capacity: 2,
          inventory: 1,
          beds: '1 Double Bed',
          shortIntro: '',
          heroImage: '',
          description: '',
          gallery: '',
          amenities: 'Air Conditioning|snow\nDouble Bed|bed\nWi-Fi|wifi',
          featured: false,
          published: true,
        },
  });

  const nameValue = watch('name');

  async function onSubmit(values: FormValues) {
    setError(null);
    const payload: StayInput = {
      name: values.name,
      slug: values.slug,
      badge: values.badge || null,
      pricePerNight: values.pricePerNight,
      rating: values.rating,
      capacity: values.capacity,
      inventory: values.inventory,
      beds: values.beds,
      shortIntro: values.shortIntro,
      heroImage: values.heroImage,
      description: parasToArray(values.description),
      gallery: linesToArray(values.gallery),
      amenities: amenitiesToArray(values.amenities),
      featured: values.featured,
      published: values.published,
    };

    try {
      if (isEdit && stay) {
        await updateMut.mutateAsync({ id: stay.id, input: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the stay'));
    }
  }

  return (
    <Drawer open onClose={onClose} title={isEdit ? `Edit ${stay!.name}` : 'New stay'} width="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register('name')}
              onBlur={() => {
                if (!isEdit && nameValue) setValue('slug', slugify(nameValue));
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Slug" error={errors.slug?.message}>
            <input {...register('slug')} className={inputCls} placeholder="wood-house" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price / night (₹)" error={errors.pricePerNight?.message}>
            <input type="number" {...register('pricePerNight')} className={inputCls} />
          </Field>
          <Field label="Rating" error={errors.rating?.message}>
            <input type="number" step="0.1" {...register('rating')} className={inputCls} />
          </Field>
          <Field label="Inventory" error={errors.inventory?.message}>
            <input type="number" {...register('inventory')} className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Capacity" error={errors.capacity?.message}>
            <input type="number" {...register('capacity')} className={inputCls} />
          </Field>
          <Field label="Beds" error={errors.beds?.message}>
            <input {...register('beds')} className={inputCls} />
          </Field>
          <Field label="Badge" error={errors.badge?.message}>
            <input {...register('badge')} className={inputCls} placeholder="Couple's Favourite" />
          </Field>
        </div>

        <Field label="Short intro" error={errors.shortIntro?.message}>
          <input {...register('shortIntro')} className={inputCls} />
        </Field>

        <Field label="Hero image URL" error={errors.heroImage?.message}>
          <input {...register('heroImage')} className={inputCls} placeholder="https://…" />
        </Field>

        <Field label="Description (separate paragraphs with a blank line)">
          <textarea {...register('description')} rows={4} className={inputCls} />
        </Field>

        <Field label="Gallery image URLs (one per line)">
          <textarea {...register('gallery')} rows={3} className={inputCls} />
        </Field>

        <Field label="Amenities (one per line, format: Label|icon)">
          <textarea {...register('amenities')} rows={3} className={`${inputCls} font-mono text-xs`} />
        </Field>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" {...register('featured')} className="h-4 w-4 accent-forest" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" {...register('published')} className="h-4 w-4 accent-forest" />
            Published
          </label>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create stay'}
          </AdminButton>
        </div>
      </form>
    </Drawer>
  );
}
