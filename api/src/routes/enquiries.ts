import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ENQUIRY_STATUS, ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import { onEnquiryCreated } from '../email/notify.js';

export const enquiriesRouter = Router();

// Public create (from the enquiry/contact forms)
const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  occasion: z.string().optional(),
  guests: z.number().int().positive().optional(),
  message: z.string().optional(),
  source: z.string().default('Enquiry Form'),
});

enquiriesRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const enquiry = await prisma.enquiry.create({ data: req.body });
    void onEnquiryCreated(enquiry); // fire-and-forget (guest ack + staff alert)
    res.status(201).json(enquiry);
  }),
);

const adminRead = [
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK),
];

enquiriesRouter.get(
  '/',
  ...adminRead,
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string>;
    const where = status ? { status } : {};
    const rows = await prisma.enquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  }),
);

const updateSchema = z.object({
  status: z.enum(ENQUIRY_STATUS).optional(),
  assignee: z.string().optional().nullable(),
});

enquiriesRouter.patch(
  '/:id',
  ...adminRead,
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    if (Object.keys(req.body).length === 0) throw new HttpError(422, 'Nothing to update');
    const enquiry = await prisma.enquiry.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entity: 'Enquiry',
      entityId: enquiry.id,
    });
    res.json(enquiry);
  }),
);
