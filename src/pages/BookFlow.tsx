import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import SectionEyebrow from '../components/SectionEyebrow';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import Icon from '../components/Icon';
import SelectDropdown from '../components/SelectDropdown';
import {
  checkAvailability,
  createBooking,
  createPaymentOrder,
  useAddons,
  useMenu,
  usePaymentConfig,
  useSettings,
  useStays,
  validateCoupon,
  verifyPayment,
  type PaymentOrder,
} from '../hooks/usePublic';
import { apiErrorMessage } from '../lib/publicApi';
import { loadRazorpay, openRazorpayCheckout } from '../lib/razorpay';
import type { AvailabilityResult, CouponResult } from '../lib/publicTypes';
import { inr } from '../data/site';
import Seo from '../components/Seo';

const STEPS = ['Dates', 'Food', 'Add-ons', 'Your details', 'Review', 'Confirmed'];
const field =
  'w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-all focus:border-forest focus:ring-2 focus:ring-forest/30';
const today = new Date().toISOString().split('T')[0];

export default function BookFlow() {
  const [params] = useSearchParams();
  const { data: settings } = useSettings();
  const { data: stays } = useStays();
  const { data: menu } = useMenu();
  const { data: addons } = useAddons();
  const { data: payConfig } = usePaymentConfig();
  const gstPercent = Number(settings?.gstPercent ?? 12);
  const depositPercent = payConfig?.depositPercent ?? 0;

  const [step, setStep] = useState(0);
  const [stayId, setStayId] = useState(params.get('stay') ?? '');
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? today);
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '');
  const [guests, setGuests] = useState(Number(params.get('guests') ?? 2));

  const [quote, setQuote] = useState<AvailabilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Food: map of menu itemId → quantity. Add-ons: selected ids.
  const [foodQty, setFoodQty] = useState<Record<string, number>>({});
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [guest, setGuest] = useState({ name: '', email: '', phone: '', notes: '' });
  const [coupon, setCoupon] = useState('');
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [confirmation, setConfirmation] = useState<{ code: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payOrder, setPayOrder] = useState<PaymentOrder | null>(null);
  // 'full' pays everything now; 'advance' pays the configured deposit % and
  // reserves the booking with the balance collected later.
  const [payChoice, setPayChoice] = useState<'full' | 'advance'>('full');
  const [foodTab, setFoodTab] = useState<string | null>(null);
  const [foodSearch, setFoodSearch] = useState('');

  // Auto-run availability if we arrived with full params.
  useEffect(() => {
    if (stayId && checkIn && checkOut && !quote) void runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuItems = useMemo(() => (menu ?? []).flatMap((c) => c.items), [menu]);

  const foodLines = useMemo(
    () =>
      Object.entries(foodQty)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, qty]) => {
          const item = menuItems.find((i) => i.id === itemId);
          return item ? { item, qty } : null;
        })
        .filter((x): x is { item: (typeof menuItems)[number]; qty: number } => !!x),
    [foodQty, menuItems],
  );
  const foodTotal = useMemo(() => foodLines.reduce((s, l) => s + l.item.price * l.qty, 0), [foodLines]);

  const selectedAddons = useMemo(
    () => (addons ?? []).filter((a) => addonIds.includes(a.id)),
    [addons, addonIds],
  );
  const addonsTotal = useMemo(
    () => selectedAddons.reduce((s, a) => s + (a.complimentary ? 0 : a.price), 0),
    [selectedAddons],
  );

  const roomSubtotal = quote?.subtotal ?? 0;
  const discount = couponResult?.discount ?? 0;
  const preTax = Math.max(0, roomSubtotal - discount) + foodTotal + addonsTotal;
  const gst = Math.round((preTax * gstPercent) / 100);
  const grandTotal = preTax + gst;

  // Advance / deposit support.
  const advanceEnabled = depositPercent > 0;
  const payNow =
    advanceEnabled && payChoice === 'advance' ? Math.round((grandTotal * depositPercent) / 100) : grandTotal;
  const balanceLater = grandTotal - payNow;

  const summaryContent = quote ? (
    <div className="space-y-2 text-sm">
      <Line label={`${quote.stay.name} · ${quote.nights} night${quote.nights === 1 ? '' : 's'}`} value={inr(roomSubtotal)} />
      {discount > 0 && <Line label={`Coupon ${couponResult?.code}`} value={`− ${inr(discount)}`} accent />}
      {foodTotal > 0 && <Line label={`Food (${foodLines.length} item${foodLines.length === 1 ? '' : 's'})`} value={inr(foodTotal)} />}
      {addonsTotal > 0 && <Line label="Add-ons" value={inr(addonsTotal)} />}
      {selectedAddons.some((a) => a.complimentary) && (
        <Line label="Complimentary extras" value="Free" accent />
      )}
      <Line label={`GST (${gstPercent}%)`} value={inr(gst)} />
      <div className="flex justify-between border-t border-line pt-2 font-serif text-lg text-ink">
        <span>Total</span>
        <span>{inr(grandTotal)}</span>
      </div>
      <p className="text-xs text-muted">
        {checkIn} → {checkOut} · {guests} guest{guests === 1 ? '' : 's'} · for {guest.name || 'you'}
      </p>
    </div>
  ) : null;

  function setQty(itemId: string, next: number) {
    setFoodQty((p) => ({ ...p, [itemId]: Math.max(0, next) }));
  }

  async function runCheck() {
    if (!stayId || !checkIn || !checkOut) {
      setError('Choose your dates to continue.');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const results = await checkAvailability({ checkIn, checkOut, guests, stayId });
      const r = results[0] ?? null;
      setQuote(r);
      if (r && !r.available) setError(r.unavailableReason);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not check availability'));
    } finally {
      setChecking(false);
    }
  }

  async function applyCoupon() {
    setCouponError(null);
    setCouponResult(null);
    if (!coupon.trim()) return;
    try {
      setCouponResult(await validateCoupon(coupon.trim(), roomSubtotal));
    } catch (err) {
      setCouponError(apiErrorMessage(err, 'Invalid coupon'));
    }
  }

  async function startPayment() {
    setSubmitting(true);
    setError(null);
    try {
      const notes = [
        foodLines.length ? `Food: ${foodLines.map((l) => `${l.item.name}×${l.qty}`).join(', ')}` : null,
        selectedAddons.length ? `Add-ons: ${selectedAddons.map((a) => a.name).join(', ')}` : null,
        guest.notes || null,
      ]
        .filter(Boolean)
        .join(' · ');
      const booking = await createBooking({
        stayId,
        customerName: guest.name,
        customerEmail: guest.email,
        customerPhone: guest.phone || undefined,
        checkIn,
        checkOut,
        guests,
        couponCode: couponResult?.code,
        food: foodLines.map((l) => ({ itemId: l.item.id, qty: l.qty })),
        addonIds,
        notes: notes || undefined,
      });
      const order = await createPaymentOrder(booking.id, !(advanceEnabled && payChoice === 'advance'));

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
          prefill: { name: guest.name, email: guest.email, contact: guest.phone },
          theme: { color: '#2E4B2E' },
          handler: async (r) => {
            try {
              const v = await verifyPayment({
                paymentRecordId: order.paymentRecordId,
                razorpayPaymentId: r.razorpay_payment_id,
                razorpaySignature: r.razorpay_signature,
              });
              setConfirmation({ code: v.bookingCode });
              setStep(5);
            } catch (e) {
              setError(apiErrorMessage(e, 'Payment verification failed'));
            }
          },
          modal: { ondismiss: () => setError('Payment was cancelled.') },
        });
      } else {
        // Mock provider — show the in-flow test payment panel.
        setPayOrder(order);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not start payment'));
    } finally {
      setSubmitting(false);
    }
  }

  async function completeMock(success: boolean) {
    if (!payOrder) return;
    setSubmitting(true);
    setError(null);
    try {
      const v = await verifyPayment({ paymentRecordId: payOrder.paymentRecordId, mockSuccess: success });
      setConfirmation({ code: v.bookingCode });
      setPayOrder(null);
      setStep(5);
    } catch (err) {
      setError(apiErrorMessage(err, 'Payment failed — please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  const canProceedDates = quote?.available && !checking;
  const canProceedDetails = guest.name && /\S+@\S+\.\S+/.test(guest.email);

  return (
    <section className="container-pad pt-28 pb-20 md:pt-32 md:pb-28">
  <Seo title="Book Your Stay" path="/book" />
      <div className="mx-auto max-w-5xl">
        <SectionEyebrow align="left">Reserve</SectionEyebrow>
        <h1 className="mt-2 font-serif text-3xl text-ink md:text-4xl">Book your stay</h1>

        {/* Stepper */}
        <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[0.7rem] ${
                  i === step ? 'bg-forest text-cream' : i < step ? 'bg-forest/15 text-forest' : 'bg-line/60 text-muted'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className={i === step ? 'font-medium text-ink' : 'text-muted'}>{s}</span>
              {i < STEPS.length - 1 && <span className="text-line">—</span>}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-card border border-line bg-paper p-6 md:p-8">
            {/* Step 1: Dates */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-xl text-ink">When are you visiting?</h2>
              <label className="mt-5 flex flex-col gap-1.5">
                <span className="tag-label">Stay</span>
                <SelectDropdown
                  value={stayId}
                  onChange={(val) => {
                    setStayId(val);
                    setQuote(null);
                  }}
                  placeholder="Select a stay…"
                  options={(stays || []).map((s) => ({
                    value: s.id,
                    label: `${s.name} — ${inr(s.pricePerNight)}/night`,
                  }))}
                />
              </label>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Check-in</span>
                  <div className="relative">
                    <Icon name="calendar" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={`${field} pl-10`} />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Check-out</span>
                  <div className="relative">
                    <Icon name="calendar" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={`${field} pl-10`} />
                  </div>
                </label>
                <div className="rounded-lg border border-line px-3 py-2 focus-within:border-forest focus-within:ring-2 focus-within:ring-forest/30 transition-all">
                  <Stepper value={guests} onChange={setGuests} label="Guests" max={15} />
                </div>
              </div>

              <Button type="button" variant="forest" className="mt-5" onClick={runCheck}>
                {checking ? 'Checking…' : 'Check availability'}
              </Button>

              {quote && quote.available && (
                <div className="mt-5 rounded-lg border border-forest/30 bg-forest/5 p-4">
                  <p className="font-serif text-lg text-ink">{quote.stay.name}</p>
                  <p className="text-sm text-muted">
                    {quote.nights} night{quote.nights === 1 ? '' : 's'} · {quote.unitsLeft} left ·{' '}
                    <span className="font-medium text-ink">{inr(quote.subtotal)}</span>
                  </p>
                  {quote.perNight.some((n) => n.ruleName) && (
                    <p className="mt-1 text-xs text-terracotta">
                      Seasonal rate: {[...new Set(quote.perNight.map((n) => n.ruleName).filter(Boolean))].join(', ')}
                    </p>
                  )}
                </div>
              )}
              {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            </div>
          )}

          {/* Step 2: Food */}
          {step === 1 && (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-ink">Add food to your stay</h2>
                  <p className="mt-1 text-sm text-muted">
                    Pick dishes from our kitchen. Priced per item.
                  </p>
                </div>
                {foodTotal > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted">Food total</p>
                    <p className="font-serif text-lg text-forest">{inr(foodTotal)}</p>
                  </div>
                )}
              </div>

              {!menu || menu.length === 0 ? (
                <p className="mt-5 rounded-lg border border-line bg-cream/50 px-3 py-3 text-sm text-muted">
                  Our menu is being updated — you can add food at check-in.
                </p>
              ) : (
                <>
                  {foodLines.length > 0 && (
                    <div className="mt-6 rounded-xl border border-forest bg-forest/5 p-4">
                      <h3 className="font-serif text-lg text-ink">Your order</h3>
                      <div className="mt-4 space-y-3">
                        {foodLines.map((l) => (
                          <div key={l.item.id} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-ink w-1/2 line-clamp-1" title={l.item.name}>{l.item.name}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setQty(l.item.id, l.qty - 1)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink hover:bg-line/50 border border-line"
                              >
                                <Icon name="minus" className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium tabular-nums text-ink">{l.qty}</span>
                              <button
                                type="button"
                                onClick={() => setQty(l.item.id, l.qty + 1)}
                                className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink hover:bg-line/50 border border-line"
                              >
                                <Icon name="plus" className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm text-muted w-16 text-right">{inr(l.item.price * l.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-xl border border-line bg-cream/30 p-4">
                    <div className="relative mb-4">
                    <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Search for dishes (e.g. Rice, Chicken)..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      className="w-full rounded-lg border border-line bg-paper py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-forest"
                    />
                  </div>

                  {(() => {
                    const searchLower = foodSearch.toLowerCase();
                    const filteredMenu = menu.map(cat => ({
                      ...cat,
                      items: cat.items.filter(item => item.name.toLowerCase().includes(searchLower))
                    })).filter(cat => cat.items.length > 0);

                    if (filteredMenu.length === 0) {
                      return <p className="py-8 text-center text-sm text-muted">No dishes found for "{foodSearch}".</p>;
                    }

                    const activeCatId = foodTab && filteredMenu.some(c => c.id === foodTab) ? foodTab : filteredMenu[0].id;
                    const activeCat = filteredMenu.find(c => c.id === activeCatId);

                    return (
                      <>
                        {!foodSearch && (
                          <div className="mb-5 flex flex-wrap gap-2">
                            {filteredMenu.map(c => {
                              const isActive = activeCatId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setFoodTab(c.id)}
                                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border ${
                                    isActive
                                      ? 'border-forest bg-forest text-cream'
                                      : 'border-line bg-paper text-ink hover:border-forest/50'
                                  }`}
                                >
                                  {c.name}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {(foodSearch ? filteredMenu.flatMap(c => c.items) : activeCat?.items || []).map(item => {
                            const qty = foodQty[item.id] ?? 0;
                            return (
                              <div key={item.id} className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${qty > 0 ? 'border-forest bg-forest/5' : 'border-line bg-paper hover:border-forest/50'}`}>
                                <div>
                                  <div className="flex items-start gap-1.5">
                                    {item.veg != null && (
                                      <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-sm ring-1 ${item.veg ? 'bg-emerald-500 ring-emerald-600' : 'bg-rose-500 ring-rose-600'}`} />
                                    )}
                                    <p className="line-clamp-2 text-sm font-medium leading-tight text-ink" title={item.name}>{item.name}</p>
                                  </div>
                                  <p className="mt-1 text-xs text-muted">{inr(item.price)}</p>
                                </div>
                                <div className="mt-3 flex items-center justify-between rounded-full border border-line bg-cream px-1 py-1">
                                  <button
                                    type="button"
                                    onClick={() => setQty(item.id, qty - 1)}
                                    disabled={qty === 0}
                                    className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-line/50 disabled:opacity-40"
                                  >
                                    <Icon name="minus" className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium tabular-nums text-ink">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setQty(item.id, qty + 1)}
                                    className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-line/50"
                                  >
                                    <Icon name="plus" className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

          {/* Step 3: Add-ons */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-xl text-ink">Make it special</h2>
              <p className="mt-1 text-sm text-muted">Optional extras — add what you’d like.</p>
              {!addons || addons.length === 0 ? (
                <p className="mt-5 rounded-lg border border-line bg-cream/50 px-3 py-3 text-sm text-muted">
                  No add-ons available right now.
                </p>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {addons.map((a) => {
                    const on = addonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAddonIds((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                        className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          on ? 'border-forest bg-forest/5' : 'border-line hover:border-forest/50'
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${on ? 'border-forest bg-forest text-cream' : 'border-line'}`}>
                            {on && <Icon name="check" className="h-3 w-3" />}
                          </span>
                          <span>
                            <span className="text-ink">{a.name}</span>
                            {a.description && <span className="block text-xs text-muted">{a.description}</span>}
                          </span>
                        </span>
                        <span className={a.complimentary ? 'shrink-0 text-forest' : 'shrink-0 text-muted'}>
                          {a.complimentary ? 'Free' : inr(a.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Details */}
          {step === 3 && (
            <div>
              <h2 className="font-serif text-xl text-ink">Your details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Full name</span>
                  <input className={field} value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Phone</span>
                  <input className={field} value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="+91 …" />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="tag-label">Email</span>
                  <input className={field} value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="you@email.com" />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="tag-label">Special requests</span>
                  <textarea rows={2} className={`${field} resize-none`} value={guest.notes} onChange={(e) => setGuest({ ...guest, notes: e.target.value })} />
                </label>

                <div className="sm:col-span-2">
                  <span className="tag-label">Coupon code</span>
                  <div className="mt-1.5 flex gap-2">
                    <input className={field} value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME10" />
                    <Button type="button" variant="outline" onClick={applyCoupon}>
                      Apply
                    </Button>
                  </div>
                  {couponResult && <p className="mt-1.5 text-xs text-forest">Applied {couponResult.code} — you save {inr(couponResult.discount)}.</p>}
                  {couponError && <p className="mt-1.5 text-xs text-rose-600">{couponError}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && quote && (
            <div>
              <h2 className="font-serif text-xl text-ink">Review & confirm</h2>
              <div className="mt-5 lg:hidden">
                {summaryContent}
              </div>
              {advanceEnabled && (
                <div className="mt-4">
                  <p className="tag-label">Payment option</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPayChoice('full')}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        payChoice === 'full' ? 'border-forest bg-forest/5' : 'border-line hover:border-forest/50'
                      }`}
                    >
                      <span className="block font-medium text-ink">Pay full amount</span>
                      <span className="block text-xs text-muted">{inr(grandTotal)} now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayChoice('advance')}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        payChoice === 'advance' ? 'border-forest bg-forest/5' : 'border-line hover:border-forest/50'
                      }`}
                    >
                      <span className="block font-medium text-ink">Reserve with {depositPercent}% advance</span>
                      <span className="block text-xs text-muted">
                        {inr(Math.round((grandTotal * depositPercent) / 100))} now · balance{' '}
                        {inr(grandTotal - Math.round((grandTotal * depositPercent) / 100))} later
                      </span>
                    </button>
                  </div>
                </div>
              )}
              {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

              {!payOrder ? (
                <>
                  <Button type="button" variant="forest" className="mt-6 w-full" onClick={startPayment} disabled={submitting}>
                    {submitting
                      ? 'Starting payment…'
                      : payChoice === 'advance' && advanceEnabled
                        ? `Pay ${inr(payNow)} advance · reserve`
                        : `Pay ${inr(grandTotal)}`}
                  </Button>
                  {payChoice === 'advance' && advanceEnabled && (
                    <p className="mt-1.5 text-center text-xs text-muted">
                      Balance of {inr(balanceLater)} collected later. Your booking is held as <span className="text-ink">Reserved</span>.
                    </p>
                  )}
                  <p className="mt-2 text-center text-xs text-muted">
                    {payConfig?.provider === 'razorpay'
                      ? `Secured by Razorpay${payConfig?.testMode ? ' (test mode)' : ''} · UPI, cards & netbanking`
                      : 'Test checkout — no real charge is made.'}
                  </p>
                </>
              ) : (
                <div className="mt-6 rounded-xl border border-forest/30 bg-forest/5 p-4">
                  <p className="text-sm font-medium text-ink">Test payment</p>
                  <p className="mt-1 text-xs text-muted">
                    Order <span className="font-mono">{payOrder.orderId.slice(0, 18)}…</span> · Pay now {inr(payOrder.amount)}
                    {payOrder.amount < grandTotal && ` (balance ${inr(grandTotal - payOrder.amount)} at check-in)`}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="forest" onClick={() => completeMock(true)} disabled={submitting}>
                      {submitting ? 'Processing…' : 'Pay now'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => completeMock(false)} disabled={submitting}>
                      Simulate failure
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 5 && confirmation && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest text-cream">
                <Icon name="check" className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-serif text-2xl text-ink">Booking confirmed</h2>
              <p className="mt-2 text-sm text-muted">
                Thank you, {guest.name}! Your reference is{' '}
                <span className="font-mono font-medium text-ink">{confirmation.code}</span>. A confirmation has been sent to {guest.email}.
              </p>
              <div className="mx-auto mt-5 max-w-sm rounded-lg border border-line bg-cream/50 p-4 text-left text-sm">
                <Line label="Stay" value={quote?.stay.name ?? ''} />
                <Line label="Dates" value={`${checkIn} → ${checkOut}`} />
                {foodTotal > 0 && <Line label="Food" value={inr(foodTotal)} />}
                {addonsTotal > 0 && <Line label="Add-ons" value={inr(addonsTotal)} />}
                {payChoice === 'advance' && advanceEnabled ? (
                  <>
                    <Line label="Paid now (advance)" value={inr(payNow)} accent />
                    <Line label="Balance due later" value={inr(balanceLater)} />
                  </>
                ) : (
                  <Line label="Total paid" value={inr(grandTotal)} />
                )}
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/stays">
                  <Button variant="outline">Browse more stays</Button>
                </Link>
                <Link to={`/find-booking?code=${confirmation.code}&email=${encodeURIComponent(guest.email)}`}>
                  <Button variant="forest">Manage this booking</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          {step < 5 && (
            <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
              {step === 0 ? (
                <div /> // Spacer
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="text-muted enabled:hover:text-ink"
                >
                  ← Back
                </Button>
              )}
              {step < 4 && (
                <Button
                  type="button"
                  variant="forest"
                  disabled={(step === 0 && !canProceedDates) || (step === 3 && !canProceedDetails)}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Sticky Summary */}
        <div className="hidden lg:block">
          <div className="sticky top-28 rounded-card border border-line bg-paper p-6">
            <h3 className="font-serif text-xl text-ink">Booking summary</h3>
            <div className="mt-5">
              {quote ? (
                summaryContent
              ) : (
                <p className="text-sm text-muted">Choose your dates and stay to see a price summary.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!stayId && (
          <p className="mt-6 text-center text-sm text-muted">
            Tip: start from a <Link to="/stays" className="text-terracotta underline">stay</Link> to pre-fill your dates.
          </p>
        )}
      </div>
    </section>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'text-forest' : 'text-ink'}>{value}</span>
    </div>
  );
}
