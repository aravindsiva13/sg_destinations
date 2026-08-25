import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import { validateBody } from '../middleware/validate.js';
import { errorHandler, notFound } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../http.js';
import { ROLES, type Role } from '../constants.js';

vi.mock('../auth/tokens.js', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'valid-admin-token') {
      return { sub: 'u1', email: 'admin@x.com', role: ROLES.SUPER_ADMIN, name: 'Admin' };
    }
    throw new Error('bad token');
  }),
}));

function makeReq(body?: unknown, headers: Record<string, string> = {}): Request {
  return {
    body,
    headers,
    user: undefined,
  } as unknown as Request;
}

function makeRes() {
  const res = {
    statusCode: 0,
    body: undefined,
    status: vi.fn(function (this: unknown, code: number) {
      (this as { statusCode: number }).statusCode = code;
      return this;
    }),
    json: vi.fn(function (this: unknown, obj: unknown) {
      (this as { body: unknown }).body = obj;
      return this;
    }),
    send: vi.fn(),
  };
  return res as unknown as Response & {
    statusCode: number;
    body: unknown;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

const next: NextFunction = vi.fn() as unknown as NextFunction;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateBody', () => {
  const schema = z.object({ email: z.string().email() });

  it('passes a valid body through and calls next', () => {
    const req = makeReq({ email: 'a@b.com' });
    validateBody(schema)(req, makeRes(), next);
    expect(req.body).toEqual({ email: 'a@b.com' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('applies defaults/coercion from the schema', () => {
    const withDefault = z.object({ qty: z.coerce.number().default(1) });
    const req = makeReq({});
    validateBody(withDefault)(req, makeRes(), next);
    expect(req.body).toEqual({ qty: 1 });
  });

  it('throws an HttpError 422 with flattened details on invalid body', () => {
    const req = makeReq({ email: 'not-an-email' });
    let err: unknown;
    try {
      validateBody(schema)(req, makeRes(), next);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(422);
    expect((err as HttpError).details).toEqual(
      expect.objectContaining({ fieldErrors: expect.any(Object) }),
    );
  });
});

describe('errorHandler', () => {
  it('responds with the HttpError status and message', () => {
    const res = makeRes();
    errorHandler(new HttpError(401, 'Unauthorized', { why: 'x' }), makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'Unauthorized', details: { why: 'x' } });
  });

  it('maps a Prisma P2025 error to a 404', () => {
    const res = makeRes();
    errorHandler({ code: 'P2025' } as unknown as Error, makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: 'Record not found' });
  });

  it('maps unknown errors to a 500', () => {
    const res = makeRes();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    errorHandler(new Error('boom'), makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('keeps an exposed client error (bad JSON) at its own status', () => {
    const res = makeRes();
    errorHandler(
      { expose: true, statusCode: 400, message: 'Unexpected token in JSON at position 1' } as never,
      makeReq(),
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ error: 'Unexpected token in JSON at position 1' });
  });
});

describe('notFound', () => {
  it('responds with a 404', () => {
    const res = makeRes();
    notFound(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

describe('requireAuth', () => {
  it('attaches the user when a valid Bearer token is provided', () => {
    const req = makeReq(undefined, { authorization: 'Bearer valid-admin-token' });
    requireAuth(req, makeRes(), next);
    expect(req.user).toEqual(
      expect.objectContaining({ sub: 'u1', email: 'admin@x.com', role: ROLES.SUPER_ADMIN }),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws 401 when no Authorization header is present', () => {
    const req = makeReq();
    let err: unknown;
    try {
      requireAuth(req, makeRes(), next);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(401);
  });

  it('throws 401 for an invalid token', () => {
    const req = makeReq(undefined, { authorization: 'Bearer nope' });
    let err: unknown;
    try {
      requireAuth(req, makeRes(), next);
    } catch (e) {
      err = e;
    }
    expect((err as HttpError).status).toBe(401);
    expect((err as HttpError).message).toBe('Invalid or expired token');
  });
});

describe('requireRole', () => {
  it('allows a user holding a permitted role through', () => {
    const req = makeReq();
    req.user = { sub: 'u1', email: 'a@b.com', role: ROLES.MANAGER, name: 'M' };
    requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)(req, makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('throws 403 for an authenticated user with a disallowed role', () => {
    const req = makeReq();
    req.user = { sub: 'u9', email: 'c@b.com', role: ROLES.CUSTOMER as unknown as Role, name: 'C' };
    let err: unknown;
    try {
      requireRole(ROLES.SUPER_ADMIN)(req, makeRes(), next);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(403);
  });

  it('throws 401 when there is no authenticated user', () => {
    const req = makeReq();
    let err: unknown;
    try {
      requireRole(ROLES.SUPER_ADMIN)(req, makeRes(), next);
    } catch (e) {
      err = e;
    }
    expect((err as HttpError).status).toBe(401);
  });
});