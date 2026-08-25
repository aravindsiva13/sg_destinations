import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, notFound } from '../middleware/error.js';
import { ROLES } from '../constants.js';

vi.mock('../prisma.js', () => ({
  prisma: {
    booking: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    stay: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock('../auth/tokens.js', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'customer-token') {
      return { sub: 'u1', email: 'cust@x.com', role: ROLES.CUSTOMER, name: 'Customer' };
    }
    throw new Error('invalid token');
  }),
}));

vi.mock('../email/notify.js', () => ({
  onBookingCancelled: vi.fn(),
  onBookingConfirmed: vi.fn(),
  onBookingReceived: vi.fn(),
}));

import { prisma } from '../prisma.js';
import { bookingsRouter } from '../routes/bookings.js';

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    code: 'SG-1001',
    stayId: 's1',
    userId: 'u1',
    customerName: 'Customer',
    customerEmail: 'cust@x.com',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    checkIn: new Date('2026-12-01'),
    checkOut: new Date('2026-12-03'),
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingsRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

const OWNER = {
  id: 'u1',
  email: 'cust@x.com',
  name: 'Customer',
  role: ROLES.CUSTOMER,
  phone: null,
  active: true,
};

describe('GET /api/bookings/lookup (guest self-service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 422 when code or email is missing', async () => {
    const res = await request(buildApp()).get('/api/bookings/lookup?code=SG-ABC123');
    expect(res.status).toBe(422);
  });

  it('returns 404 when no booking matches code + email', async () => {
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/bookings/lookup')
      .query({ code: 'SG-ABC123', email: 'cust@x.com' });
    expect(res.status).toBe(404);
  });

  it('returns a serialized booking for a matching code + email', async () => {
    vi.mocked(prisma.booking.findFirst).mockResolvedValue({
      id: 'b1',
      code: 'SG-ABC123',
      stayId: 's1',
      customerName: 'Customer',
      customerEmail: 'cust@x.com',
      checkIn: new Date('2026-12-01'),
      checkOut: new Date('2026-12-03'),
      nights: 2,
      guests: 2,
      amount: 9000,
      amountPaid: 4500,
      balanceDue: 4500,
      status: 'RESERVED',
      paymentStatus: 'PARTIAL',
      stay: { name: 'Garden Villa', slug: 'garden-villa', heroImage: 'https://example.com/h.jpg' },
    } as never);

    const res = await request(buildApp())
      .get('/api/bookings/lookup')
      .query({ code: 'SG-ABC123', email: 'cust@x.com' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SG-ABC123');
    expect(res.body.balanceDue).toBe(4500);
    expect(res.body.stay.name).toBe('Garden Villa');
  });
});

describe('POST /api/bookings/:id/cancel (customer self-service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(OWNER as never);
    vi.mocked(prisma.stay.findUnique).mockResolvedValue({ id: 's1', name: 'Garden Villa' } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
  });

  it('returns 401 without an Authorization header', async () => {
    const res = await request(buildApp()).post('/api/bookings/b1/cancel');
    expect(res.status).toBe(401);
  });

  it('returns 404 when the booking does not exist', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    const res = await request(buildApp())
      .post('/api/bookings/b1/cancel')
      .set('Authorization', 'Bearer customer-token');
    expect(res.status).toBe(404);
  });

  it('returns 403 when the booking belongs to someone else', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(
      makeBooking({ customerEmail: 'other@x.com', userId: null }) as never,
    );
    const res = await request(buildApp())
      .post('/api/bookings/b1/cancel')
      .set('Authorization', 'Bearer customer-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/only cancel your own/i);
  });

  it('returns 409 once the stay has started (e.g. CHECKED_IN)', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(makeBooking({ status: 'CHECKED_IN' }) as never);
    const res = await request(buildApp())
      .post('/api/bookings/b1/cancel')
      .set('Authorization', 'Bearer customer-token');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/cannot be cancelled online/i);
  });

  it('cancels a PENDING booking owned by the email match', async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(makeBooking({ userId: null }) as never);
    vi.mocked(prisma.booking.update).mockResolvedValue(makeBooking({ status: 'CANCELLED' }) as never);

    const res = await request(buildApp())
      .post('/api/bookings/b1/cancel')
      .set('Authorization', 'Bearer customer-token');

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1' }, data: { status: 'CANCELLED' } }),
    );
    expect(res.body.status).toBe('CANCELLED');
  });
});
