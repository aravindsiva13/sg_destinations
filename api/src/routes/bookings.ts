import { Router } from 'express';
import { z } from 'zod';
import type { Booking } from '@prisma/client';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  BOOKING_STATUS,
  BOOKING_TRANSITIONS,
  PAYMENT_STATUS,
  ROLES,
  type BookingStatus,
} from '../constants.js';
import { generateBookingCode } from '../serialize.js';
import { recordAudit } from '../audit.js';
import { quoteStay } from '../pricing.js';
import { evaluateCoupon } from './coupons.js';
import { onBookingReceived, onBookingConfirmed, onBookingCancelled } from '../email/notify.js';
import { subscribeGuest } from '../email/marketing.js';

export const bookingsRouter = Router();

const adminRead = [
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK),
];

/* =============================== Public booking =============================== */
const publicBookingSchema = z.object({
  stayId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().positive(),
  couponCode: z.string().optional(),
  // Selected food items from the menu (qty each) and add-on ids. Prices are
  // resolved server-side from the DB — the client's numbers are never trusted.
  food: z.array(z.object({ itemId: z.string().min(1), qty: z.coerce.number().int().positive() })).optional(),
  addonIds: z.array(z.string().min(1)).optional(),
  notes: z.string().optional(),
});

/** Read the offer-applies-to-peak site setting (defaults to true). */
async function getOfferAppliesToPeak(): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({ where: { key: 'offerAppliesToPeak' } });
  if (!row) return true;
  try {
    return JSON.parse(row.value) !== false;
  } catch {
    return true;
  }
}

interface ExtraLine {
  kind: 'FOOD' | 'ADDON';
  refId: string;
  name: string;
  unitPrice: number;
  qty: number;
}

/** Resolve selected food + add-ons to priced line items (server-authoritative). */
async function resolveExtras(
  food: { itemId: string; qty: number }[] = [],
  addonIds: string[] = [],
): Promise<{ lines: ExtraLine[]; foodAmount: number; addonsAmount: number }> {
  const lines: ExtraLine[] = [];

  if (food.length) {
    const items = await prisma.menuItem.findMany({
      where: { id: { in: food.map((f) => f.itemId) }, available: true },
    });
    for (const sel of food) {
      const item = items.find((i) => i.id === sel.itemId);
      if (!item) continue;
      lines.push({ kind: 'FOOD', refId: item.id, name: item.name, unitPrice: item.price, qty: sel.qty });
    }
  }

  if (addonIds.length) {
    const addons = await prisma.addon.findMany({ where: { id: { in: addonIds }, active: true } });
    for (const a of addons) {
      lines.push({ kind: 'ADDON', refId: a.id, name: a.name, unitPrice: a.complimentary ? 0 : a.price, qty: 1 });
    }
  }

  const foodAmount = lines.filter((l) => l.kind === 'FOOD').reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const addonsAmount = lines.filter((l) => l.kind === 'ADDON').reduce((s, l) => s + l.unitPrice * l.qty, 0);
  return { lines, foodAmount, addonsAmount };
}

// Unauthenticated booking creation for the public site's booking flow.
bookingsRouter.post(
  '/public',
  validateBody(publicBookingSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof publicBookingSchema>;
    const stay = await prisma.stay.findUnique({ where: { id: b.stayId } });
    if (!stay || !stay.published) throw new HttpError(404, 'Stay not available');

    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    if (!(checkOut > checkIn)) throw new HttpError(422, 'Check-out must be after check-in');
    if (b.guests > stay.capacity) throw new HttpError(422, `This stay sleeps up to ${stay.capacity} guests`);

    const [overlap, blocks, rules] = await Promise.all([
      prisma.booking.findMany({
        where: { stayId: stay.id, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
        select: { stayId: true, checkIn: true, checkOut: true, status: true },
      }),
      prisma.dateBlock.findMany({ where: { stayId: stay.id, startDate: { lt: checkOut }, endDate: { gt: checkIn } } }),
      prisma.rateRule.findMany({ where: { active: true } }),
    ]);
    const quote = quoteStay(stay, checkIn, checkOut, overlap, blocks, rules);
    if (!quote.available) throw new HttpError(409, quote.unavailableReason ?? 'Not available for these dates');

    // Food + add-ons, priced from the DB.
    const { lines, foodAmount, addonsAmount } = await resolveExtras(b.food, b.addonIds);

    // Optional coupon. The discount base depends on the offer-applies-to-peak
    // setting: full room price (incl. peak surcharge) vs base price only.
    const offerAppliesToPeak = await getOfferAppliesToPeak();
    const baseSubtotal = quote.nights * stay.pricePerNight;
    const couponBase = offerAppliesToPeak ? quote.subtotal : Math.min(baseSubtotal, quote.subtotal);

    let discount = 0;
    let couponCode: string | null = null;
    if (b.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: b.couponCode.toUpperCase() } });
      if (!coupon) throw new HttpError(404, 'Invalid coupon code');
      const evalResult = evaluateCoupon(coupon, couponBase);
      if ('error' in evalResult) throw new HttpError(422, evalResult.error);
      discount = Math.min(evalResult.discount, quote.subtotal);
      couponCode = coupon.code;
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }

    const roomAmount = quote.subtotal - discount;
    const amount = roomAmount + foodAmount + addonsAmount;
    const booking = await prisma.booking.create({
      data: {
        code: generateBookingCode(),
        stayId: stay.id,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        checkIn,
        checkOut,
        nights: quote.nights,
        guests: b.guests,
        amount,
        roomAmount,
        foodAmount,
        addonsAmount,
        discount,
        extras: JSON.stringify(lines),
        source: 'Website',
        notes: [b.notes, couponCode ? `Coupon ${couponCode} (-${discount})` : null].filter(Boolean).join(' · ') || null,
      },
    });
    await recordAudit({ actor: null, action: 'create:public', entity: 'Booking', entityId: booking.id });
    void onBookingReceived(booking, stay); // guest "received" + staff alert
    void subscribeGuest(booking.customerEmail, booking.customerName); // opt into promos

    res.status(201).json({
      id: booking.id,
      code: booking.code,
      amount: booking.amount,
      nights: booking.nights,
      discount,
      subtotal: quote.subtotal,
      roomAmount,
      foodAmount,
      addonsAmount,
    });
  }),
);

// Customer-facing self-service cancellation. Only the guest who made the
// booking (matched by account or email) may cancel it, and only before the
// stay has started. Refunds are handled separately by staff.
bookingsRouter.post(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const current = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, 'Booking not found');

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(404, 'User not found');
    const owns =
      current.userId === user.id || current.customerEmail.toLowerCase() === user.email.toLowerCase();
    if (!owns) throw new HttpError(403, 'You can only cancel your own bookings');

    const cancellable = ['PENDING', 'RESERVED', 'CONFIRMED'] as const;
    if (!cancellable.includes(current.status as (typeof cancellable)[number])) {
      throw new HttpError(409, `A ${current.status} booking cannot be cancelled online`);
    }

    const booking = await prisma.booking.update({
      where: { id: current.id },
      data: { status: 'CANCELLED' },
    });
    await recordAudit({
      actor: req.user,
      action: `customer-cancel:${current.status}→CANCELLED`,
      entity: 'Booking',
      entityId: booking.id,
    });
    const stay = await prisma.stay.findUnique({ where: { id: booking.stayId } });
    if (stay) void onBookingCancelled(booking, stay);
    res.json(booking);
  }),
);

// Guest self-service: look up a booking by reference code + booking email.
// This lets someone who booked as a guest (no account) check their booking
// status and pay any balance due. Both the code and the email must match.
bookingsRouter.get(
  '/lookup',
  asyncHandler(async (req, res) => {
    const { code, email } = req.query as Record<string, string>;
    if (!code || !email) throw new HttpError(422, 'Both code and email are required');
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[A-Z0-9-]{4,20}$/.test(cleanCode)) throw new HttpError(422, 'Invalid booking reference');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      throw new HttpError(422, 'Invalid email address');
    }

    // Codes are stored uppercase; emails are matched case-insensitively below.
    const booking = (await prisma.booking.findFirst({
      where: { code: cleanCode },
      include: { stay: { select: { name: true, slug: true, heroImage: true } } },
    })) as (Omit<Booking, 'stay'> & { stay: { name: string; slug: string; heroImage: string } | null }) | null;

    if (!booking || booking.customerEmail.toLowerCase() !== cleanEmail) {
      throw new HttpError(404, 'No booking found for that code and email');
    }

    res.json({
      id: booking.id,
      code: booking.code,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      amount: booking.amount,
      amountPaid: booking.amountPaid,
      balanceDue: booking.balanceDue,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      stay: booking.stay,
    });
  }),
);

// List with filter/search/pagination
bookingsRouter.get(
  '/',
  ...adminRead,
  asyncHandler(async (req, res) => {
    const { status, q, from, to } = req.query as Record<string, string>;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new HttpError(422, '`from` must be a YYYY-MM-DD date');
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new HttpError(422, '`to` must be a YYYY-MM-DD date');
    if (q && q.length > 200) throw new HttpError(422, '`q` is too long');

    const where: Record<string, unknown> = {};
    if (status && BOOKING_STATUS.includes(status as BookingStatus)) where.status = status;
    if (from || to) {
      where.checkIn = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { code: { contains: q } },
        { customerName: { contains: q } },
        { customerEmail: { contains: q } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: { stay: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ data: rows, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
  }),
);

bookingsRouter.get(
  '/:id',
  ...adminRead,
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { stay: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!booking) throw new HttpError(404, 'Booking not found');
    res.json(booking);
  }),
);

// Create (also used by the public booking flow later)
const createSchema = z.object({
  stayId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().positive().default(2),
  source: z.string().default('Website'),
  notes: z.string().optional(),
  // Optional manual price override — when set, it replaces the computed total.
  amount: z.coerce.number().int().min(0).optional(),
});

bookingsRouter.post(
  '/',
  ...adminRead,
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof createSchema>;
    const stay = await prisma.stay.findUnique({ where: { id: b.stayId } });
    if (!stay) throw new HttpError(404, 'Stay not found');

    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    if (!(checkOut > checkIn)) throw new HttpError(422, 'Check-out must be after check-in');

    // Price + availability via the pricing engine (rate rules, inventory, blocks).
    const [overlapBookings, blocks, rules] = await Promise.all([
      prisma.booking.findMany({
        where: { stayId: stay.id, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
        select: { stayId: true, checkIn: true, checkOut: true, status: true },
      }),
      prisma.dateBlock.findMany({ where: { stayId: stay.id, startDate: { lt: checkOut }, endDate: { gt: checkIn } } }),
      prisma.rateRule.findMany({ where: { active: true } }),
    ]);
    const quote = quoteStay(stay, checkIn, checkOut, overlapBookings, blocks, rules);
    // Front-desk overrides are allowed, but block hard conflicts.
    if (!quote.available && quote.unavailableReason === 'Dates are blocked') {
      throw new HttpError(409, quote.unavailableReason);
    }
    if (quote.unitsLeft <= 0) {
      throw new HttpError(409, 'No inventory left for these dates');
    }

    // Manual price override (custom price) or the computed total.
    const amount = b.amount != null ? b.amount : quote.subtotal;
    const booking = await prisma.booking.create({
      data: {
        code: generateBookingCode(),
        stayId: stay.id,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        checkIn,
        checkOut,
        nights: quote.nights,
        guests: b.guests,
        amount,
        roomAmount: amount,
        balanceDue: amount,
        source: b.source,
        notes: b.notes,
      },
    });
    await recordAudit({
      actor: req.user,
      action: b.amount != null ? 'create:custom-price' : 'create',
      entity: 'Booking',
      entityId: booking.id,
    });
    res.status(201).json(booking);
  }),
);

// Status transition (state machine enforced)
const statusSchema = z.object({ status: z.enum(BOOKING_STATUS) });

bookingsRouter.patch(
  '/:id/status',
  ...adminRead,
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body as z.infer<typeof statusSchema>;
    const current = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, 'Booking not found');

    const allowed = BOOKING_TRANSITIONS[current.status as BookingStatus] ?? [];
    if (current.status !== status && !allowed.includes(status)) {
      throw new HttpError(
        409,
        `Cannot move a ${current.status} booking to ${status}`,
      );
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });
    await recordAudit({
      actor: req.user,
      action: `status:${current.status}→${status}`,
      entity: 'Booking',
      entityId: booking.id,
    });
    if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
      const stay = await prisma.stay.findUnique({ where: { id: booking.stayId } });
      if (stay) void onBookingCancelled(booking, stay);
    }
    res.json(booking);
  }),
);

// Payment status (managers and above)
const paymentSchema = z.object({ paymentStatus: z.enum(PAYMENT_STATUS) });

bookingsRouter.patch(
  '/:id/payment',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  validateBody(paymentSchema),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { paymentStatus: req.body.paymentStatus },
    });
    await recordAudit({
      actor: req.user,
      action: `payment:${req.body.paymentStatus}`,
      entity: 'Booking',
      entityId: booking.id,
    });
    if (req.body.paymentStatus === 'PAID') {
      const stay = await prisma.stay.findUnique({ where: { id: booking.stayId } });
      if (stay) void onBookingConfirmed(booking, stay);
    }
    res.json(booking);
  }),
);
