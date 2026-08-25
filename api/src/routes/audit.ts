import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';

export const auditRouter = Router();

// Audit log is sensitive — Super Admin only.
auditRouter.get(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    const { entity } = req.query as Record<string, string>;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 30)));
    const where = entity ? { entity } : {};

    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ data: rows, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
  }),
);
