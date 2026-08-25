import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../auth/tokens.js';
import type { Role } from '../constants.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';
import { env } from '../env.js';
import { sendMail } from '../email/mailer.js';
import { getEmailConfig } from '../email/config.js';
import { getBrand } from '../email/notify.js';
import { passwordReset } from '../email/templates.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
}) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone };
}

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    // Customer accounts cannot sign into the admin portal. Return the generic
    // failure message so account existence is not disclosed.
    if (!user || !user.active || user.role === ROLES.CUSTOMER) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.name,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ sub: user.id });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiryDate() },
    });

    await recordAudit({
      actor: { sub: user.id, email: user.email, role: user.role as Role, name: user.name },
      action: 'login',
      entity: 'Auth',
      entityId: user.id,
    });
    res.json({ accessToken, refreshToken, user: publicUser(user) });
  }),
);

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

authRouter.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    let decoded: { sub: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, 'Invalid refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new HttpError(401, 'Refresh token expired');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.active) throw new HttpError(401, 'User no longer active');

    // Rotate: revoke the old token, issue a new pair.
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    const newRefresh = signRefreshToken({ sub: user.id });
    await prisma.refreshToken.create({
      data: { token: newRefresh, userId: user.id, expiresAt: refreshExpiryDate() },
    });
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.name,
    });

    res.json({ accessToken, refreshToken: newRefresh, user: publicUser(user) });
  }),
);

authRouter.post(
  '/logout',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    await prisma.refreshToken
      .updateMany({ where: { token: refreshToken }, data: { revoked: true } })
      .catch(() => undefined);
    res.json({ ok: true });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ user: publicUser(user) });
  }),
);

// Public customer self-registration (always creates a CUSTOMER).
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof registerSchema>;
    const exists = await prisma.user.findUnique({ where: { email: b.email } });
    if (exists) throw new HttpError(409, 'An account with that email already exists');
    const bcryptMod = await import('bcryptjs');
    const user = await prisma.user.create({
      data: {
        name: b.name,
        email: b.email,
        phone: b.phone,
        role: 'CUSTOMER',
        passwordHash: bcryptMod.default.hashSync(b.password, 10),
      },
    });
    const payload = { sub: user.id, email: user.email, role: user.role as Role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ sub: user.id });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiryDate() },
    });
    res.status(201).json({ accessToken, refreshToken, user: publicUser(user) });
  }),
);

/* ------------------------- Forgot / reset password ------------------------- */
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const forgotSchema = z.object({ email: z.string().email() });

authRouter.post(
  '/forgot-password',
  validateBody(forgotSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way — never reveal whether the email exists.
    if (user && user.active) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      });
      const resetUrl = `${env.publicUrl}/reset-password?token=${token}`;
      const [cfg, brand] = await Promise.all([getEmailConfig(), getBrand()]);
      const rendered = passwordReset(brand, user.name, resetUrl);
      void sendMail({ to: user.email, subject: rendered.subject, html: rendered.html }, cfg).then((r) => {
        if (!r.ok) console.warn('[email] password reset not sent:', r.error);
      });
    }
    res.json({ ok: true });
  }),
);

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

authRouter.post(
  '/reset-password',
  validateBody(resetSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new HttpError(400, 'This reset link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Revoke all existing sessions so the old password can no longer refresh a token.
      prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
    ]);

    await recordAudit({ actor: null, action: 'reset-password', entity: 'User', entityId: record.userId });
    res.json({ ok: true });
  }),
);

// The signed-in customer's own bookings (matched by id or email).
authRouter.get(
  '/me/bookings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(404, 'User not found');
    const bookings = await prisma.booking.findMany({
      where: { OR: [{ userId: user.id }, { customerEmail: user.email }] },
      orderBy: { createdAt: 'desc' },
      include: { stay: { select: { name: true, slug: true, heroImage: true } } },
    });
    res.json(bookings);
  }),
);
