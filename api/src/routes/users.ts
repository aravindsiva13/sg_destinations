import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const usersRouter = Router();

const ROLE_VALUES = [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK, ROLES.CUSTOMER] as const;

const publicUser = (u: {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  active: boolean;
  createdAt: Date;
}) => ({ id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone, active: u.active, createdAt: u.createdAt });

const adminRead = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];
const superOnly = [requireAuth, requireRole(ROLES.SUPER_ADMIN)];

// List (filter by role / search)
usersRouter.get(
  '/',
  ...adminRead,
  asyncHandler(async (req, res) => {
    const { role, q } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(users.map(publicUser));
  }),
);

// Detail + booking history
usersRouter.get(
  '/:id',
  ...adminRead,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, 'User not found');
    const bookings = await prisma.booking.findMany({
      where: { OR: [{ userId: user.id }, { customerEmail: user.email }] },
      orderBy: { createdAt: 'desc' },
      include: { stay: { select: { name: true } } },
    });
    res.json({ ...publicUser(user), bookings });
  }),
);

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(ROLE_VALUES),
  phone: z.string().optional(),
});

usersRouter.post(
  '/',
  ...superOnly,
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof createSchema>;
    const exists = await prisma.user.findUnique({ where: { email: b.email } });
    if (exists) throw new HttpError(409, 'A user with that email already exists');
    const user = await prisma.user.create({
      data: { name: b.name, email: b.email, role: b.role, phone: b.phone, passwordHash: bcrypt.hashSync(b.password, 10) },
    });
    await recordAudit({ actor: req.user, action: `create:${b.role}`, entity: 'User', entityId: user.id });
    res.status(201).json(publicUser(user));
  }),
);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(ROLE_VALUES).optional(),
  phone: z.string().optional().nullable(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

usersRouter.patch(
  '/:id',
  ...superOnly,
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof updateSchema>;
    // Guard: don't let the last active super admin be demoted/deactivated.
    if ((b.role && b.role !== ROLES.SUPER_ADMIN) || b.active === false) {
      const target = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (target?.role === ROLES.SUPER_ADMIN) {
        const admins = await prisma.user.count({ where: { role: ROLES.SUPER_ADMIN, active: true } });
        if (admins <= 1) throw new HttpError(409, 'Cannot remove the last active Super Admin');
      }
    }
    const data: Record<string, unknown> = { ...b };
    if (b.password) {
      data.passwordHash = bcrypt.hashSync(b.password, 10);
      delete data.password;
      // Revoke all existing sessions — the old password must no longer work.
      await prisma.refreshToken.updateMany({ where: { userId: req.params.id }, data: { revoked: true } });
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    await recordAudit({ actor: req.user, action: 'update', entity: 'User', entityId: user.id });
    res.json(publicUser(user));
  }),
);
