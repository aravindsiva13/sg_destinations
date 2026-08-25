import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';

export const reportsRouter = Router();

/**
 * GET /api/reports/summary?from=&to=
 * Revenue/occupancy/source/stay breakdowns over a date window (by booking
 * creation date). Defaults to the last 90 days.
 */
reportsRouter.get(
  '/summary',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query as Record<string, string>;
    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new HttpError(422, '`from` must be a YYYY-MM-DD date');
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new HttpError(422, '`to` must be a YYYY-MM-DD date');
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(Date.now() - 90 * 86_400_000);

    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      include: { stay: { select: { name: true } } },
    });

    const paid = bookings.filter((b) => b.paymentStatus === 'PAID');
    const revenue = paid.reduce((s, b) => s + b.amount, 0);
    const nights = bookings.reduce((s, b) => s + b.nights, 0);
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length;

    const group = <T>(items: T[], key: (t: T) => string, val: (t: T) => number) => {
      const map = new Map<string, number>();
      for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + val(it));
      return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    };

    const inventoryAgg = await prisma.stay.aggregate({ _sum: { inventory: true } });
    const totalInventory = inventoryAgg._sum.inventory ?? 0;
    const windowNights = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000));
    const occupancy = totalInventory > 0 ? Math.round((nights / (totalInventory * windowNights)) * 100) : 0;

    res.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totals: {
        revenue,
        bookings: bookings.length,
        nights,
        cancelled,
        avgBookingValue: paid.length ? Math.round(revenue / paid.length) : 0,
        occupancy,
      },
      revenueBySource: group(paid, (b) => b.source, (b) => b.amount),
      revenueByStay: group(paid, (b) => b.stay?.name ?? '—', (b) => b.amount),
      bookingsByStatus: group(bookings, (b) => b.status, () => 1),
    });
  }),
);
