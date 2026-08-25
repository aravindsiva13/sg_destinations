import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import { formatDate, inr } from '../constants';
import type { Coupon, CouponKind } from '../types';

function effect(c: Coupon) {
  if (c.kind === 'FLAT') return `${inr(c.value)} off`;
  return `${c.value}% off${c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ''}`;
}

export default function Coupons() {
  const { data, isLoading, isError, refetch } = useCoupons();
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const deleteMut = useDeleteCoupon();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    code: '',
    description: '',
    kind: 'PERCENT' as CouponKind,
    value: 10,
    minAmount: 0,
    maxDiscount: '',
    usageLimit: '',
    endDate: '',
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setError(null);
    if (!f.code.trim()) {
      setError('A code is required.');
      return;
    }
    try {
      await createMut.mutateAsync({
        code: f.code.trim().toUpperCase(),
        description: f.description || null,
        kind: f.kind,
        value: Number(f.value),
        minAmount: Number(f.minAmount) || 0,
        maxDiscount: f.maxDiscount ? Number(f.maxDiscount) : null,
        usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
        startDate: null,
        endDate: f.endDate || null,
        active: true,
      });
      setShowForm(false);
      setF((p) => ({ ...p, code: '', description: '' }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save coupon'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Promo codes applied at checkout."
        actions={
          <AdminButton variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New coupon'}
          </AdminButton>
        }
      />

      {showForm && (
        <div className="mb-6 grid gap-3 rounded-xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Code">
            <input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className={`${inputCls} font-mono`} placeholder="WELCOME10" />
          </Field>
          <Field label="Description">
            <input value={f.description} onChange={(e) => set('description', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={f.kind} onChange={(e) => set('kind', e.target.value as CouponKind)} className={inputCls}>
              <option value="PERCENT">Percent</option>
              <option value="FLAT">Flat ₹</option>
            </select>
          </Field>
          <Field label={f.kind === 'PERCENT' ? 'Value (%)' : 'Value (₹)'}>
            <input type="number" value={f.value} onChange={(e) => set('value', Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Min amount (₹)">
            <input type="number" value={f.minAmount} onChange={(e) => set('minAmount', Number(e.target.value))} className={inputCls} />
          </Field>
          {f.kind === 'PERCENT' && (
            <Field label="Max discount (₹)">
              <input type="number" value={f.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} className={inputCls} placeholder="optional" />
            </Field>
          )}
          <Field label="Usage limit">
            <input type="number" value={f.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} className={inputCls} placeholder="optional" />
          </Field>
          <Field label="Expires">
            <input type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <AdminButton onClick={submit} loading={createMut.isPending} className="w-full">
              Save coupon
            </AdminButton>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-4">{error}</p>}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading coupons…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No coupons yet" description="Create a promo code above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream/60 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Effect</th>
                  <th className="px-4 py-3">Min spend</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-ink">{c.code}</span>
                      {c.description && <p className="text-xs text-muted">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink">{effect(c)}</td>
                    <td className="px-4 py-3 text-muted">{c.minAmount ? inr(c.minAmount) : '—'}</td>
                    <td className="px-4 py-3 text-muted">
                      {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-muted">{c.endDate ? formatDate(c.endDate) : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updateMut.mutate(
                            { id: c.id, input: { active: !c.active } },
                            { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update coupon')) },
                          )
                        }
                        className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                          c.active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-200 text-slate-600 ring-slate-300'
                        }`}
                      >
                        {c.active ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          window.confirm(`Delete ${c.code}?`) &&
                          deleteMut.mutate(c.id, {
                            onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete coupon')),
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
