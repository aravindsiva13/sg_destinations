import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import SectionEyebrow from '../components/SectionEyebrow';
import Button from '../components/Button';
import { PublicLoading } from '../components/PublicState';
import { publicApi, apiErrorMessage } from '../lib/publicApi';
import { createPaymentOrder, verifyPayment, usePaymentConfig } from '../hooks/usePublic';
import { loadRazorpay, openRazorpayCheckout } from '../lib/razorpay';
import { inr } from '../data/site';
import Seo from '../components/Seo';

interface LookupBooking {
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

const field =
  'w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-forest';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function FindBooking() {
  const { data: payConfig } = usePaymentConfig();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [paying, setPaying] = useState(false);

  const lookup = useMutation({
    mutationFn: async () =>
      (await publicApi.get<LookupBooking>('/api/bookings/lookup', { params: { code, email } })).data,
  });

  const booking = lookup.data;
  const balance = booking ? (booking.balanceDue ?? Math.max(0, booking.amount - (booking.amountPaid ?? 0))) : 0;
  const canPay = booking && balance > 0 && booking.paymentStatus !== 'PAID' && booking.paymentStatus !== 'REFUNDED' && booking.status !== 'CANCELLED';

  async function startPayment() {
    if (!booking) return;
    setPaying(true);
    try {
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
          prefill: { name: '', email, contact: '' },
          theme: { color: '#2E4B2E' },
          handler: async (r) => {
            await verifyPayment({
              paymentRecordId: order.paymentRecordId,
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            });
            await lookup.mutateAsync();
          },
          modal: { ondismiss: () => undefined },
        });
      } else {
        await verifyPayment({ paymentRecordId: order.paymentRecordId, mockSuccess: true });
        await lookup.mutateAsync();
      }
    } catch (e) {
      lookup.error; // surface via mutation state
      alert(apiErrorMessage(e, 'Could not start the payment'));
    } finally {
      setPaying(false);
    }
  }

  return (
    <section className="container-pad grid min-h-[70vh] place-items-center pt-28 pb-20">
  <Seo title="Find Your Booking" path="/find-booking" />
      <div className="w-full max-w-md">
        <SectionEyebrow align="left">Manage your stay</SectionEyebrow>
        <h1 className="mt-2 font-serif text-3xl text-ink">Find your booking</h1>
        <p className="mt-2 text-sm text-muted">
          Booked as a guest? Enter your reference code and booking email to see your stay and pay any balance.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            lookup.mutate();
          }}
        >
          <label className="block">
            <span className="tag-label">Booking reference</span>
            <input
              className={`mt-1.5 ${field}`}
              placeholder="e.g. SG-7F3K9Q"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="tag-label">Booking email</span>
            <input
              type="email"
              className={`mt-1.5 ${field}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {lookup.isError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {apiErrorMessage(lookup.error, 'No booking found for that code and email')}
            </p>
          )}

          <Button type="submit" variant="forest" className="w-full" disabled={lookup.isPending}>
            {lookup.isPending ? 'Searching…' : 'Find booking'}
          </Button>
        </form>

        {lookup.isPending && (
          <div className="mt-6">
            <PublicLoading label="Looking up your booking…" />
          </div>
        )}

        {booking && (
          <div className="mt-6 rounded-card border border-line bg-paper p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-serif text-lg text-ink">{booking.stay?.name ?? 'Stay'}</p>
                <p className="text-sm text-muted">
                  {fmt(booking.checkIn)} → {fmt(booking.checkOut)} · {booking.nights} night{booking.nights === 1 ? '' : 's'} · {booking.guests} guests
                </p>
              </div>
              <span className="font-mono text-xs text-muted">{booking.code}</span>
            </div>
            <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total</span>
                <span className="font-medium text-ink">{inr(booking.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="text-ink">{booking.status} · {booking.paymentStatus}</span>
              </div>
              {balance > 0 && booking.paymentStatus !== 'REFUNDED' && (
                <div className="flex justify-between">
                  <span className="text-muted">Balance due</span>
                  <span className="font-medium text-amber-700">{inr(balance)}</span>
                </div>
              )}
            </div>
            {canPay && (
              <Button variant="forest" className="mt-4 w-full" disabled={paying} onClick={startPayment}>
                {paying ? 'Processing…' : `Pay balance ${inr(balance)}${payConfig?.provider === 'razorpay' ? '' : ' (mock)'}`}
              </Button>
            )}
            {booking.status === 'CANCELLED' && (
              <p className="mt-3 text-sm text-terracotta">This booking has been cancelled.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
