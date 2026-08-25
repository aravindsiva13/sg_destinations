import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { ErrorState, LoadingState } from '../components/ui/DataState';
import { usePaymentConfig, useSavePaymentConfig } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { RefundPolicy, RefundTier } from '../types';

const METHODS = ['card', 'upi', 'netbanking', 'wallet', 'emi'];

const DEFAULT_POLICY: RefundPolicy = {
  fullRefundWithinHours: 24,
  tiers: [
    { minDaysBefore: 7, refundPercent: 100 },
    { minDaysBefore: 2, refundPercent: 50 },
    { minDaysBefore: 0, refundPercent: 0 },
  ],
};

export default function PaymentSettings() {
  const { hasRole } = useAdminAuth();
  const canEdit = hasRole('SUPER_ADMIN');
  const { data, isLoading, isError, refetch } = usePaymentConfig();
  const saveMut = useSavePaymentConfig();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    provider: 'mock' as 'mock' | 'razorpay',
    testMode: true,
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    methods: [] as string[],
    depositPercent: 0,
    refundPolicy: DEFAULT_POLICY as RefundPolicy,
  });

  useEffect(() => {
    if (data)
      setForm((f) => ({
        ...f,
        provider: data.provider,
        testMode: data.testMode,
        keyId: data.keyId,
        methods: data.methods,
        depositPercent: data.depositPercent,
        refundPolicy: data.refundPolicy ?? DEFAULT_POLICY,
      }));
  }, [data]);

  const setPolicy = (patch: Partial<RefundPolicy>) =>
    setForm((f) => ({ ...f, refundPolicy: { ...f.refundPolicy, ...patch } }));
  const setTier = (i: number, patch: Partial<RefundTier>) =>
    setForm((f) => ({
      ...f,
      refundPolicy: {
        ...f.refundPolicy,
        tiers: f.refundPolicy.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
      },
    }));
  const addTier = () =>
    setForm((f) => ({
      ...f,
      refundPolicy: { ...f.refundPolicy, tiers: [...f.refundPolicy.tiers, { minDaysBefore: 0, refundPercent: 0 }] },
    }));
  const removeTier = (i: number) =>
    setForm((f) => ({
      ...f,
      refundPolicy: { ...f.refundPolicy, tiers: f.refundPolicy.tiers.filter((_, idx) => idx !== i) },
    }));

  if (isLoading) return <LoadingState label="Loading payment settings…" />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  async function save() {
    setError(null);
    setSaved(false);
    try {
      await saveMut.mutateAsync({
        provider: form.provider,
        testMode: form.testMode,
        keyId: form.keyId,
        keySecret: form.keySecret || undefined, // blank keeps existing
        webhookSecret: form.webhookSecret || undefined,
        methods: form.methods,
        depositPercent: Number(form.depositPercent),
        refundPolicy: {
          fullRefundWithinHours: Number(form.refundPolicy.fullRefundWithinHours),
          tiers: form.refundPolicy.tiers.map((t) => ({
            minDaysBefore: Number(t.minDaysBefore),
            refundPercent: Number(t.refundPercent),
          })),
        },
      });
      setForm((f) => ({ ...f, keySecret: '', webhookSecret: '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save'));
    }
  }

  const toggleMethod = (m: string) =>
    setForm((f) => ({ ...f, methods: f.methods.includes(m) ? f.methods.filter((x) => x !== m) : [...f.methods, m] }));

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Gateway, methods, deposit and refund policy for the booking flow."
        actions={canEdit && <AdminButton onClick={save} loading={saveMut.isPending}>Save changes</AdminButton>}
      />

      {!canEdit && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Only a Super Admin can change payment configuration. You have read-only access.
        </p>
      )}

      <div className="max-w-3xl space-y-8">
        <section className="rounded-xl border border-line bg-paper p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink">Gateway</h2>
            <Badge tone={form.testMode ? 'amber' : 'green'}>{form.testMode ? 'Test mode' : 'Live mode'}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <select
                disabled={!canEdit}
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value as 'mock' | 'razorpay' })}
                className={inputCls}
              >
                <option value="mock">Mock (test checkout, no signup)</option>
                <option value="razorpay">Razorpay</option>
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-ink">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={form.testMode}
                onChange={(e) => setForm({ ...form, testMode: e.target.checked })}
                className="h-4 w-4 accent-forest"
              />
              Test mode (use test API keys)
            </label>
          </div>

          {form.provider === 'razorpay' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Key ID" hint="Publishable — sent to the browser checkout.">
                <input disabled={!canEdit} value={form.keyId} onChange={(e) => setForm({ ...form, keyId: e.target.value })} className={`${inputCls} font-mono`} placeholder="rzp_test_…" />
              </Field>
              <Field label="Key Secret" hint={data.keySecretSet ? 'Stored ✓ — leave blank to keep' : 'Not set'}>
                <input disabled={!canEdit} type="password" value={form.keySecret} onChange={(e) => setForm({ ...form, keySecret: e.target.value })} className={inputCls} placeholder={data.keySecretSet ? '••••••••' : 'Enter secret'} />
              </Field>
              <Field label="Webhook Secret" hint={data.webhookSecretSet ? 'Stored ✓ — leave blank to keep' : 'Not set'}>
                <input disabled={!canEdit} type="password" value={form.webhookSecret} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })} className={inputCls} placeholder={data.webhookSecretSet ? '••••••••' : 'whsec_…'} />
              </Field>
              <div className="flex items-end pb-2 text-xs text-muted">
                Webhook URL: <code className="ml-1 rounded bg-cream px-1">/api/payments/webhook</code>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-serif text-lg text-ink">Methods & deposit</h2>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                disabled={!canEdit}
                onClick={() => toggleMethod(m)}
                className={`rounded-full px-3 py-1.5 text-sm capitalize ring-1 ring-inset transition-colors ${
                  form.methods.includes(m) ? 'bg-forest text-cream ring-forest' : 'bg-paper text-ink ring-line hover:bg-cream'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-xs">
            <Field label="Deposit collected now (%)" hint="0 = charge the full amount online.">
              <input disabled={!canEdit} type="number" min={0} max={100} value={form.depositPercent} onChange={(e) => setForm({ ...form, depositPercent: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-1 font-serif text-lg text-ink">Refund policy</h2>
          <p className="mb-4 text-xs text-muted">
            Refunds on cancellation follow these rules. A booking cancelled shortly after it’s made is always
            refunded in full; otherwise the refund depends on how many days remain before check-in.
          </p>

          <div className="max-w-xs">
            <Field label="Full refund if cancelled within (hours of booking)">
              <input
                disabled={!canEdit}
                type="number"
                min={0}
                value={form.refundPolicy.fullRefundWithinHours}
                onChange={(e) => setPolicy({ fullRefundWithinHours: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
          </div>

          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wider text-muted">
            Refund tiers (days before check-in)
          </p>
          <div className="space-y-2">
            {form.refundPolicy.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-muted">≥</span>
                <input
                  disabled={!canEdit}
                  type="number"
                  min={0}
                  value={t.minDaysBefore}
                  onChange={(e) => setTier(i, { minDaysBefore: Number(e.target.value) })}
                  className={`${inputCls} w-24`}
                />
                <span className="text-sm text-muted">days before → refund</span>
                <input
                  disabled={!canEdit}
                  type="number"
                  min={0}
                  max={100}
                  value={t.refundPercent}
                  onChange={(e) => setTier(i, { refundPercent: Number(e.target.value) })}
                  className={`${inputCls} w-24`}
                />
                <span className="text-sm text-muted">%</span>
                {canEdit && form.refundPolicy.tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="ml-1 text-xs text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {canEdit && (
            <button type="button" onClick={addTier} className="mt-3 text-sm text-forest hover:underline">
              + Add tier
            </button>
          )}
          <p className="mt-3 text-xs text-muted">
            The highest matching tier applies. Example: “≥7 days → 100%, ≥2 days → 50%, ≥0 days → 0%”.
          </p>
        </section>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Payment settings saved.</p>}
      </div>
    </div>
  );
}
