import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import { adminEmailConfig, getEmailConfig, saveEmailConfig } from '../email/config.js';
import { sendMail } from '../email/mailer.js';
import { testEmail } from '../email/templates.js';
import { prisma } from '../prisma.js';

export const emailRouter = Router();

const adminOnly = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

emailRouter.get(
  '/config',
  ...adminOnly,
  asyncHandler(async (_req, res) => {
    res.json(adminEmailConfig(await getEmailConfig()));
  }),
);

const configSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(['brevo', 'smtp']).optional(),
  apiKey: z.string().optional(), // blank => keep existing
  fromName: z.string().optional(),
  fromEmail: z.string().email().or(z.literal('')).optional(),
  replyTo: z.string().email().or(z.literal('')).optional(),
  staffRecipients: z.array(z.string().email()).optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpSecure: z.boolean().optional(),
  events: z.record(z.boolean()).optional(),
});

emailRouter.put(
  '/config',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  validateBody(configSchema),
  asyncHandler(async (req, res) => {
    const patch = { ...(req.body as z.infer<typeof configSchema>) };
    // Never overwrite the stored secret with an empty string.
    if (!patch.apiKey) delete patch.apiKey;
    const saved = await saveEmailConfig(patch as never);
    await recordAudit({ actor: req.user, action: 'update', entity: 'EmailConfig' });
    res.json(adminEmailConfig(saved));
  }),
);

const testSchema = z.object({ to: z.string().email() });

emailRouter.post(
  '/test',
  ...adminOnly,
  validateBody(testSchema),
  asyncHandler(async (req, res) => {
    const cfg = await getEmailConfig();
    // Allow a test even while sending is toggled off, so setup can be verified.
    const forced = { ...cfg, enabled: true };
    const rows = await prisma.siteSetting.findFirst({ where: { key: 'resortName' } });
    let name = 'Shraddha Garden Resort';
    if (rows) {
      try {
        name = String(JSON.parse(rows.value));
      } catch {
        name = rows.value;
      }
    }
    const t = testEmail({ name, email: cfg.fromEmail, phone: '', address: '', checkInTime: '', checkOutTime: '' });
    const result = await sendMail({ to: req.body.to, subject: t.subject, html: t.html }, forced);
    if (!result.ok) throw new HttpError(400, result.error ?? 'Failed to send test email');
    res.json({ ok: true });
  }),
);
