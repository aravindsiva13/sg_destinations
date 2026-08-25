import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { PAYMENT_PROVIDERS, ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import {
  adminConfig,
  getPaymentConfig,
  publicConfig,
  savePaymentConfig,
} from '../payments/config.js';
import {
  computeRefund,
  createOrder,
  refund as gatewayRefund,
  verifyPayment,
  verifyWebhook,
} from '../payments/gateway.js';
import { onBookingConfirmed } from '../email/notify.js';
import { env } from '../env.js';

/**
 * The mock provider lets ANY caller mark a booking paid without touching a
 * payment network. It exists for local development only — production must
 * either use Razorpay or refuse to take money.
 */
export function assertGatewayAllowsOrders(config: { provider: string }): void {
  if (config.provider === 'mock' && env.isProduction) {
    throw new HttpError(503, 'Online payments are unavailable — please contact the resort');
  }
}

/** Load a booking + its stay and fire the confirmation email (fire-and-forget). */
async function emailConfirmation(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;
  const stay = await prisma.stay.findUnique({ where: { id: booking.stayId } });
  if (stay) void onBookingConfirmed(booking, stay);
}

export const paymentsRouter = Router();

/* ============================ Public config ============================ */
// What the browser checkout needs (provider, key id, methods) — never secrets.
paymentsRouter.get(
  '/public-config',
  asyncHandler(async (_req, res) => {
    res.json(publicConfig(await getPaymentConfig()));
  }),
);

/* ============================ Admin config ============================ */
paymentsRouter.get(
  '/config',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  asyncHandler(async (_req, res) => {
    res.json(adminConfig(await getPaymentConfig()));
  }),
);

const configSchema = z.object({
  provider: z.enum(PAYMENT_PROVIDERS).optional(),
  testMode: z.boolean().optional(),
  keyId: z.string().optional(),
  keySecret: z.string().optional(), // blank => keep existing
  webhookSecret: z.string().optional(),
  methods: z.array(z.string()).optional(),
  depositPercent: z.coerce.number().int().min(0).max(100).optional(),
  refundPolicy: z
    .object({
      fullRefundWithinHours: z.coerce.number().int().min(0),
      tiers: z
        .array(
          z.object({
            minDaysBefore: z.coerce.number().int().min(0),
            refundPercent: z.coerce.number().int().min(0).max(100),
          }),
        )
        .min(1),
    })
    .optional(),
});

paymentsRouter.put(
  '/config',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  validateBody(configSchema),
  asyncHandler(async (req, res) => {
    const patch = { ...(req.body as z.infer<typeof configSchema>) };
    if (patch.provider === 'mock' && env.isProduction) {
      throw new HttpError(422, 'The mock payment provider is disabled in production');
    }
    // Don't overwrite stored secrets with empty strings.
    if (!patch.keySecret) delete patch.keySecret;
    if (!patch.webhookSecret) delete patch.webhookSecret;
    const saved = await savePaymentConfig(patch);
    await recordAudit({ actor: req.user, action: 'update', entity: 'PaymentConfig' });
    res.json(adminConfig(saved));
  }),
);

/* ============================ Create order ============================ */
const orderSchema = z.object({ bookingId: z.string().min(1), payFull: z.boolean().optional() });

paymentsRouter.post(
  '/order',
  validateBody(orderSchema),
  asyncHandler(async (req, res) => {
    const { bookingId, payFull } = req.body as z.infer<typeof orderSchema>;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new HttpError(404, 'Booking not found');
    if (booking.paymentStatus === 'PAID') throw new HttpError(409, 'Booking already paid');

    const config = await getPaymentConfig();
    assertGatewayAllowsOrders(config);
    // What's left to collect on this booking.
    const remaining = booking.amount - booking.amountPaid;
    // Reserve options: if something is already paid, collect the balance; else
    // pay the full amount, or (when an advance % is configured and the guest
    // didn't choose full) just the advance now and the balance later.
    let payable: number;
    if (booking.amountPaid > 0) {
      payable = remaining;
    } else if (payFull || config.depositPercent <= 0) {
      payable = booking.amount;
    } else {
      payable = Math.round((booking.amount * config.depositPercent) / 100);
    }
    if (payable <= 0) throw new HttpError(409, 'Nothing left to pay on this booking');

    const order = await createOrder(config, {
      amount: payable,
      currency: 'INR',
      receipt: booking.code,
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: config.provider,
        orderId: order.orderId,
        amount: payable,
        currency: 'INR',
        status: 'CREATED',
      },
    });

    res.status(201).json({
      paymentRecordId: payment.id,
      orderId: order.orderId,
      amount: payable,
      currency: 'INR',
      provider: config.provider,
      keyId: config.keyId,
      methods: config.methods,
      bookingCode: booking.code,
    });
  }),
);

/* ============================ Verify (callback) ============================ */
const verifySchema = z.object({
  paymentRecordId: z.string().min(1),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  mockSuccess: z.boolean().optional(),
});

async function markPaid(paymentId: string, gatewayPaymentId: string, method: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'PAID', paymentId: gatewayPaymentId, method },
  });

  const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
  if (booking) {
    // Sum every captured payment against this booking.
    const paidRows = await prisma.payment.findMany({
      where: { bookingId: booking.id, status: 'PAID' },
      select: { amount: true },
    });
    const amountPaid = paidRows.reduce((s, p) => s + p.amount, 0);
    const balanceDue = Math.max(0, booking.amount - amountPaid);
    const fullyPaid = balanceDue <= 0;
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        amountPaid,
        balanceDue,
        // Advance paid but balance outstanding → RESERVED / PARTIAL.
        paymentStatus: fullyPaid ? 'PAID' : 'PARTIAL',
        status: fullyPaid ? 'CONFIRMED' : 'RESERVED',
      },
    });
  }
  return payment;
}

paymentsRouter.post(
  '/verify',
  validateBody(verifySchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof verifySchema>;
    const payment = await prisma.payment.findUnique({ where: { id: b.paymentRecordId } });
    if (!payment) throw new HttpError(404, 'Payment not found');
    if (payment.status === 'PAID') {
      const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
      return res.json({ status: 'PAID', bookingCode: booking?.code });
    }

    const config = await getPaymentConfig();
    assertGatewayAllowsOrders(config);
    let valid = false;
    let method = 'mock';
    let gatewayPaymentId = `pay_mock_${Date.now()}`;

    if (config.provider === 'razorpay') {
      gatewayPaymentId = b.razorpayPaymentId ?? '';
      valid = verifyPayment(config, {
        orderId: payment.orderId ?? '',
        paymentId: gatewayPaymentId,
        signature: b.razorpaySignature ?? '',
      });
      method = 'card';
    } else if (env.isProduction) {
      valid = false;
    } else {
      valid = b.mockSuccess === true;
    }

    if (!valid) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      throw new HttpError(422, 'Payment verification failed');
    }

    await markPaid(payment.id, gatewayPaymentId, method);
    await recordAudit({ actor: null, action: 'paid', entity: 'Payment', entityId: payment.id });
    void emailConfirmation(payment.bookingId); // guest "confirmed + receipt"
    const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
    res.json({ status: 'PAID', bookingCode: booking?.code });
  }),
);

/* ============================ Webhook (Razorpay) ============================ */
// Raw body is captured by an app-level parser (see app.ts) so the HMAC
// signature can be verified against the exact bytes Razorpay sent.
paymentsRouter.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const config = await getPaymentConfig();
    if (config.provider !== 'razorpay') {
      throw new HttpError(400, 'Webhook not configured for this gateway');
    }
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : '';
    if (!signature || !verifyWebhook(config, rawBody, signature)) {
      throw new HttpError(400, 'Invalid webhook signature');
    }
    const event = JSON.parse(rawBody) as {
      event: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string; method?: string } } };
    };
    if (event.event === 'payment.captured') {
      const entity = event.payload?.payment?.entity;
      const payment = await prisma.payment.findFirst({
        where: { orderId: entity?.order_id ?? '__none__', status: { not: 'PAID' } },
      });
      if (payment) {
        await markPaid(payment.id, entity?.id ?? '', entity?.method ?? 'card');
        await recordAudit({ actor: null, action: 'webhook:paid', entity: 'Payment', entityId: payment.id });
        void emailConfirmation(payment.bookingId);
      }
    }
    res.json({ ok: true });
  }),
);

/* ============================ Refund (admin) ============================ */
paymentsRouter.post(
  '/:bookingId/refund',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw new HttpError(404, 'Booking not found');

    const payment = await prisma.payment.findFirst({
      where: { bookingId: booking.id, status: 'PAID' },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) throw new HttpError(409, 'No captured payment to refund');

    const config = await getPaymentConfig();
    assertGatewayAllowsOrders(config);
    // Refund against everything actually captured on the booking, per policy.
    const refundBase = booking.amountPaid > 0 ? booking.amountPaid : payment.amount;
    const { refundable, penalty } = computeRefund(config, refundBase, booking.checkIn, booking.createdAt);
    if (refundable <= 0) {
      throw new HttpError(409, 'This booking is non-refundable per the cancellation policy');
    }

    const result = await gatewayRefund(config, {
      paymentId: payment.paymentId ?? '',
      amount: refundable,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundId: result.refundId, notes: `Refunded ₹${refundable} (penalty ₹${penalty})` },
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
    });
    await recordAudit({
      actor: req.user,
      action: `refund:${refundable}`,
      entity: 'Payment',
      entityId: payment.id,
    });

    res.json({ refundId: result.refundId, refundAmount: refundable, penalty });
  }),
);

/* ============================ Payments for a booking (admin) ============================ */
paymentsRouter.get(
  '/booking/:bookingId',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK),
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { bookingId: req.params.bookingId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  }),
);
