import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, notFound } from '../middleware/error.js';
import { ROLES } from '../constants.js';

// Mock the shared Prisma client so route handlers never touch a real DB.
vi.mock('../prisma.js', () => ({
  prisma: {
    stay: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: { count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

// Mock JWT verification so we can simulate admin vs. non-admin callers.
vi.mock('../auth/tokens.js', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'admin-token') {
      return { sub: 'u1', email: 'admin@x.com', role: ROLES.SUPER_ADMIN, name: 'Admin' };
    }
    if (token === 'customer-token') {
      return { sub: 'u9', email: 'cust@x.com', role: ROLES.CUSTOMER, name: 'Customer' };
    }
    throw new Error('invalid token');
  }),
}));

import { prisma } from '../prisma.js';
import { staysRouter } from '../routes/stays.js';
import { makeStayRow, makeSerializedStay } from './helpers.js';

const mockedSlug = vi.mocked(prisma.stay.findUnique);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/stays', staysRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('GET /api/stays', () => {
  beforeEach(() => {
    vi.mocked(prisma.stay.findMany).mockResolvedValue([makeStayRow()]);
  });

  it('returns a serialized list of stays', async () => {
    const res = await request(buildApp()).get('/api/stays');
    expect(res.status).toBe(200);
    // JSON serialization turns Date fields into ISO strings; match that shape.
    expect(res.body).toEqual(JSON.parse(JSON.stringify([makeSerializedStay()])));
  });

  it('passes a published filter when ?published=true', async () => {
    await request(buildApp()).get('/api/stays?published=true');
    expect(vi.mocked(prisma.stay.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { published: true } }),
    );
  });
});

describe('GET /api/stays/:slug', () => {
  it('returns the serialized stay for a valid slug', async () => {
    mockedSlug.mockResolvedValue(makeStayRow());
    const res = await request(buildApp()).get('/api/stays/garden-villa');
    expect(res.status).toBe(200);
    expect(mockedSlug).toHaveBeenCalledWith({ where: { slug: 'garden-villa' } });
    expect(res.body.name).toBe('Garden Villa');
  });

  it('returns 404 when the stay is not found', async () => {
    mockedSlug.mockResolvedValue(null);
    const res = await request(buildApp()).get('/api/stays/missing');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Stay not found');
  });
});

describe('POST /api/stays (admin write)', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(buildApp()).post('/api/stays').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for a customer token', async () => {
    const res = await request(buildApp())
      .post('/api/stays')
      .set('Authorization', 'Bearer customer-token')
      .send({});
    expect(res.status).toBe(403);
  });

  it('returns 422 for invalid payloads', async () => {
    const res = await request(buildApp())
      .post('/api/stays')
      .set('Authorization', 'Bearer admin-token')
      .send({ slug: 'Bad Slug!', name: '' });
    expect(res.status).toBe(422);
    expect(res.body.details).toBeDefined();
  });

  it('returns 409 when the slug already exists', async () => {
    mockedSlug.mockResolvedValue(makeStayRow());
    const res = await request(buildApp())
      .post('/api/stays')
      .set('Authorization', 'Bearer admin-token')
      .send(validStayPayload());
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('A stay with that slug already exists');
  });

  it('creates a stay and returns 201 on success', async () => {
    mockedSlug.mockResolvedValue(null);
    vi.mocked(prisma.stay.create).mockResolvedValue(makeStayRow());
    const res = await request(buildApp())
      .post('/api/stays')
      .set('Authorization', 'Bearer admin-token')
      .send(validStayPayload());
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});

describe('DELETE /api/stays/:id (super admin only)', () => {
  it('returns 403 for a customer', async () => {
    const res = await request(buildApp())
      .delete('/api/stays/s1')
      .set('Authorization', 'Bearer customer-token');
    expect(res.status).toBe(403);
  });

  it('returns 409 when the stay still has bookings', async () => {
    vi.mocked(prisma.booking.count).mockResolvedValue(3);
    const res = await request(buildApp())
      .delete('/api/stays/s1')
      .set('Authorization', 'Bearer admin-token');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Cannot delete a stay that has bookings');
  });

  it('deletes the stay and returns ok when there are no bookings', async () => {
    vi.mocked(prisma.booking.count).mockResolvedValue(0);
    vi.mocked(prisma.stay.delete).mockResolvedValue(makeStayRow());
    const res = await request(buildApp())
      .delete('/api/stays/s1')
      .set('Authorization', 'Bearer admin-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('error middleware integration', () => {
  it('responds 404 for an unknown route', async () => {
    const res = await request(buildApp()).get('/nope');
    expect(res.status).toBe(404);
  });

  it('responds 500 on an unhandled error', async () => {
    mockedSlug.mockRejectedValue(new Error('db down'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(buildApp()).get('/api/stays/garden-villa');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });

  afterEach(() => vi.restoreAllMocks());
});

function validStayPayload() {
  return {
    slug: 'garden-villa',
    name: 'Garden Villa',
    pricePerNight: 4500,
    shortIntro: 'A quiet retreat',
    heroImage: 'https://example.com/main.jpg',
    description: ['P1'],
    gallery: ['https://example.com/g.jpg'],
  };
}