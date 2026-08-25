import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import { addSubscriber, sendCampaign, unsubscribePage } from '../email/marketing.js';
import { getBrand } from '../email/notify.js';

export const marketingRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

/* ------------------------------ Public: subscribe ------------------------------ */
const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

marketingRouter.post(
  '/subscribe',
  validateBody(subscribeSchema),
  asyncHandler(async (req, res) => {
    const { email, name } = req.body as z.infer<typeof subscribeSchema>;
    await addSubscriber(email, name, 'signup');
    res.status(201).json({ ok: true });
  }),
);

/* ----------------------------- Public: unsubscribe ----------------------------- */
// Clicked from an email; returns a simple HTML confirmation page.
marketingRouter.get(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const token = String(req.query.token ?? '');
    const brand = await getBrand();
    const sub = token ? await prisma.subscriber.findUnique({ where: { token } }) : null;
    if (sub && sub.subscribed) {
      await prisma.subscriber.update({
        where: { id: sub.id },
        data: { subscribed: false, unsubscribedAt: new Date() },
      });
    }
    res.status(sub ? 200 : 404).type('html').send(unsubscribePage(brand.name, Boolean(sub)));
  }),
);

/* ------------------------------- Admin: subscribers ------------------------------- */
marketingRouter.get(
  '/subscribers',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const [subscribers, active] = await Promise.all([
      prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.subscriber.count({ where: { subscribed: true } }),
    ]);
    res.json({ subscribers, active, total: subscribers.length });
  }),
);

/* -------------------------------- Admin: campaigns -------------------------------- */
marketingRouter.get(
  '/campaigns',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(campaigns);
  }),
);

const campaignSchema = z.object({
  subject: z.string().min(1),
  heading: z.string().optional(),
  body: z.string().min(1),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  send: z.boolean().optional(), // true = send now, false/undefined = save draft
});

marketingRouter.post(
  '/campaigns',
  ...adminWrite,
  validateBody(campaignSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof campaignSchema>;
    const campaign = await prisma.campaign.create({
      data: {
        subject: b.subject,
        heading: b.heading || null,
        body: b.body,
        ctaLabel: b.ctaLabel || null,
        ctaHref: b.ctaHref || null,
        trigger: 'manual',
      },
    });
    await recordAudit({ actor: req.user, action: b.send ? 'send' : 'create', entity: 'Campaign', entityId: campaign.id });

    if (b.send) {
      const result = await sendCampaign(campaign);
      const updated = await prisma.campaign.findUnique({ where: { id: campaign.id } });
      return res.status(201).json({ ...updated, ...result });
    }
    res.status(201).json(campaign);
  }),
);

// Send (or re-send) an existing draft campaign.
marketingRouter.post(
  '/campaigns/:id/send',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) throw new HttpError(404, 'Campaign not found');
    const result = await sendCampaign(campaign);
    await recordAudit({ actor: req.user, action: 'send', entity: 'Campaign', entityId: campaign.id });
    const updated = await prisma.campaign.findUnique({ where: { id: campaign.id } });
    res.json({ ...updated, ...result });
  }),
);
