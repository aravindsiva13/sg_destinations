import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, notFound } from '../middleware/error.js';
import { ROLES } from '../constants.js';
import { env } from '../env.js';

vi.mock('../prisma.js', () => ({
  prisma: {
    siteSetting: { findMany: vi.fn(), upsert: vi.fn() },
    review: { findMany: vi.fn() },
    booking: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock('../auth/tokens.js', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'manager-token') {
      return { sub: 'u1', email: 'mgr@x.com', role: ROLES.MANAGER, name: 'Manager' };
    }
    throw new Error('invalid token');
  }),
}));

vi.mock('../audit.js', () => ({
  recordAudit: vi.fn(),
}));

import { prisma } from '../prisma.js';
import { settingsRouter } from '../routes/settings.js';
import { reviewsRouter } from '../routes/reviews.js';
import { bookingsRouter } from '../routes/bookings.js';
import { assertGatewayAllowsOrders } from '../routes/payments.js';
import { HttpError } from '../http.js';

function buildApp(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

/* ------------------------------- Settings ------------------------------- */
describe('GET /api/settings (public allow-list)', () => {
  beforeEach(() => {
    vi.mocked(prisma.siteSetting.findMany).mockResolvedValue([
      // A secret blob stored in SiteSetting must never be exposed publicly.
      { key: 'email', value: '{"apiKey":"super-secret"}' },
      { key: 'gstPercent', value: '18' },
    ] as never);
  });

  it('returns only allow-listed keys and never the secret blobs', async () => {
    const res = await request(buildApp(settingsRouter)).get('/').expect(200);
    expect(res.body.gstPercent).toBe(18);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('payments');
    expect(res.body).toHaveProperty('resortName');
  });
});

describe('PUT /api/settings (admin)', () => {
  // Simulates the SiteSetting table: upsert writes into the store that
  // findMany then reads back, just like the real DB.
  const store: { key: string; value: string }[] = [];

  beforeEach(() => {
    store.length = 0;
    vi.mocked(prisma.siteSetting.findMany).mockImplementation(
      (async () => [...store]) as never,
    );
    vi.mocked(prisma.siteSetting.upsert).mockImplementation(
      (async (args: { where: unknown; update: unknown }) => {
        const { where, update } = args as {
          where: { key: string };
          update: { value: string };
        };
        const key = where.key;
        const value = update.value;
        const existing = store.find((s) => s.key === key);
        if (existing) existing.value = value;
        else store.push({ key, value });
        return { key, value };
      }) as never,
    );
  });

  it('rejects writing reserved keys (e.g. the email secret blob)', async () => {
    const res = await request(buildApp(settingsRouter))
      .put('/')
      .set('Authorization', 'Bearer manager-token')
      .send({ email: { apiKey: 'should-not-persist' } })
      .expect(422);
    expect(store).toHaveLength(0);
  });

  it('accepts only allow-listed keys and returns the sanitized view', async () => {
    const res = await request(buildApp(settingsRouter))
      .put('/')
      .set('Authorization', 'Bearer manager-token')
      .send({ resortName: 'Shraddha Garden', gstPercent: 12 })
      .expect(200);
    expect(store).toHaveLength(2);
    expect(res.body.resortName).toBe('Shraddha Garden');
    expect(res.body).not.toHaveProperty('email');
  });

  it('rejects badly-shaped values (invalid time format)', async () => {
    const res = await request(buildApp(settingsRouter))
      .put('/')
      .set('Authorization', 'Bearer manager-token')
      .send({ checkInTime: '2pm' })
      .expect(422);
    expect(store).toHaveLength(0);
  });
});

/* ------------------------------- Reviews -------------------------------- */
describe('GET /api/reviews (public)', () => {
  it('strips reviewer email addresses from the response', async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValue([
      {
        id: 'r1',
        author: 'Priya',
        email: 'priya@example.com',
        stayId: null,
        rating: 5,
        title: 'Lovely',
        body: 'Wonderful stay',
        status: 'APPROVED',
        reply: null,
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date('2026-06-01'),
      },
    ] as never);

    const res = await request(buildApp(reviewsRouter)).get('/').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).not.toHaveProperty('email');
    expect(res.body[0].author).toBe('Priya');
  });
});

/* --------------------- Booking lookup query validation ------------------ */
describe('GET /api/bookings/lookup', () => {
  it('rejects malformed references and emails before touching the DB', async () => {
    const app = buildApp(bookingsRouter);
    await request(app).get('/lookup?code=<script>&email=not-an-email').expect(422);
    await request(app).get('/lookup?code=OK&email=nope').expect(422);
    expect(prisma.booking.findFirst).not.toHaveBeenCalled();
  });

  it('returns 404 when the code + email do not match a booking', async () => {
    vi.mocked(prisma.booking.findFirst).mockResolvedValue(null as never);
    const res = await request(buildApp(bookingsRouter))
      .get('/lookup?code=SG-9999&email=cust@x.com')
      .expect(404);
    expect(res.body.error).toMatch(/No booking found/);
  });
});

/* ------------------- Mock gateway hard-stop in production --------------- */
describe('assertGatewayAllowsOrders', () => {
  const original = env.isProduction;

  afterEach(() => {
    (env as { isProduction: boolean }).isProduction = original;
  });

  it('allows the mock provider outside production', () => {
    (env as { isProduction: boolean }).isProduction = false;
    expect(() => assertGatewayAllowsOrders({ provider: 'mock' })).not.toThrow();
  });

  it('refuses the mock provider in production', () => {
    (env as { isProduction: boolean }).isProduction = true;
    expect(() => assertGatewayAllowsOrders({ provider: 'mock' })).toThrow(HttpError);
    expect(() =>
      assertGatewayAllowsOrders({ provider: 'mock' }),
    ).toThrowError(/Online payments are unavailable/);
  });
});