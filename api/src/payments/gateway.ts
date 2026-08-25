import crypto from 'node:crypto';
import type { PaymentConfig } from './config.js';

export interface CreatedOrder {
  orderId: string;
}
export interface RefundResult {
  refundId: string;
}

/** Razorpay REST base. Test vs live is determined purely by the API keys. */
const RAZORPAY_API = 'https://api.razorpay.com/v1';

function basicAuth(c: PaymentConfig) {
  return 'Basic ' + Buffer.from(`${c.keyId}:${c.keySecret}`).toString('base64');
}

function hmac(secret: string, data: string) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/** Timing-safe string compare for signatures. */
function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/* ------------------------------- Create order ------------------------------- */
export async function createOrder(
  c: PaymentConfig,
  input: { amount: number; currency: string; receipt: string },
): Promise<CreatedOrder> {
  if (c.provider === 'razorpay') {
    if (!c.keyId || !c.keySecret) throw new Error('Razorpay keys are not configured');
    const res = await fetch(`${RAZORPAY_API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: basicAuth(c) },
      body: JSON.stringify({
        amount: input.amount * 100, // paise
        currency: input.currency,
        receipt: input.receipt,
      }),
    });
    if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
    const data = (await res.json()) as { id: string };
    return { orderId: data.id };
  }
  // mock
  return { orderId: `order_mock_${crypto.randomBytes(8).toString('hex')}` };
}

/* --------------------------- Verify a payment (callback) --------------------------- */
export function verifyPayment(
  c: PaymentConfig,
  input: { orderId: string; paymentId: string; signature: string },
): boolean {
  if (c.provider === 'razorpay') {
    const expected = hmac(c.keySecret, `${input.orderId}|${input.paymentId}`);
    return safeEqual(expected, input.signature);
  }
  // mock: the client signals success/failure; treat a non-empty paymentId as success
  return Boolean(input.paymentId);
}

/* ------------------------------ Verify a webhook ------------------------------ */
export function verifyWebhook(c: PaymentConfig, rawBody: string, signature: string): boolean {
  if (!c.webhookSecret) return false;
  const expected = hmac(c.webhookSecret, rawBody);
  return safeEqual(expected, signature);
}

/* --------------------------------- Refund --------------------------------- */
export async function refund(
  c: PaymentConfig,
  input: { paymentId: string; amount: number },
): Promise<RefundResult> {
  if (c.provider === 'razorpay') {
    const res = await fetch(`${RAZORPAY_API}/payments/${input.paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: basicAuth(c) },
      body: JSON.stringify({ amount: input.amount * 100 }),
    });
    if (!res.ok) throw new Error(`Razorpay refund failed (${res.status})`);
    const data = (await res.json()) as { id: string };
    return { refundId: data.id };
  }
  return { refundId: `rfnd_mock_${crypto.randomBytes(6).toString('hex')}` };
}

/**
 * Refundable amount given the admin's tiered refund policy.
 * - Cancelled within `fullRefundWithinHours` of booking → 100%.
 * - Otherwise the % from the highest tier whose `minDaysBefore` is still met
 *   (tiers are sorted most-generous-first by getPaymentConfig).
 */
export function computeRefund(
  c: PaymentConfig,
  paidAmount: number,
  checkIn: Date,
  bookedAt?: Date,
): { refundable: number; penalty: number; refundPercent: number } {
  const now = Date.now();
  const policy = c.refundPolicy;

  let refundPercent = 0;
  const withinGrace =
    bookedAt != null && now - bookedAt.getTime() <= policy.fullRefundWithinHours * 3_600_000;

  if (withinGrace) {
    refundPercent = 100;
  } else {
    const daysToCheckIn = Math.ceil((checkIn.getTime() - now) / 86_400_000);
    const tier = policy.tiers.find((t) => daysToCheckIn >= t.minDaysBefore);
    refundPercent = tier ? tier.refundPercent : 0;
  }

  const refundable = Math.round((paidAmount * refundPercent) / 100);
  return { refundable: Math.max(0, refundable), penalty: paidAmount - refundable, refundPercent };
}
