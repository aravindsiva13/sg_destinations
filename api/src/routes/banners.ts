import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { BANNER_TYPES, ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const bannersRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

function activeNow() {
  const now = new Date();
  return {
    active: true,
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
  };
}

// Public: currently-active banners (optionally by type).
bannersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type } = req.query as Record<string, string>;
    const banners = await prisma.banner.findMany({
      where: { ...activeNow(), ...(type ? { type } : {}) },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(banners);
  }),
);

// Admin: everything (incl. inactive/scheduled).
bannersRouter.get(
  '/all',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const banners = await prisma.banner.findMany({ orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] });
    res.json(banners);
  }),
);

const bannerInput = z.object({
  type: z.enum(BANNER_TYPES),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

function toRow(b: Partial<z.infer<typeof bannerInput>>) {
  const row: Record<string, unknown> = { ...b };
  if ('startDate' in b) row.startDate = b.startDate ? new Date(b.startDate) : null;
  if ('endDate' in b) row.endDate = b.endDate ? new Date(b.endDate) : null;
  return row;
}

bannersRouter.post(
  '/',
  ...adminWrite,
  validateBody(bannerInput),
  asyncHandler(async (req, res) => {
    const banner = await prisma.banner.create({ data: toRow(req.body) as never });
    await recordAudit({ actor: req.user, action: 'create', entity: 'Banner', entityId: banner.id });
    res.status(201).json(banner);
  }),
);

bannersRouter.patch(
  '/:id',
  ...adminWrite,
  validateBody(bannerInput.partial()),
  asyncHandler(async (req, res) => {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: toRow(req.body) as never });
    await recordAudit({ actor: req.user, action: 'update', entity: 'Banner', entityId: banner.id });
    res.json(banner);
  }),
);

bannersRouter.delete(
  '/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.banner.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Banner', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
