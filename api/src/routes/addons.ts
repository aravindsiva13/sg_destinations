import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const addonsRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

/** Public: active add-ons offered during the booking flow. */
addonsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const addons = await prisma.addon.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(addons);
  }),
);

/** Admin: everything, including inactive. */
addonsRouter.get(
  '/all',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const addons = await prisma.addon.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(addons);
  }),
);

const addonInput = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().int().min(0).default(0),
  complimentary: z.boolean().default(false),
  category: z.string().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

/** A complimentary add-on always costs 0, whatever price was typed. */
function normalize<T extends { complimentary?: boolean; price?: number }>(b: T): T {
  if (b.complimentary) b.price = 0;
  return b;
}

addonsRouter.post(
  '/',
  ...adminWrite,
  validateBody(addonInput),
  asyncHandler(async (req, res) => {
    const addon = await prisma.addon.create({ data: normalize({ ...req.body }) });
    await recordAudit({ actor: req.user, action: 'create', entity: 'Addon', entityId: addon.id });
    res.status(201).json(addon);
  }),
);

addonsRouter.patch(
  '/:id',
  ...adminWrite,
  validateBody(addonInput.partial()),
  asyncHandler(async (req, res) => {
    const addon = await prisma.addon.update({ where: { id: req.params.id }, data: normalize({ ...req.body }) });
    await recordAudit({ actor: req.user, action: 'update', entity: 'Addon', entityId: addon.id });
    res.json(addon);
  }),
);

addonsRouter.delete(
  '/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.addon.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Addon', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
