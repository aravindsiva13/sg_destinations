import { Router } from 'express';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';

export const dashboardRouter = Router();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

dashboardRouter.get(
  '/stats',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.FRONT_DESK),
  asyncHandler(async (_req, res) => {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [
      bookingsToday,
      checkInsToday,
      checkOutsToday,
      newEnquiries,
      paidAgg,
      activeStays,
      inventoryAgg,
      activeBookings,
      byStatus,
    ] = await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.booking.count({
        where: {
          checkIn: { gte: todayStart, lte: todayEnd },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      }),
      prisma.booking.count({
        where: {
          checkOut: { gte: todayStart, lte: todayEnd },
          status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
        },
      }),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.booking.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.stay.count({ where: { published: true } }),
      prisma.stay.aggregate({ _sum: { inventory: true } }),
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: todayEnd },
          checkOut: { gte: todayStart },
        },
      }),
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const totalInventory = inventoryAgg._sum.inventory ?? 0;
    const occupancy =
      totalInventory > 0 ? Math.round((activeBookings / totalInventory) * 100) : 0;

    // Revenue for the last 6 months (paid bookings, grouped by YYYY-MM).
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const paidBookings = await prisma.booking.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    });

    const months: { key: string; label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: d.toLocaleString('en-US', { month: 'short' }),
        revenue: 0,
      });
    }
    for (const b of paidBookings) {
      const key = `${b.createdAt.getFullYear()}-${String(
        b.createdAt.getMonth() + 1,
      ).padStart(2, '0')}`;
      const m = months.find((x) => x.key === key);
      if (m) m.revenue += b.amount;
    }

    res.json({
      kpis: {
        revenue: paidAgg._sum.amount ?? 0,
        bookingsToday,
        checkInsToday,
        checkOutsToday,
        newEnquiries,
        occupancy,
        activeStays,
      },
      revenueByMonth: months.map(({ label, revenue }) => ({ label, revenue })),
      bookingsByStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
    });
  }),
);
