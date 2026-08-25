import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { REVIEW_STATUS, ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import { onReviewCreated } from '../email/notify.js';

export const reviewsRouter = Router();

const adminRead = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK)];

// Public: approved reviews (optionally per stay). Reviewer emails are PII and
// must never leave the server through this public endpoint.
reviewsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { stayId } = req.query as Record<string, string>;
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED', ...(stayId ? { stayId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews.map(({ email: _email, ...rest }) => rest));
  }),
);

// Public: submit a review (enters moderation queue).
const submitSchema = z.object({
  author: z.string().min(1),
  email: z.string().email().optional(),
  stayId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(1),
});

reviewsRouter.post(
  '/',
  validateBody(submitSchema),
  asyncHandler(async (req, res) => {
    const review = await prisma.review.create({ data: req.body });
    void onReviewCreated(review); // notify staff to moderate
    res.status(201).json({ id: review.id, status: review.status });
  }),
);

// Admin: moderation queue (all statuses, filterable).
reviewsRouter.get(
  '/admin',
  ...adminRead,
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string>;
    const reviews = await prisma.review.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  }),
);

const moderateSchema = z.object({
  status: z.enum(REVIEW_STATUS).optional(),
  reply: z.string().optional().nullable(),
});

reviewsRouter.patch(
  '/:id',
  ...adminRead,
  validateBody(moderateSchema),
  asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0) throw new HttpError(422, 'Nothing to update');
    const review = await prisma.review.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ actor: req.user, action: `moderate:${review.status}`, entity: 'Review', entityId: review.id });
    res.json(review);
  }),
);

reviewsRouter.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    await prisma.review.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Review', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
