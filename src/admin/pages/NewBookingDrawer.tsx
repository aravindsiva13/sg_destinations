import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Drawer from '../components/ui/Drawer';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { LoadingState } from '../components/ui/DataState';
import { useCreateBooking, useStays } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { inr } from '../constants';

const schema = z
  .object({
    customerName: z.string().min(1, 'Guest name is required'),
    customerEmail: z.string().email('Valid email required'),
    customerPhone: z.string().optional(),
    checkIn: z.string().min(1, 'Check-in date required'),
    checkOut: z.string().min(1, 'Check-out date required'),
    guests: z.coerce.number().int().positive(),
    source: z.string().min(1),
    notes: z.string().optional(),
    customPrice: z.boolean().optional(),
    amount: z.coerce.number().int().min(0).optional(),
  })
  .refine((v) => new Date(v.checkOut) > new Date(v.checkIn), {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });
type FormValues = z.infer<typeof schema>;

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export interface BookingPrefill {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  guests?: number;
  source?: string;
  notes?: string;
}

export default function NewBookingDrawer({
  onClose,
  prefill,
}: {
  onClose: () => void;
  prefill?: BookingPrefill;
}) {
  const { data: stays, isLoading } = useStays();
  const createMut = useCreateBooking();
  const [error, setError] = useState<string | null>(null);
  // Multiple stays can be booked at once — one booking is created per stay.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: prefill?.customerName ?? '',
      customerEmail: prefill?.customerEmail ?? '',
      customerPhone: prefill?.customerPhone ?? '',
      checkIn: today,
      checkOut: tomorrow,
      guests: prefill?.guests ?? 2,
      source: prefill?.source ?? 'Phone',
      notes: prefill?.notes ?? '',
      customPrice: false,
    },
  });

  const [checkIn, checkOut, customPrice, amount] = watch(['checkIn', 'checkOut', 'customPrice', 'amount']);
  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000))
      : 0;

  const allStays = stays ?? [];
  const selectedStays = allStays.filter((s) => selectedIds.includes(s.id));
  const allSelected = allStays.length > 0 && selectedIds.length === allStays.length;
  const multi = selectedIds.length > 1;

  const toggleStay = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () => setSelectedIds(allSelected ? [] : allStays.map((s) => s.id));

  // Per-stay amount = custom value (applied to each) or nights × that stay's rate.
  const perStayAmount = (rate: number) =>
    customPrice ? Number(amount) || 0 : nights * rate;
  const computedTotal = selectedStays.reduce((sum, s) => sum + perStayAmount(s.pricePerNight), 0);

  async function onSubmit(values: FormValues) {
    setError(null);
    if (selectedIds.length === 0) {
      setError('Select at least one stay.');
      return;
    }
    try {
      // Create one booking per selected stay (shared guest, dates and price rule).
      for (const stay of selectedStays) {
        await createMut.mutateAsync({
          stayId: stay.id,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone || undefined,
          checkIn: new Date(values.checkIn).toISOString(),
          checkOut: new Date(values.checkOut).toISOString(),
          guests: values.guests,
          source: values.source,
          notes: values.notes || undefined,
          amount: values.customPrice ? Number(values.amount) || 0 : undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the booking'));
    }
  }

  return (
    <Drawer open onClose={onClose} title="New booking" width="max-w-xl">
      {isLoading ? (
        <LoadingState label="Loading stays…" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Multi-select stays */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                Stays{' '}
                <span className="text-muted">
                  ({selectedIds.length} selected)
                </span>
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-forest hover:underline"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-line bg-paper p-1.5">
              {allStays.map((s) => {
                const on = selectedIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      on ? 'bg-forest/10' : 'hover:bg-cream'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleStay(s.id)}
                        className="h-4 w-4 accent-forest"
                      />
                      <span className="text-ink">{s.name}</span>
                    </span>
                    <span className="text-muted">{inr(s.pricePerNight)}/night</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guest name" error={errors.customerName?.message}>
              <input {...register('customerName')} className={inputCls} />
            </Field>
            <Field label="Email" error={errors.customerEmail?.message}>
              <input {...register('customerEmail')} className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={errors.customerPhone?.message}>
              <input {...register('customerPhone')} className={inputCls} placeholder="+91 …" />
            </Field>
            <Field label="Guests" error={errors.guests?.message} hint="Any number — no capacity limit.">
              <input type="number" min={1} {...register('guests')} className={inputCls} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check-in" error={errors.checkIn?.message}>
              <input type="date" {...register('checkIn')} className={inputCls} />
            </Field>
            <Field label="Check-out" error={errors.checkOut?.message}>
              <input type="date" {...register('checkOut')} className={inputCls} />
            </Field>
          </div>

          <Field label="Source" error={errors.source?.message}>
            <select {...register('source')} className={inputCls}>
              <option>Phone</option>
              <option>Walk-in</option>
              <option>Website</option>
              <option>OTA</option>
            </select>
          </Field>

          <Field label="Notes (optional)">
            <textarea {...register('notes')} rows={2} className={inputCls} />
          </Field>

          {/* Live price preview + custom-price override */}
          <div className="rounded-xl border border-line bg-paper px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                {selectedIds.length === 0
                  ? 'Select one or more stays'
                  : `${selectedIds.length} stay${multi ? 's' : ''} × ${nights} night${nights === 1 ? '' : 's'}`}
              </span>
              <span className="font-serif text-lg text-ink">{inr(computedTotal)}</span>
            </div>
            {multi && (
              <p className="mt-1 text-xs text-muted">
                Creates {selectedIds.length} bookings — one per stay, each for {watch('guests') || 0} guest
                {Number(watch('guests')) === 1 ? '' : 's'}.
              </p>
            )}

            <label className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-sm text-ink">
              <input type="checkbox" {...register('customPrice')} className="h-4 w-4 accent-forest" />
              Set a custom price {multi ? '(per stay)' : '(override the calculated total)'}
            </label>
            {customPrice && (
              <div className="mt-2">
                <Field label={multi ? 'Custom price per stay (₹)' : 'Custom total (₹)'} error={errors.amount?.message}>
                  <input type="number" min={0} {...register('amount')} className={inputCls} placeholder="e.g. 25000" />
                </Field>
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <AdminButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSubmitting || createMut.isPending}>
              {multi ? `Create ${selectedIds.length} bookings` : 'Create booking'}
            </AdminButton>
          </div>
        </form>
      )}
    </Drawer>
  );
}
