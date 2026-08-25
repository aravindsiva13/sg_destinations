import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { RATE_KINDS, ROLES } from '../constants.js';
import { quoteStay } from '../pricing.js';
import { serializeStay } from '../serialize.js';
import { recordAudit } from '../audit.js';

export const availabilityRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

/* ============================ Public availability ============================ */

const checkSchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().positive().default(2),
  stayId: z.string().optional(),
});

/**
 * POST /api/availability/check — returns every published stay (or one) with a
 * per-night price quote and availability for the requested dates.
 */
availabilityRouter.post(
  '/check',
  validateBody(checkSchema),
  asyncHandler(async (req, res) => {
    const { checkIn, checkOut, guests, stayId } = req.body as z.infer<typeof checkSchema>;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (!(outDate > inDate)) throw new HttpError(422, 'Check-out must be after check-in');

    const stays = await prisma.stay.findMany({
      where: { published: true, ...(stayId ? { id: stayId } : {}) },
      orderBy: { pricePerNight: 'asc' },
    });

    const [bookings, blocks, rules] = await Promise.all([
      prisma.booking.findMany({
        where: { checkIn: { lt: outDate }, checkOut: { gt: inDate } },
        select: { stayId: true, checkIn: true, checkOut: true, status: true },
      }),
      prisma.dateBlock.findMany({ where: { startDate: { lt: outDate }, endDate: { gt: inDate } } }),
      prisma.rateRule.findMany({ where: { active: true } }),
    ]);

    const results = stays.map((stay) => {
      const quote = quoteStay(
        stay,
        inDate,
        outDate,
        bookings.filter((b) => b.stayId === stay.id),
        blocks.filter((b) => b.stayId === stay.id),
        rules,
      );
      // Capacity check folds into availability.
      const fitsGuests = guests <= stay.capacity;
      return {
        stay: serializeStay(stay),
        ...quote,
        available: quote.available && fitsGuests,
        unavailableReason: !fitsGuests
          ? `Sleeps up to ${stay.capacity} guests`
          : quote.unavailableReason,
      };
    });

    res.json({ checkIn, checkOut, guests, results });
  }),
);

/* ============================== Rate rules (admin) ============================== */

availabilityRouter.get(
  '/rate-rules',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const { stayId } = req.query as Record<string, string>;
    const rules = await prisma.rateRule.findMany({
      where: stayId ? { OR: [{ stayId }, { stayId: null }] } : {},
      orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
      include: { stay: { select: { name: true } } },
    });
    res.json(rules);
  }),
);

const ruleSchema = z.object({
  name: z.string().min(1),
  stayId: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  kind: z.enum(RATE_KINDS),
  amount: z.coerce.number().int(),
  minStay: z.coerce.number().int().min(1).default(1),
  priority: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

availabilityRouter.post(
  '/rate-rules',
  ...adminWrite,
  validateBody(ruleSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof ruleSchema>;
    if (!(new Date(b.endDate) > new Date(b.startDate)))
      throw new HttpError(422, 'End date must be after start date');
    const rule = await prisma.rateRule.create({
      data: {
        name: b.name,
        stayId: b.stayId || null,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        kind: b.kind,
        amount: b.amount,
        minStay: b.minStay,
        priority: b.priority,
        active: b.active,
      },
    });
    await recordAudit({ actor: req.user, action: 'create', entity: 'RateRule', entityId: rule.id });
    res.status(201).json(rule);
  }),
);

availabilityRouter.patch(
  '/rate-rules/:id',
  ...adminWrite,
  validateBody(ruleSchema.partial()),
  asyncHandler(async (req, res) => {
    const b = req.body as Partial<z.infer<typeof ruleSchema>>;
    const data: Record<string, unknown> = { ...b };
    if (b.startDate) data.startDate = new Date(b.startDate);
    if (b.endDate) data.endDate = new Date(b.endDate);
    if ('stayId' in b) data.stayId = b.stayId || null;
    const rule = await prisma.rateRule.update({ where: { id: req.params.id }, data });
    await recordAudit({ actor: req.user, action: 'update', entity: 'RateRule', entityId: rule.id });
    res.json(rule);
  }),
);

availabilityRouter.delete(
  '/rate-rules/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.rateRule.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'RateRule', entityId: req.params.id });
    res.json({ ok: true });
  }),
);

/* =============================== Date blocks (admin) =============================== */

availabilityRouter.get(
  '/blocks',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const { stayId } = req.query as Record<string, string>;
    const blocks = await prisma.dateBlock.findMany({
      where: stayId ? { stayId } : {},
      orderBy: { startDate: 'asc' },
      include: { stay: { select: { name: true } } },
    });
    res.json(blocks);
  }),
);

const blockSchema = z.object({
  stayId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

availabilityRouter.post(
  '/blocks',
  ...adminWrite,
  validateBody(blockSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof blockSchema>;
    if (!(new Date(b.endDate) > new Date(b.startDate)))
      throw new HttpError(422, 'End date must be after start date');
    const block = await prisma.dateBlock.create({
      data: {
        stayId: b.stayId,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        reason: b.reason,
      },
    });
    await recordAudit({ actor: req.user, action: 'create', entity: 'DateBlock', entityId: block.id });
    res.status(201).json(block);
  }),
);

availabilityRouter.delete(
  '/blocks/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.dateBlock.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'DateBlock', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
