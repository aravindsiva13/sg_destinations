import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const mediaRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

mediaRouter.get(
  '/',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const { folder } = req.query as Record<string, string>;
    const media = await prisma.media.findMany({
      where: folder ? { folder } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(media);
  }),
);

const mediaInput = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  folder: z.string().optional(),
});

mediaRouter.post(
  '/',
  ...adminWrite,
  validateBody(mediaInput),
  asyncHandler(async (req, res) => {
    const item = await prisma.media.create({ data: req.body });
    await recordAudit({ actor: req.user, action: 'create', entity: 'Media', entityId: item.id });
    res.status(201).json(item);
  }),
);

mediaRouter.delete(
  '/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.media.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Media', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
