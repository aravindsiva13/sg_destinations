import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const settingsRouter = Router();

/** Defaults returned when a key has not been overridden in the DB. */
const DEFAULTS: Record<string, unknown> = {
  resortName: 'Shraddha Garden Resort',
  gstPercent: 12,
  currency: 'INR',
  // When true, a coupon discounts the full room price (including any peak-day
  // surcharge). When false, it only discounts the base price, not the peak part.
  offerAppliesToPeak: true,
  contactEmail: 'hello@shraddhagarden.com',
  contactPhone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  address: 'Shraddha Garden Resort, Tamil Nadu, India',
  checkInTime: '14:00',
  checkOutTime: '11:00',
};

/**
 * Only these keys are exposed on the PUBLIC settings endpoint. Secret configs
 * (e.g. `payments`, `email`) are also stored in SiteSetting but must never be
 * returned to the browser — so the public view is an explicit allow-list.
 */
const PUBLIC_KEYS = Object.keys(DEFAULTS);

async function readAll(): Promise<Record<string, unknown>> {
  const rows = await prisma.siteSetting.findMany();
  const overrides: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      overrides[r.key] = JSON.parse(r.value);
    } catch {
      overrides[r.key] = r.value;
    }
  }
  return { ...DEFAULTS, ...overrides };
}

// Public read — only the allow-listed site config (GST, contact, times).
settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const all = await readAll();
    const view: Record<string, unknown> = {};
    for (const key of PUBLIC_KEYS) view[key] = all[key];
    res.json(view);
  }),
);

// Admin upsert (partial merge of keys) — STRICTLY allow-listed so secret
// blobs (`payments`, `email`, …) can never be written through this route.
// They have dedicated SUPER_ADMIN-only endpoints instead.
const settingsSchema = z
  .object({
    resortName: z.string().min(1).optional(),
    gstPercent: z.coerce.number().min(0).max(100).optional(),
    currency: z.string().min(1).optional(),
    offerAppliesToPeak: z.boolean().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(1).optional(),
    whatsapp: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })
  .strict();

settingsRouter.put(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  validateBody(settingsSchema),
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body as Record<string, unknown>);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) },
        }),
      ),
    );
    await recordAudit({ actor: req.user, action: 'update', entity: 'Settings' });
    // Return the same allow-listed view as the public read — never the
    // `payments`/`email` blobs that also live in SiteSetting.
    const all = await readAll();
    const view: Record<string, unknown> = {};
    for (const key of PUBLIC_KEYS) view[key] = all[key];
    res.json(view);
  }),
);
