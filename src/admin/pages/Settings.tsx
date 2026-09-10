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

  // Social & Maps
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tripadvisorUrl?: string;
  googleMapsUrl?: string;
  googleMapsEmbed?: string;
  footerTagline?: string;
}

type TabKey = 'booking' | 'contact' | 'social';

export default function Settings() {
  const { data, isLoading, isError, refetch } = useSettings();
  const saveMut = useSaveSettings();
  const [activeTab, setActiveTab] = useState<TabKey>('booking');
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
        subtitle="Taxes, contact info, social links, and Google Maps configuration used across the website."
        actions={
          <AdminButton onClick={save} loading={saveMut.isPending}>
            Save changes
          </AdminButton>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('booking')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'booking'
              ? 'bg-forest text-cream shadow-xs'
              : 'bg-paper text-ink hover:bg-cream-2'
          }`}
        >
          Taxes & Booking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'contact'
              ? 'bg-forest text-cream shadow-xs'
              : 'bg-paper text-ink hover:bg-cream-2'
          }`}
        >
          Contact & Location
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === 'social'
              ? 'bg-forest text-cream shadow-xs'
              : 'bg-paper text-ink hover:bg-cream-2'
          }`}
        >
          Social Media & Branding
        </button>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Tab 1: Taxes & Booking */}
        {activeTab === 'booking' && (
          <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs">
            <h2 className="mb-1 font-serif text-lg font-medium text-ink">Taxes & Booking Rules</h2>
            <p className="mb-4 text-xs text-muted">Applied automatically across the guest booking checkout flow.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="GST / Tax (%)" hint="Applied to the booking subtotal at checkout.">
                <input
                  type="number"
                  value={form.gstPercent}
                  onChange={(e) => set('gstPercent', Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
              <Field label="Currency Code" hint="Display currency (INR, USD, etc.)">
                <input
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Standard Check-in Time" hint="24-hour format (e.g. 14:00)">
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(e) => set('checkInTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Standard Check-out Time" hint="24-hour format (e.g. 11:00)">
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(e) => set('checkOutTime', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>
        )}

        {/* Tab 2: Contact & Location */}
        {activeTab === 'contact' && (
          <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="mb-1 font-serif text-lg font-medium text-ink">Contact & Physical Location</h2>
              <p className="text-xs text-muted">Displayed across header phone buttons, contact enquiry cards, and the website footer.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact Email" hint="Public inquiries email">
                <input
                  type="email"
                  value={form.contactEmail || ''}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Contact Phone" hint="Calls from header & call button">
                <input
                  value={form.contactPhone || ''}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="WhatsApp Number" hint="With country code (e.g. +91 98941 99762)">
                <input
                  value={form.whatsapp || ''}
                  onChange={(e) => set('whatsapp', e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Physical Address" hint="Full street address in footer & map">
                <input
                  value={form.address || ''}
                  onChange={(e) => set('address', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="border-t border-line pt-4 space-y-4">
              <h3 className="font-serif text-base font-medium text-ink">Google Maps Integration</h3>
              <Field label="Google Maps Directions URL" hint="Opens when users click on the address or directions link">
                <input
                  value={form.googleMapsUrl || ''}
                  onChange={(e) => set('googleMapsUrl', e.target.value)}
                  placeholder="https://maps.google.com/?q=Shraddha+Garden+Resort"
                  className={inputCls}
                />
              </Field>
              <Field label="Google Maps Embed Iframe URL" hint="Embed URL from Google Maps (Share -> Embed a map -> src URL)">
                <input
                  value={form.googleMapsEmbed || ''}
                  onChange={(e) => set('googleMapsEmbed', e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className={inputCls}
                />
              </Field>
            </div>
          </section>
        )}

        {/* Tab 3: Social Media & Branding */}
        {activeTab === 'social' && (
          <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="mb-1 font-serif text-lg font-medium text-ink">Social Media & Public Branding</h2>
              <p className="text-xs text-muted">Links displayed in the website footer and social share menus.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instagram Profile URL">
                <input
                  value={form.instagramUrl || ''}
                  onChange={(e) => set('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/shraddhagarden"
                  className={inputCls}
                />
              </Field>
              <Field label="Facebook Page URL">
                <input
                  value={form.facebookUrl || ''}
                  onChange={(e) => set('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/shraddhagarden"
                  className={inputCls}
                />
              </Field>
              <Field label="YouTube Channel URL">
                <input
                  value={form.youtubeUrl || ''}
                  onChange={(e) => set('youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/@shraddhagarden"
                  className={inputCls}
                />
              </Field>
              <Field label="TripAdvisor URL">
                <input
                  value={form.tripadvisorUrl || ''}
                  onChange={(e) => set('tripadvisorUrl', e.target.value)}
                  placeholder="https://tripadvisor.com/..."
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="border-t border-line pt-4">
              <Field label="Footer Brand Tagline" hint="Displayed under the logo in the website footer">
                <textarea
                  rows={2}
                  value={form.footerTagline || ''}
                  onChange={(e) => set('footerTagline', e.target.value)}
                  placeholder="A sanctuary of celebration and stays, where memories unfold amidst forty acres of lush greenery."
                  className={inputCls}
                />
              </Field>
            </div>
          </section>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Settings saved successfully.</p>}

        <div className="flex justify-end pt-2">
          <AdminButton onClick={save} loading={saveMut.isPending}>
            Save changes
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
