import { useState } from 'react';
import Drawer from '../components/ui/Drawer';
import Badge from '../components/ui/Badge';
import AdminButton from '../components/ui/AdminButton';
import {
  BOOKING_NEXT,
  BOOKING_STATUS_META,
  PAYMENT_STATUS_META,
  formatDate,
  inr,
} from '../constants';
import {
  useBookingPayments,
  useRefund,
  useUpdateBookingStatus,
  useUpdatePayment,
} from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';
import { useAdminAuth } from '../auth/AdminAuthContext';
import type { Booking, PaymentStatus } from '../types';

const STATUS_ACTION_LABEL: Record<string, string> = {
  RESERVED: 'Reserve',
  CONFIRMED: 'Confirm',
  CHECKED_IN: 'Check in',
  CHECKED_OUT: 'Check out',
  CANCELLED: 'Cancel',
};

export default function BookingDrawer({
  booking,
  onClose,
  onUpdated,
}: {
  booking: Booking | null;
  onClose: () => void;
  onUpdated?: (b: Booking) => void;
}) {
  const { hasRole } = useAdminAuth();
  const statusMut = useUpdateBookingStatus();
  const paymentMut = useUpdatePayment();
  const refundMut = useRefund();
  const { data: payments } = useBookingPayments(booking?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [recordAmount, setRecordAmount] = useState<string>('');
  const [recordMethod, setRecordMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [showDirectEdit, setShowDirectEdit] = useState(false);
  const [manualPaid, setManualPaid] = useState<string>('');
  const [manualBalance, setManualBalance] = useState<string>('');

  if (!booking) return null;

  const paid = booking.amountPaid ?? 0;
  const balance =
    booking.balanceDue !== undefined && booking.balanceDue !== null
      ? booking.balanceDue
      : Math.max(0, booking.amount - paid);

  const next = BOOKING_NEXT[booking.status] ?? [];
  const canEditPayment = hasRole('SUPER_ADMIN', 'MANAGER');
  const hasCapturedPayment = (payments ?? []).some((p) => p.status === 'PAID');

  async function runRefund() {
    if (!window.confirm('Issue a refund per the cancellation policy? This cancels the booking.')) return;
    setError(null);
    try {
      const r = await refundMut.mutateAsync(booking!.id);
      onUpdated?.({ ...booking!, status: 'CANCELLED', paymentStatus: 'REFUNDED' });
      window.alert(`Refunded ₹${r.refundAmount.toLocaleString('en-IN')}${r.penalty ? ` (penalty ₹${r.penalty.toLocaleString('en-IN')})` : ''}.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function runStatus(status: Booking['status']) {
    setError(null);
    try {
      const updated = await statusMut.mutateAsync({ id: booking!.id, status });
      onUpdated?.({ ...booking!, ...updated });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function runPayment(paymentStatus: PaymentStatus) {
    setError(null);
    try {
      const updated = await paymentMut.mutateAsync({ id: booking!.id, paymentStatus });
      onUpdated?.({ ...booking!, ...updated });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(recordAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    setError(null);
    try {
      const updated = await paymentMut.mutateAsync({
        id: booking!.id,
        paymentAmount: Math.round(amt),
        paymentMethod: recordMethod,
        notes: recordNotes || undefined,
      });
      onUpdated?.({ ...booking!, ...updated });
      setRecordAmount('');
      setRecordNotes('');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDirectUpdate(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(manualPaid);
    const b = parseFloat(manualBalance);
    if (isNaN(p) || isNaN(b)) {
      setError('Please enter valid numeric amounts.');
      return;
    }
    setError(null);
    try {
      const updated = await paymentMut.mutateAsync({
        id: booking!.id,
        amountPaid: Math.max(0, Math.round(p)),
        balanceDue: Math.max(0, Math.round(b)),
      });
      onUpdated?.({ ...booking!, ...updated });
      setShowDirectEdit(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const sm = BOOKING_STATUS_META[booking.status];
  const pm = PAYMENT_STATUS_META[booking.paymentStatus];

  const inputClass =
    'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest';
  const selectClass =
    'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest';

  return (
    <Drawer open onClose={onClose} title={`Booking ${booking.code}`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={sm.tone}>{sm.label}</Badge>
          <Badge tone={pm.tone}>Payment: {pm.label}</Badge>
          <span className="text-xs text-muted">via {booking.source}</span>
        </div>

        <Section title="Stay">
          <Row label="Room" value={booking.stay?.name ?? '—'} />
          <Row label="Check-in" value={formatDate(booking.checkIn)} />
          <Row label="Check-out" value={formatDate(booking.checkOut)} />
          <Row label="Nights" value={String(booking.nights)} />
          <Row label="Guests" value={String(booking.guests)} />
        </Section>

        <Section title="Guest">
          <Row label="Name" value={booking.customerName} />
          <Row label="Email" value={booking.customerEmail} />
          <Row label="Phone" value={booking.customerPhone ?? '—'} />
        </Section>

        <Section title="Amount & Balance">
          <Row label="Total Amount" value={inr(booking.amount)} strong />
          <Row label="Amount Paid" value={inr(paid)} />
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted">Balance Due</span>
            <span className={`font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {balance > 0 ? inr(balance) : '₹0 (Settled)'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <span className="text-muted">Payment Status</span>
            <Badge tone={pm.tone}>{pm.label}</Badge>
          </div>
          {booking.notes && <Row label="Notes" value={booking.notes} />}
        </Section>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        {/* Status actions */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            Status actions
          </p>
          {next.length === 0 ? (
            <p className="text-sm text-muted">No further status changes available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {next.map((status) => (
                <AdminButton
                  key={status}
                  size="sm"
                  variant={status === 'CANCELLED' ? 'danger' : 'primary'}
                  loading={statusMut.isPending}
                  onClick={() => runStatus(status)}
                >
                  {STATUS_ACTION_LABEL[status] ?? status}
                </AdminButton>
              ))}
            </div>
          )}
        </div>

        {/* Payment transactions */}
        {(payments?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Transactions</p>
            <div className="divide-y divide-line rounded-xl border border-line bg-paper">
              {payments!.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="capitalize text-ink font-medium">{p.method || p.provider}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{(p.paymentId ?? p.orderId ?? p.id).slice(0, 16)}</span>
                    {p.notes && <span className="block text-xs text-muted truncate">{p.notes}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-ink font-medium">{inr(p.amount)}</span>
                    <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'REFUNDED' ? 'red' : p.status === 'FAILED' ? 'red' : 'slate'}>
                      {p.status}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment actions & Balance Management */}
        {canEditPayment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Payment Management</p>
              <button
                type="button"
                onClick={() => {
                  setManualPaid(String(paid));
                  setManualBalance(String(balance));
                  setShowDirectEdit(!showDirectEdit);
                }}
                className="text-xs text-forest hover:underline font-medium"
              >
                {showDirectEdit ? 'Cancel Manual Edit' : 'Edit Totals Directly'}
              </button>
            </div>

            {/* Direct Edit Form */}
            {showDirectEdit ? (
              <form onSubmit={handleDirectUpdate} className="rounded-xl border border-line bg-paper p-4 space-y-3">
                <p className="text-xs font-medium text-ink">Directly Override Financial Totals</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">Amount Paid (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={manualPaid}
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualPaid(val);
                        const num = parseFloat(val);
                        if (!isNaN(num)) {
                          setManualBalance(String(Math.max(0, booking.amount - num)));
                        }
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">Balance Due (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={manualBalance}
                      onChange={(e) => setManualBalance(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <AdminButton size="sm" variant="secondary" type="button" onClick={() => setShowDirectEdit(false)}>
                    Cancel
                  </AdminButton>
                  <AdminButton size="sm" variant="primary" type="submit" loading={paymentMut.isPending}>
                    Save Overrides
                  </AdminButton>
                </div>
              </form>
            ) : (
              /* Record Payment Form */
              <form onSubmit={handleRecordPayment} className="rounded-xl border border-line bg-paper p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink">Record Payment (Cash / UPI / Card)</span>
                  {balance > 0 && (
                    <span className="text-xs text-muted">
                      Pending: <strong className="text-amber-700">{inr(balance)}</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">Amount Received (₹)</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={recordAmount}
                      onChange={(e) => setRecordAmount(e.target.value)}
                      placeholder={balance > 0 ? String(balance) : 'Amount'}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">Payment Method</label>
                    <select
                      className={selectClass}
                      value={recordMethod}
                      onChange={(e) => setRecordMethod(e.target.value as any)}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / GPay / PhonePe</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Bank Transfer / NEFT</option>
                    </select>
                  </div>
                </div>

                {balance > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-muted">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setRecordAmount(String(balance))}
                      className="rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] text-ink hover:border-forest transition-colors"
                    >
                      Full Balance ({inr(balance)})
                    </button>
                    {balance >= 1000 && (
                      <button
                        type="button"
                        onClick={() => setRecordAmount(String(Math.round(balance / 2)))}
                        className="rounded-md border border-line bg-paper px-2 py-0.5 text-[11px] text-ink hover:border-forest transition-colors"
                      >
                        50% ({inr(Math.round(balance / 2))})
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    className={inputClass}
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                    placeholder="Optional note / transaction ref (e.g. UPI ref #9382)"
                  />
                </div>

                <div className="pt-1">
                  <AdminButton size="sm" variant="primary" type="submit" loading={paymentMut.isPending} className="w-full sm:w-auto">
                    + Record Payment
                  </AdminButton>
                </div>
              </form>
            )}

            {/* Quick Status Toggles & Refund */}
            <div className="pt-2">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">Quick Status Shortcuts</p>
              <div className="flex flex-wrap gap-2">
                {hasCapturedPayment && booking.paymentStatus !== 'REFUNDED' && (
                  <AdminButton size="sm" variant="danger" loading={refundMut.isPending} onClick={runRefund}>
                    Refund (policy-aware)
                  </AdminButton>
                )}
                {(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as PaymentStatus[])
                  .filter((p) => p !== booking.paymentStatus)
                  .map((p) => (
                    <AdminButton
                      key={p}
                      size="sm"
                      variant="secondary"
                      loading={paymentMut.isPending}
                      onClick={() => runPayment(p)}
                    >
                      Mark {PAYMENT_STATUS_META[p].label}
                    </AdminButton>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
      <div className="divide-y divide-line rounded-xl border border-line bg-paper">{children}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-serif text-base text-ink' : 'text-ink'}>{value}</span>
    </div>
  );
}
