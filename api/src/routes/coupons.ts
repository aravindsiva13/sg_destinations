import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { COUPON_KINDS, ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import type { Coupon } from '@prisma/client';

export const couponsRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

/** Compute the discount a coupon yields for a given subtotal, or an error. */
export function evaluateCoupon(
  coupon: Coupon,
  amount: number,
): { discount: number } | { error: string } {
  const now = new Date();
  if (!coupon.active) return { error: 'This code is not active' };
  if (coupon.startDate && now < coupon.startDate) return { error: 'This code is not yet valid' };
  if (coupon.endDate && now > coupon.endDate) return { error: 'This code has expired' };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { error: 'This code has reached its usage limit' };
  if (amount < coupon.minAmount)
    return { error: `Spend at least ₹${coupon.minAmount.toLocaleString('en-IN')} to use this code` };

  let discount = coupon.kind === 'FLAT' ? coupon.value : Math.round((amount * coupon.value) / 100);
  if (coupon.kind === 'PERCENT' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, amount); // never exceed the subtotal
  return { discount };
}

/* ---------------- Public: validate a code ---------------- */
const validateSchema = z.object({ code: z.string().min(1), amount: z.coerce.number().int().min(0) });

couponsRouter.post(
  '/validate',
  validateBody(validateSchema),
  asyncHandler(async (req, res) => {
    const { code, amount } = req.body as z.infer<typeof validateSchema>;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new HttpError(404, 'Invalid coupon code');

    const result = evaluateCoupon(coupon, amount);
    if ('error' in result) throw new HttpError(422, result.error);
    res.json({
      code: coupon.code,
      description: coupon.description,
      discount: result.discount,
      total: amount - result.discount,
    });
  }),
);

/* ---------------- Admin CRUD ---------------- */
couponsRouter.get(
  '/',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  }),
);

const couponInput = z.object({
  code: z.string().min(2).transform((s) => s.toUpperCase()),
  description: z.string().optional().nullable(),
  kind: z.enum(COUPON_KINDS),
  value: z.coerce.number().int().positive(),
  minAmount: z.coerce.number().int().min(0).default(0),
  maxDiscount: z.coerce.number().int().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
});

function toRow(b: Partial<z.infer<typeof couponInput>>) {
  const row: Record<string, unknown> = { ...b };
  if ('startDate' in b) row.startDate = b.startDate ? new Date(b.startDate) : null;
  if ('endDate' in b) row.endDate = b.endDate ? new Date(b.endDate) : null;
  return row;
}

couponsRouter.post(
  '/',
  ...adminWrite,
  validateBody(couponInput),
  asyncHandler(async (req, res) => {
    const exists = await prisma.coupon.findUnique({ where: { code: req.body.code } });
    if (exists) throw new HttpError(409, 'That code already exists');
    const coupon = await prisma.coupon.create({ data: toRow(req.body) as never });
    await recordAudit({ actor: req.user, action: 'create', entity: 'Coupon', entityId: coupon.id });
    res.status(201).json(coupon);
  }),
);

couponsRouter.patch(
  '/:id',
  ...adminWrite,
  validateBody(couponInput.partial()),
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: toRow(req.body) as never });
    await recordAudit({ actor: req.user, action: 'update', entity: 'Coupon', entityId: coupon.id });
    res.json(coupon);
  }),
);

couponsRouter.delete(
  '/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Coupon', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
