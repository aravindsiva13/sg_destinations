import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';

/**
 * Payments are recorded by staff (cash / UPI / card / bank transfer) from the
 * booking drawer — see PATCH /api/bookings/:id/payment. There is no online
 * gateway; this router only exposes the recorded transactions for a booking.
 */
export const paymentsRouter = Router();

paymentsRouter.get(
  '/booking/:bookingId',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK),
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { bookingId: req.params.bookingId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  }),
);
