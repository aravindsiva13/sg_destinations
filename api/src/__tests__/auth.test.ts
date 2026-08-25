import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, notFound } from '../middleware/error.js';
import { ROLES } from '../constants.js';

vi.mock('../prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(async (pw: string, hash: string) => pw === 'correct-password'),
    hash: vi.fn(async () => 'hashed'),
    hashSync: vi.fn(() => 'hashed'),
  },
}));

import { prisma } from '../prisma.js';
import { authRouter } from '../routes/auth.js';

const mockUser = {
  id: 'u1',
  email: 'admin@shraddhagarden.com',
  name: 'Admin',
  role: ROLES.SUPER_ADMIN,
  phone: null,
  passwordHash: 'x',
  active: true,
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
  });

  it('returns 422 for an invalid email/password shape', async () => {
    const res = await request(buildApp()).post('/api/auth/login').send({ email: 'x' });
    expect(res.status).toBe(422);
    expect(res.body.details).toBeDefined();
  });

  it('returns 401 for an unknown user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: 'ghost@x.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for an inactive user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, active: false } as never);
    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'correct-password' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for a wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('returns tokens and a public user on success', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    const res = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user).toEqual({
      id: 'u1',
      email: mockUser.email,
      name: 'Admin',
      role: ROLES.SUPER_ADMIN,
      phone: null,
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 422 when refreshToken is missing', async () => {
    const res = await request(buildApp()).post('/api/auth/refresh').send({});
    expect(res.status).toBe(422);
  });

  it('returns 401 for an invalid refresh token signature', async () => {
    const res = await request(buildApp())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'garbage' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid refresh token');
  });

  it('rotates tokens on a valid refresh token', async () => {
    // A real signed refresh token for the "expiresIn" TTL read from env.
    const { signRefreshToken } = await import('../auth/tokens.js');
    const token = signRefreshToken({ sub: 'u1' });

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      token,
      userId: 'u1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100_000),
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as never);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never);

    const res = await request(buildApp()).post('/api/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    // Old token must be revoked.
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token }, data: { revoked: true } }),
    );
  });

  it('returns 401 when the stored token is revoked or expired', async () => {
    const { signRefreshToken } = await import('../auth/tokens.js');
    const token = signRefreshToken({ sub: 'u1' });
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      token,
      userId: 'u1',
      revoked: true,
      expiresAt: new Date(Date.now() + 100_000),
    } as never);

    const res = await request(buildApp()).post('/api/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Refresh token expired');
  });
});

describe('POST /api/auth/register', () => {
  it('returns 201 and creates a CUSTOMER account', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'u2',
      email: 'new@customer.com',
      name: 'New',
      role: ROLES.CUSTOMER,
      phone: null,
    } as never);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as never);

    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ name: 'New', email: 'new@customer.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'CUSTOMER' }) }),
    );
    expect(res.body.user.role).toBe('CUSTOMER');
  });

  it('returns 422 for a password shorter than 6 characters', async () => {
    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ name: 'New', email: 'new@customer.com', password: '123' });
    expect(res.status).toBe(422);
  });

  it('returns 409 if the email is already registered', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ name: 'New', email: mockUser.email, password: 'secret123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(buildApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    const res = await request(buildApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${(await import('../auth/tokens.js')).signAccessToken({ sub: 'u1', email: mockUser.email, role: ROLES.SUPER_ADMIN, name: 'Admin' })}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(mockUser.email);
  });

  it('returns 404 when the token belongs to a missing user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await request(buildApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${(await import('../auth/tokens.js')).signAccessToken({ sub: 'ghost', email: 'g@x.com', role: ROLES.CUSTOMER, name: 'G' })}`);
    expect(res.status).toBe(404);
  });
});