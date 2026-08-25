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

  if (!booking) return null;

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

  const sm = BOOKING_STATUS_META[booking.status];
  const pm = PAYMENT_STATUS_META[booking.paymentStatus];

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

        <Section title="Amount">
          <Row label="Total" value={inr(booking.amount)} strong />
          {(booking.balanceDue ?? 0) > 0 && (
            <>
              <Row label="Paid" value={inr(booking.amountPaid ?? 0)} />
              <Row label="Balance due" value={inr(booking.balanceDue ?? 0)} />
            </>
          )}
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
                    <span className="capitalize text-ink">{p.provider}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{(p.paymentId ?? p.orderId ?? '').slice(0, 16)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-ink">{inr(p.amount)}</span>
                    <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'REFUNDED' ? 'red' : p.status === 'FAILED' ? 'red' : 'slate'}>
                      {p.status}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment actions */}
        {canEditPayment && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Payment</p>
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
            <p className="mt-1.5 text-xs text-muted">
              “Refund” calls the gateway and applies the cancellation policy. “Mark …” is a manual override for cash / walk-ins.
            </p>
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
