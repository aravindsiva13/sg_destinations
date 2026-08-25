import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import {
  useCampaigns,
  useCreateCampaign,
  useSendCampaign,
  useSubscribers,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { formatDate } from '../constants';
import type { Campaign } from '../types';

const STATUS_TONE: Record<Campaign['status'], 'slate' | 'amber' | 'green' | 'red'> = {
  DRAFT: 'slate',
  SENDING: 'amber',
  SENT: 'green',
  FAILED: 'red',
};

const empty = { subject: '', heading: '', body: '', ctaLabel: '', ctaHref: '' };

export default function Campaigns() {
  const subs = useSubscribers();
  const { data: campaigns, isLoading, isError, refetch } = useCampaigns();
  const createMut = useCreateCampaign();
  const sendMut = useSendCampaign();
  const [f, setF] = useState({ ...empty });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(send: boolean) {
    setError(null);
    setNotice(null);
    if (!f.subject.trim() || !f.body.trim()) {
      setError('Subject and body are required.');
      return;
    }
    try {
      const res = await createMut.mutateAsync({
        subject: f.subject.trim(),
        heading: f.heading || undefined,
        body: f.body,
        ctaLabel: f.ctaLabel || undefined,
        ctaHref: f.ctaHref || undefined,
        send,
      });
      setF({ ...empty });
      setNotice(send ? `Campaign sent to ${res.sent ?? 0} of ${res.total ?? 0} subscribers.` : 'Draft saved.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the campaign'));
    }
  }

  async function sendExisting(id: string) {
    if (!window.confirm('Send this campaign to all active subscribers now?')) return;
    setError(null);
    setNotice(null);
    try {
      const res = await sendMut.mutateAsync(id);
      setNotice(`Sent to ${res.sent} of ${res.total} subscribers.`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send'));
    }
  }

  return (
    <div>
      <PageHeader
        title="Email Campaigns"
        subtitle={
          subs.data
            ? `${subs.data.active} active subscriber${subs.data.active === 1 ? '' : 's'} · ${subs.data.total} total`
            : 'Promotional emails to your subscribers.'
        }
      />

      {/* Composer */}
      <div className="mb-6 grid gap-3 rounded-xl border border-line bg-paper p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject">
            <input value={f.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls} placeholder="Monsoon escape — 20% off" />
          </Field>
          <Field label="Heading (optional)">
            <input value={f.heading} onChange={(e) => set('heading', e.target.value)} className={inputCls} placeholder="Defaults to the subject" />
          </Field>
        </div>
        <Field label="Body" hint="Separate paragraphs with a blank line.">
          <textarea value={f.body} onChange={(e) => set('body', e.target.value)} rows={5} className={inputCls} placeholder="Write your announcement…" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Button label (optional)">
            <input value={f.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} className={inputCls} placeholder="View offers" />
          </Field>
          <Field label="Button link (optional)">
            <input value={f.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} className={inputCls} placeholder="https://…/offers" />
          </Field>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

        <div className="flex justify-end gap-2">
          <AdminButton variant="secondary" onClick={() => submit(false)} loading={createMut.isPending}>
            Save draft
          </AdminButton>
          <AdminButton onClick={() => submit(true)} loading={createMut.isPending}>
            Send to {subs.data?.active ?? 0} subscribers
          </AdminButton>
        </div>
      </div>

      {/* History */}
      {isLoading ? (
        <LoadingState label="Loading campaigns…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" description="Compose and send your first promotional email above." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream/60 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{c.subject}</span>
                      {c.trigger !== 'manual' && <span className="ml-2 text-xs text-muted">({c.trigger})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.status === 'SENT' || c.status === 'FAILED' ? `${c.sentCount} / ${c.recipientCount}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'DRAFT' && (
                        <button onClick={() => sendExisting(c.id)} className="text-xs text-forest hover:underline">
                          Send now
                        </button>
                      )}
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
