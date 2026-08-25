import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SectionEyebrow from '../components/SectionEyebrow';
import Button from '../components/Button';
import { PublicError, PublicLoading } from '../components/PublicState';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { publicApi, apiErrorMessage } from '../lib/publicApi';
import { createPaymentOrder, verifyPayment, usePaymentConfig } from '../hooks/usePublic';
import { loadRazorpay, openRazorpayCheckout } from '../lib/razorpay';
import { inr } from '../data/site';
import Seo from '../components/Seo';

interface MyBooking {
  id: string;
  code: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  paymentStatus: string;
  stay?: { name: string; slug: string; heroImage: string };
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const CANCELLABLE = new Set(['PENDING', 'RESERVED', 'CONFIRMED']);

function statusTone(status: string, payment: string) {
  if (status === 'CANCELLED') return 'text-terracotta';
  if (status === 'CHECKED_IN' || status === 'CHECKED_OUT') return 'text-forest';
  if (payment === 'PARTIAL' || payment === 'UNPAID') return 'text-amber-700';
  return 'text-muted';
}

export default function Account() {
  const { user, signOut } = useCustomerAuth();
  const queryClient = useQueryClient();
  const { data: payConfig } = usePaymentConfig();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings', user?.id],
    enabled: !!user,
    queryFn: async () => (await publicApi.get<MyBooking[]>('/api/auth/me/bookings')).data,
  });

  const cancel = useMutation({
    mutationFn: async (bookingId: string) => {
      await publicApi.post(`/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => setActionError(apiErrorMessage(e, 'Could not cancel the booking')),
  });

  const payBalance = useMutation({
    mutationFn: async (booking: MyBooking) => {
      const order = await createPaymentOrder(booking.id, true);
      if (order.provider === 'razorpay') {
        const ok = await loadRazorpay();
        if (!ok) throw new Error('Could not load the payment gateway');
        openRazorpayCheckout({
          key: order.keyId,
          amount: order.amount * 100,
          currency: order.currency,
          name: 'Shraddha Garden Resort',
          description: booking.code,
          order_id: order.orderId,
          prefill: { name: user?.name ?? '', email: user?.email ?? '' },
          theme: { color: '#2E4B2E' },
          handler: async (r) => {
            await verifyPayment({
              paymentRecordId: order.paymentRecordId,
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            });
            void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
          },
          modal: { ondismiss: () => setActionError('Payment was cancelled.') },
        });
      } else {
        // Mock provider: settle immediately.
        await verifyPayment({ paymentRecordId: order.paymentRecordId, mockSuccess: true });
        void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      }
    },
    onError: (e) => setActionError(apiErrorMessage(e, 'Could not start the payment')),
  });

  if (!user) return <Navigate to="/signin" replace />;

  return (
    <section className="container-pad pt-28 pb-20 md:pt-32">
  <Seo title="My Account" path="/account" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow align="left">Your account</SectionEyebrow>
          <h1 className="mt-2 font-serif text-3xl text-ink md:text-4xl">Hello, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-terracotta hover:underline">
          Sign out
        </button>
      </div>

      <h2 className="mt-10 font-serif text-2xl text-ink">My bookings</h2>

      {actionError && (
        <p className="mt-3 rounded-card border border-line bg-paper p-3 text-sm text-terracotta">{actionError}</p>
      )}

      {isLoading ? (
        <PublicLoading label="Loading your bookings…" />
      ) : isError ? (
        <PublicError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <div className="relative mt-6 overflow-hidden rounded-card border border-dashed border-line bg-paper p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <img src="/images/brand/icon-green.png" alt="" className="w-64 h-64 object-contain drop-shadow-xl" />
          </div>
          <div className="relative z-10">
            <p className="text-base text-ink font-serif">You don’t have any bookings yet.</p>
            <p className="text-sm text-muted mt-2 mb-6 max-w-sm mx-auto">Discover our collection of rooms and suites designed for ultimate relaxation.</p>
            <Link to="/stays" className="inline-block">
              <Button variant="forest">Browse stays</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((b) => {
            const balance = b.balanceDue ?? Math.max(0, b.amount - (b.amountPaid ?? 0));
            const canPayBalance = balance > 0 && b.paymentStatus !== 'PAID' && b.paymentStatus !== 'REFUNDED' && b.status !== 'CANCELLED';
            const canCancel = CANCELLABLE.has(b.status) && (b.paymentStatus === 'UNPAID' || b.paymentStatus === 'PARTIAL');
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-paper p-4">
                {b.stay && <img src={b.stay.heroImage} alt={b.stay.name} className="h-16 w-24 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg text-ink">{b.stay?.name ?? 'Stay'}</p>
                  <p className="text-sm text-muted">
                    {fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights} night{b.nights === 1 ? '' : 's'} · {b.guests} guests
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">{b.code}</p>
                  {balance > 0 && b.paymentStatus !== 'REFUNDED' && (
                    <p className="mt-1 text-xs text-amber-700">Balance due: {inr(balance)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">{inr(b.amount)}</p>
                  <span className={`text-xs ${statusTone(b.status, b.paymentStatus)}`}>
                    {b.status} · {b.paymentStatus}
                  </span>
                  {(canPayBalance || canCancel) && (
                    <div className="mt-2 flex flex-col gap-2">
                      {canPayBalance && (
                        <Button
                          size="sm"
                          variant="forest"
                          disabled={payBalance.isPending}
                          onClick={() => {
                            setActionError(null);
                            payBalance.mutate(b);
                          }}
                        >
                          Pay {inr(balance)}
                          {payConfig?.provider === 'razorpay' ? '' : ' (mock)'}
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cancel.isPending}
                          onClick={() => {
                            if (window.confirm(`Cancel booking ${b.code}?`)) {
                              setActionError(null);
                              cancel.mutate(b.id);
                            }
                          }}
                        >
                          Cancel booking
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
