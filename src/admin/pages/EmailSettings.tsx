import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { ErrorState, LoadingState } from '../components/ui/DataState';
import { useEmailConfig, useSaveEmailConfig, useSendTestEmail } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { EmailConfig, EmailEvents } from '../types';

const GUEST_EVENTS: { key: keyof EmailEvents; label: string }[] = [
  { key: 'enquiryAck', label: 'Enquiry acknowledgement' },
  { key: 'bookingReceived', label: 'Booking received (pending payment)' },
  { key: 'bookingConfirmed', label: 'Booking confirmed + receipt' },
  { key: 'bookingCancelled', label: 'Booking cancelled' },
  { key: 'checkInReminder', label: 'Check-in reminder (day before)' },
  { key: 'reviewRequest', label: 'Post-stay review request' },
];
const STAFF_EVENTS: { key: keyof EmailEvents; label: string }[] = [
  { key: 'staffNewBooking', label: 'New booking alert' },
  { key: 'staffNewEnquiry', label: 'New enquiry alert' },
  { key: 'staffNewReview', label: 'New review alert' },
];
const MARKETING_EVENTS: { key: keyof EmailEvents; label: string }[] = [
  { key: 'promoOnNewOffer', label: 'Auto-email subscribers when a new offer is published' },
];

function EmailForm({ config }: { config: EmailConfig }) {
  const { hasRole } = useAdminAuth();
  const canSave = hasRole('SUPER_ADMIN');
  const saveMut = useSaveEmailConfig();
  const testMut = useSendTestEmail();
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [testTo, setTestTo] = useState('');

  const [f, setF] = useState({
    enabled: config.enabled,
    provider: config.provider,
    apiKey: '',
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyTo: config.replyTo,
    staffRecipients: config.staffRecipients.join(', '),
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpUser: config.smtpUser,
    smtpSecure: config.smtpSecure,
    events: { ...config.events },
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggleEvent = (k: keyof EmailEvents) => setF((p) => ({ ...p, events: { ...p.events, [k]: !p.events[k] } }));

  async function save() {
    setMsg(null);
    try {
      const input: Record<string, unknown> = {
        enabled: f.enabled,
        provider: f.provider,
        fromName: f.fromName,
        fromEmail: f.fromEmail,
        replyTo: f.replyTo,
        staffRecipients: f.staffRecipients.split(',').map((s) => s.trim()).filter(Boolean),
        smtpHost: f.smtpHost,
        smtpPort: Number(f.smtpPort) || 587,
        smtpUser: f.smtpUser,
        smtpSecure: f.smtpSecure,
        events: f.events,
      };
      if (f.apiKey.trim()) input.apiKey = f.apiKey.trim();
      await saveMut.mutateAsync(input);
      setF((p) => ({ ...p, apiKey: '' }));
      setMsg({ tone: 'ok', text: 'Settings saved.' });
    } catch (err) {
      setMsg({ tone: 'err', text: apiErrorMessage(err, 'Could not save') });
    }
  }

  async function sendTest() {
    setMsg(null);
    if (!testTo.trim()) return setMsg({ tone: 'err', text: 'Enter an address to send the test to.' });
    try {
      await testMut.mutateAsync(testTo.trim());
      setMsg({ tone: 'ok', text: `Test email sent to ${testTo.trim()}. Check the inbox (and spam).` });
    } catch (err) {
      setMsg({ tone: 'err', text: apiErrorMessage(err, 'Test failed — check your API key and From address.') });
    }
  }

  const secretPlaceholder = config.apiKeySet ? '•••••••• (saved — leave blank to keep)' : 'Paste your Brevo API key / SMTP password';

  return (
    <div className="max-w-2xl space-y-8">
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {msg.text}
        </p>
      )}

      {/* Master switch */}
      <label className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3">
        <input type="checkbox" checked={f.enabled} onChange={(e) => set('enabled', e.target.checked)} className="h-4 w-4 accent-forest" />
        <span className="text-sm font-medium text-ink">Send emails {f.enabled ? '(on)' : '(off)'}</span>
      </label>

      {/* Provider + credentials */}
      <section className="space-y-4 rounded-xl border border-line bg-paper p-5">
        <h3 className="font-serif text-lg text-ink">Provider</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sending method">
            <select value={f.provider} onChange={(e) => set('provider', e.target.value as 'brevo' | 'smtp')} className={inputCls}>
              <option value="brevo">Brevo (API)</option>
              <option value="smtp">SMTP (Gmail, Brevo SMTP, other)</option>
            </select>
          </Field>
          <Field label={f.provider === 'brevo' ? 'Brevo API key' : 'SMTP password'} hint="Stored securely — never shown again.">
            <input type="password" value={f.apiKey} onChange={(e) => set('apiKey', e.target.value)} className={inputCls} placeholder={secretPlaceholder} />
          </Field>
        </div>
        {f.provider === 'smtp' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="SMTP host"><input value={f.smtpHost} onChange={(e) => set('smtpHost', e.target.value)} className={inputCls} /></Field>
            <Field label="Port"><input type="number" value={f.smtpPort} onChange={(e) => set('smtpPort', Number(e.target.value))} className={inputCls} /></Field>
            <Field label="SMTP user"><input value={f.smtpUser} onChange={(e) => set('smtpUser', e.target.value)} className={inputCls} /></Field>
          </div>
        )}
      </section>

      {/* Addresses */}
      <section className="space-y-4 rounded-xl border border-line bg-paper p-5">
        <h3 className="font-serif text-lg text-ink">Addresses</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From name"><input value={f.fromName} onChange={(e) => set('fromName', e.target.value)} className={inputCls} placeholder="Shraddha Garden Resort" /></Field>
          <Field label="From email" hint="Use an address on your own domain for best delivery."><input value={f.fromEmail} onChange={(e) => set('fromEmail', e.target.value)} className={inputCls} placeholder="bookings@shraddhagarden.com" /></Field>
          <Field label="Reply-to (optional)"><input value={f.replyTo} onChange={(e) => set('replyTo', e.target.value)} className={inputCls} placeholder="frontdesk@shraddhagarden.com" /></Field>
          <Field label="Staff notification emails" hint="Comma-separated — who gets new-booking/enquiry alerts."><input value={f.staffRecipients} onChange={(e) => set('staffRecipients', e.target.value)} className={inputCls} placeholder="owner@…, frontdesk@…" /></Field>
        </div>
      </section>

      {/* Event toggles */}
      <section className="space-y-4 rounded-xl border border-line bg-paper p-5">
        <h3 className="font-serif text-lg text-ink">Which emails to send</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">To guests</p>
            <div className="space-y-2">
              {GUEST_EVENTS.map((e) => (
                <label key={e.key} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={f.events[e.key]} onChange={() => toggleEvent(e.key)} className="h-4 w-4 accent-forest" />
                  {e.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">To staff</p>
            <div className="space-y-2">
              {STAFF_EVENTS.map((e) => (
                <label key={e.key} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={f.events[e.key]} onChange={() => toggleEvent(e.key)} className="h-4 w-4 accent-forest" />
                  {e.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Marketing</p>
          <div className="space-y-2">
            {MARKETING_EVENTS.map((e) => (
              <label key={e.key} className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={f.events[e.key]} onChange={() => toggleEvent(e.key)} className="h-4 w-4 accent-forest" />
                {e.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {canSave && (
        <div className="flex justify-end">
          <AdminButton onClick={save} loading={saveMut.isPending}>Save email settings</AdminButton>
        </div>
      )}

      {/* Test */}
      <section className="space-y-3 rounded-xl border border-dashed border-line bg-cream/40 p-5">
        <h3 className="font-serif text-lg text-ink">Send a test email</h3>
        <p className="text-sm text-muted">Save your settings first, then send yourself a test to confirm everything works.</p>
        <div className="flex flex-wrap gap-2">
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} className={`${inputCls} max-w-xs`} placeholder="you@example.com" />
          <AdminButton variant="secondary" onClick={sendTest} loading={testMut.isPending}>Send test</AdminButton>
        </div>
      </section>
    </div>
  );
}

export default function EmailSettings() {
  const { data, isLoading, isError, refetch } = useEmailConfig();
  return (
    <div>
      <PageHeader title="Email" subtitle="Automatic emails to guests and staff (bookings, enquiries, reminders)." />
      {isLoading ? (
        <LoadingState label="Loading email settings…" />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <EmailForm config={data} />
      )}
    </div>
  );
}
