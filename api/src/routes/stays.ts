import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { serializeStay } from '../serialize.js';
import { recordAudit } from '../audit.js';

export const staysRouter = Router();

const amenitySchema = z.object({ label: z.string(), icon: z.string() });

const stayInput = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and dashes'),
  name: z.string().min(1),
  badge: z.string().optional().nullable(),
  pricePerNight: z.number().int().positive(),
  rating: z.number().min(0).max(5).default(4.8),
  shortIntro: z.string().min(1),
  description: z.array(z.string()).default([]),
  heroImage: z.string().url(),
  gallery: z.array(z.string().url()).default([]),
  amenities: z.array(amenitySchema).default([]),
  capacity: z.number().int().positive().default(2),
  beds: z.string().default('1 Double Bed'),
  inventory: z.number().int().min(0).default(1),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

const stayUpdate = stayInput.partial();

/** Pack array fields into JSON strings for the SQLite columns. */
function toRow(data: Partial<z.infer<typeof stayInput>>) {
  const row: Record<string, unknown> = { ...data };
  if (data.description) row.description = JSON.stringify(data.description);
  if (data.gallery) row.gallery = JSON.stringify(data.gallery);
  if (data.amenities) row.amenities = JSON.stringify(data.amenities);
  return row;
}

// Public list (supports ?published=true and ?featured=true)
staysRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where: Record<string, unknown> = {};
    if (req.query.published === 'true') where.published = true;
    if (req.query.featured === 'true') where.featured = true;
    const stays = await prisma.stay.findMany({ where, orderBy: { createdAt: 'asc' } });
    res.json(stays.map(serializeStay));
  }),
);

// Public detail by slug
staysRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const stay = await prisma.stay.findUnique({ where: { slug: req.params.slug } });
    if (!stay) throw new HttpError(404, 'Stay not found');
    res.json(serializeStay(stay));
  }),
);

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

staysRouter.post(
  '/',
  ...adminWrite,
  validateBody(stayInput),
  asyncHandler(async (req, res) => {
    const exists = await prisma.stay.findUnique({ where: { slug: req.body.slug } });
    if (exists) throw new HttpError(409, 'A stay with that slug already exists');
    const stay = await prisma.stay.create({ data: toRow(req.body) as never });
    await recordAudit({ actor: req.user, action: 'create', entity: 'Stay', entityId: stay.id });
    res.status(201).json(serializeStay(stay));
  }),
);

staysRouter.patch(
  '/:id',
  ...adminWrite,
  validateBody(stayUpdate),
  asyncHandler(async (req, res) => {
    const stay = await prisma.stay.update({
      where: { id: req.params.id },
      data: toRow(req.body) as never,
    });
    await recordAudit({ actor: req.user, action: 'update', entity: 'Stay', entityId: stay.id });
    res.json(serializeStay(stay));
  }),
);

staysRouter.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const count = await prisma.booking.count({ where: { stayId: req.params.id } });
    if (count > 0) {
      throw new HttpError(409, 'Cannot delete a stay that has bookings');
    }
    await prisma.stay.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Stay', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
