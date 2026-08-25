import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { ErrorState, LoadingState } from '../components/ui/DataState';
import { useSaveSettings, useSettings } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';

interface SettingsForm {
  gstPercent: number;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
}

export default function Settings() {
  const { data, isLoading, isError, refetch } = useSettings();
  const saveMut = useSaveSettings();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data as unknown as SettingsForm);
  }, [data, form]);

  const set = <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    if (!form) return;
    setError(null);
    setSaved(false);
    try {
      await saveMut.mutateAsync({ ...form, gstPercent: Number(form.gstPercent) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save settings'));
    }
  }

  if (isLoading || !form) return <LoadingState label="Loading settings…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Taxes and site configuration used across the booking flow and public site."
        actions={
          <AdminButton onClick={save} loading={saveMut.isPending}>
            Save changes
          </AdminButton>
        }
      />

      <div className="max-w-3xl space-y-8">
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-serif text-lg text-ink">Taxes & booking</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GST / tax (%)" hint="Applied to the booking subtotal at checkout.">
              <input type="number" value={form.gstPercent} onChange={(e) => set('gstPercent', Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Currency">
              <input value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Check-in time">
              <input type="time" value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Check-out time">
              <input type="time" value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-serif text-lg text-ink">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact email">
              <input value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Contact phone">
              <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className={inputCls} />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </section>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Settings saved.</p>}
      </div>
    </div>
  );
}
