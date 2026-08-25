import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/DataState';
import {
  checkAvailability,
  useBlocks,
  useCreateBlock,
  useCreateRateRule,
  useDeleteBlock,
  useDeleteRateRule,
  useRateRules,
  useStays,
  useUpdateRateRule,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { notifyError } from '../lib/notify';
import { formatDate, inr } from '../constants';
import type { AvailabilityResult, RateKind, RateRule } from '../types';

const today = new Date().toISOString().slice(0, 10);
const plus = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function ruleEffect(r: Pick<RateRule, 'kind' | 'amount'>): string {
  if (r.kind === 'FIXED') return `${inr(r.amount)}/night`;
  if (r.kind === 'DELTA') return `${r.amount >= 0 ? '+' : ''}${inr(r.amount)}/night`;
  const pct = r.amount - 100;
  return `${pct >= 0 ? '+' : ''}${pct}% of base`;
}

export default function AvailabilityPricing() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Availability & Pricing"
        subtitle="Seasonal rates, minimum-stay rules and blocked dates feed the booking engine."
      />
      <AvailabilityChecker />
      <RateRulesSection />
      <BlocksSection />
    </div>
  );
}

/* ----------------------------- Availability checker ----------------------------- */
function AvailabilityChecker() {
  const [range, setRange] = useState({ checkIn: plus(1), checkOut: plus(3), guests: 2 });
  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setResults(await checkAvailability(range));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not check availability'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-paper p-5">
      <h2 className="mb-4 font-serif text-lg text-ink">Availability checker</h2>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Check-in">
          <input
            type="date"
            value={range.checkIn}
            min={today}
            onChange={(e) => setRange((r) => ({ ...r, checkIn: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Check-out">
          <input
            type="date"
            value={range.checkOut}
            min={range.checkIn}
            onChange={(e) => setRange((r) => ({ ...r, checkOut: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label="Guests">
          <input
            type="number"
            min={1}
            value={range.guests}
            onChange={(e) => setRange((r) => ({ ...r, guests: Number(e.target.value) }))}
            className={`${inputCls} w-24`}
          />
        </Field>
        <AdminButton onClick={run} loading={loading}>
          Check
        </AdminButton>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {results && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div
              key={r.stay.id}
              className={`rounded-xl border p-4 ${
                r.available ? 'border-line bg-cream/40' : 'border-rose-200 bg-rose-50/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ink">{r.stay.name}</h3>
                {r.available ? (
                  <Badge tone="green">{r.unitsLeft} left</Badge>
                ) : (
                  <Badge tone="red">Unavailable</Badge>
                )}
              </div>
              {r.available ? (
                <p className="mt-2 text-sm text-muted">
                  {r.nights} night{r.nights === 1 ? '' : 's'} ·{' '}
                  <span className="font-serif text-base text-ink">{inr(r.subtotal)}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-rose-700">{r.unavailableReason}</p>
              )}
              {r.perNight.some((n) => n.ruleName) && (
                <p className="mt-1 text-xs text-terracotta">
                  {[...new Set(r.perNight.map((n) => n.ruleName).filter(Boolean))].join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------- Rate rules ------------------------------- */
function RateRulesSection() {
  const { data, isLoading, isError, refetch } = useRateRules();
  const { data: stays } = useStays();
  const createMut = useCreateRateRule();
  const updateMut = useUpdateRateRule();
  const deleteMut = useDeleteRateRule();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    stayId: '',
    startDate: plus(1),
    endDate: plus(8),
    kind: 'PERCENT' as RateKind,
    amount: 120,
    minStay: 1,
    priority: 0,
  });
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      await createMut.mutateAsync({ ...form, stayId: form.stayId || null, active: true });
      setShowForm(false);
      setForm((f) => ({ ...f, name: '' }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the rule'));
    }
  }

  return (
    <section className="rounded-xl border border-line bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink">Pricing rules</h2>
        <AdminButton size="sm" variant={showForm ? 'ghost' : 'primary'} onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add rule'}
        </AdminButton>
      </div>

      {showForm && (
        <div className="mb-5 grid gap-3 rounded-xl border border-line bg-cream/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Festive Season" />
          </Field>
          <Field label="Applies to">
            <select value={form.stayId} onChange={(e) => setForm({ ...form, stayId: e.target.value })} className={inputCls}>
              <option value="">All stays</option>
              {stays?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as RateKind })} className={inputCls}>
              <option value="PERCENT">Percent of base</option>
              <option value="DELTA">Flat +/- amount</option>
              <option value="FIXED">Fixed price</option>
            </select>
          </Field>
          <Field label={form.kind === 'PERCENT' ? 'Amount (% e.g. 120 = +20%)' : 'Amount (₹)'}>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Start">
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="End">
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Min stay (nights)">
            <input type="number" min={1} value={form.minStay} onChange={(e) => setForm({ ...form, minStay: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Priority">
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <AdminButton onClick={submit} loading={createMut.isPending} className="w-full">
              Save rule
            </AdminButton>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-3">{error}</p>}
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading rules…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No pricing rules" description="Add seasonal or dynamic rates above." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-4">Rule</th>
                <th className="py-2 pr-4">Applies to</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Effect</th>
                <th className="py-2 pr-4">Min stay</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b border-line/60">
                  <td className="py-2.5 pr-4 font-medium text-ink">{r.name}</td>
                  <td className="py-2.5 pr-4 text-muted">{r.stay?.name ?? 'All stays'}</td>
                  <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-muted">
                    {formatDate(r.startDate)} → {formatDate(r.endDate)}
                  </td>
                  <td className="py-2.5 pr-4 text-ink">{ruleEffect(r)}</td>
                  <td className="py-2.5 pr-4 text-muted">{r.minStay}n</td>
                  <td className="py-2.5 pr-4">
                    <button
                      onClick={() =>
                        updateMut.mutate(
                          { id: r.id, input: { active: !r.active } },
                          { onError: (err) => notifyError(apiErrorMessage(err, 'Could not update rate rule')) },
                        )
                      }
                      className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${
                        r.active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-200 text-slate-600 ring-slate-300'
                      }`}
                    >
                      {r.active ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() =>
                        deleteMut.mutate(r.id, {
                          onError: (err) => notifyError(apiErrorMessage(err, 'Could not delete rate rule')),
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
      )}
    </section>
  );
}

/* ------------------------------- Date blocks ------------------------------- */
function BlocksSection() {
  const { data, isLoading, isError, refetch } = useBlocks();
  const { data: stays } = useStays();
  const createMut = useCreateBlock();
  const deleteMut = useDeleteBlock();
  const [form, setForm] = useState({ stayId: '', startDate: plus(1), endDate: plus(3), reason: '' });
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!form.stayId) {
      setError('Choose a stay to block');
      return;
    }
    try {
      await createMut.mutateAsync({ ...form, reason: form.reason || undefined });
      setForm((f) => ({ ...f, reason: '' }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not block these dates'));
    }
  }

  return (
    <section className="rounded-xl border border-line bg-paper p-5">
      <h2 className="mb-4 font-serif text-lg text-ink">Blocked dates</h2>

      <div className="mb-5 grid gap-3 rounded-xl border border-line bg-cream/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Stay">
          <select value={form.stayId} onChange={(e) => setForm({ ...form, stayId: e.target.value })} className={inputCls}>
            <option value="">Select…</option>
            {stays?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
        </Field>
        <Field label="To">
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Reason">
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputCls} placeholder="Maintenance" />
        </Field>
        <div className="flex items-end">
          <AdminButton onClick={submit} loading={createMut.isPending} className="w-full">
            Block
          </AdminButton>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2 lg:col-span-5">{error}</p>}
      </div>

      {isLoading ? (
        <LoadingState label="Loading blocks…" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No blocked dates" description="Block ranges for maintenance or holds above." />
      ) : (
        <ul className="divide-y divide-line">
          {data.map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
              <span>
                <span className="font-medium text-ink">{b.stay?.name ?? 'Stay'}</span>
                <span className="ml-2 text-muted">
                  {formatDate(b.startDate)} → {formatDate(b.endDate)}
                </span>
                {b.reason && <span className="ml-2 text-xs text-muted">· {b.reason}</span>}
              </span>
              <button
                onClick={() =>
                  deleteMut.mutate(b.id, {
                    onError: (err) => notifyError(apiErrorMessage(err, 'Could not remove block')),
                  })
                }
                className="text-xs text-rose-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
