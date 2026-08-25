import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { CONTENT_TYPES, ROLES, type ContentType } from '../constants.js';
import { serializeContent } from '../serialize.js';
import { recordAudit } from '../audit.js';
import { maybeAnnounceOffer } from '../email/marketing.js';

export const contentRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

function assertType(t: string): ContentType {
  if (!CONTENT_TYPES.includes(t as ContentType)) throw new HttpError(404, 'Unknown content type');
  return t as ContentType;
}

const contentInput = z.object({
  type: z.enum(CONTENT_TYPES),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  title: z.string().min(1),
  category: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  excerpt: z.string().min(1),
  body: z.array(z.string()).default([]),
  heroImage: z.string().url(),
  gallery: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  priceLabel: z.string().optional().nullable(),
  meta: z.record(z.unknown()).default({}),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

function toRow(data: Partial<z.infer<typeof contentInput>>) {
  const row: Record<string, unknown> = { ...data };
  if (data.body) row.body = JSON.stringify(data.body);
  if (data.gallery) row.gallery = JSON.stringify(data.gallery);
  if (data.tags) row.tags = JSON.stringify(data.tags);
  if (data.meta) row.meta = JSON.stringify(data.meta);
  return row;
}

// Public list for a type: /api/content/:type?published=true
contentRouter.get(
  '/:type',
  asyncHandler(async (req, res) => {
    const type = assertType(req.params.type.toUpperCase());
    const where: Record<string, unknown> = { type };
    if (req.query.published === 'true') where.published = true;
    if (req.query.featured === 'true') where.featured = true;
    const items = await prisma.contentItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(items.map(serializeContent));
  }),
);

// Public detail: /api/content/:type/:slug
contentRouter.get(
  '/:type/:slug',
  asyncHandler(async (req, res) => {
    const type = assertType(req.params.type.toUpperCase());
    const item = await prisma.contentItem.findUnique({
      where: { type_slug: { type, slug: req.params.slug } },
    });
    if (!item) throw new HttpError(404, 'Not found');
    res.json(serializeContent(item));
  }),
);

contentRouter.post(
  '/',
  ...adminWrite,
  validateBody(contentInput),
  asyncHandler(async (req, res) => {
    const exists = await prisma.contentItem.findUnique({
      where: { type_slug: { type: req.body.type, slug: req.body.slug } },
    });
    if (exists) throw new HttpError(409, 'An item with that slug already exists for this type');
    const item = await prisma.contentItem.create({ data: toRow(req.body) as never });
    await recordAudit({ actor: req.user, action: 'create', entity: `Content:${item.type}`, entityId: item.id });
    // Auto-announce new published offers to subscribers (if the toggle is on).
    if (item.type === 'OFFER' && item.published) {
      void maybeAnnounceOffer({ title: item.title, excerpt: item.excerpt, slug: item.slug, priceLabel: item.priceLabel });
    }
    res.status(201).json(serializeContent(item));
  }),
);

contentRouter.patch(
  '/:id',
  ...adminWrite,
  validateBody(contentInput.partial()),
  asyncHandler(async (req, res) => {
    const item = await prisma.contentItem.update({
      where: { id: req.params.id },
      data: toRow(req.body) as never,
    });
    await recordAudit({ actor: req.user, action: 'update', entity: `Content:${item.type}`, entityId: item.id });
    res.json(serializeContent(item));
  }),
);

contentRouter.delete(
  '/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.contentItem.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Content', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
