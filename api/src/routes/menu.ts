import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const menuRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

const categoryInput = z.object({
  name: z.string().min(1),
  note: z.string().optional().nullable(),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const itemInput = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().int().min(0),
  veg: z.boolean().optional().nullable(),
  available: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

const itemOrder: { sortOrder: 'asc' }[] = [{ sortOrder: 'asc' }];

// Public menu: only published categories and available items.
menuRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.menuCategory.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { items: { where: { available: true }, orderBy: itemOrder } },
    });
    // Hide categories that have ended up with no visible items.
    res.json(categories.filter((c) => c.items.length > 0));
  }),
);

// Admin menu: everything, including unpublished categories and hidden items.
menuRouter.get(
  '/all',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.menuCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { items: { orderBy: itemOrder } },
    });
    res.json(categories);
  }),
);

/* ---------------- Categories ---------------- */
menuRouter.post(
  '/categories',
  ...adminWrite,
  validateBody(categoryInput),
  asyncHandler(async (req, res) => {
    const category = await prisma.menuCategory.create({ data: req.body });
    await recordAudit({ actor: req.user, action: 'create', entity: 'MenuCategory', entityId: category.id });
    res.status(201).json({ ...category, items: [] });
  }),
);

menuRouter.patch(
  '/categories/:id',
  ...adminWrite,
  validateBody(categoryInput.partial()),
  asyncHandler(async (req, res) => {
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body,
      include: { items: { orderBy: itemOrder } },
    });
    await recordAudit({ actor: req.user, action: 'update', entity: 'MenuCategory', entityId: category.id });
    res.json(category);
  }),
);

menuRouter.delete(
  '/categories/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.menuCategory.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'MenuCategory', entityId: req.params.id });
    res.json({ ok: true });
  }),
);

/* ---------------- Items ---------------- */
menuRouter.post(
  '/items',
  ...adminWrite,
  validateBody(itemInput),
  asyncHandler(async (req, res) => {
    const item = await prisma.menuItem.create({ data: req.body });
    await recordAudit({ actor: req.user, action: 'create', entity: 'MenuItem', entityId: item.id });
    res.status(201).json(item);
  }),
);

menuRouter.patch(
  '/items/:id',
  ...adminWrite,
  validateBody(itemInput.partial()),
  asyncHandler(async (req, res) => {
    const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ actor: req.user, action: 'update', entity: 'MenuItem', entityId: item.id });
    res.json(item);
  }),
);

menuRouter.delete(
  '/items/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'MenuItem', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
