import rateLimit, { type Options } from 'express-rate-limit';
import type { RequestHandler } from 'express';

// Rate limiting is disabled in tests so the test suite stays deterministic.
const SKIP_RATE_LIMIT = process.env.NODE_ENV === 'test';

function makeLimiter(opts: { windowMs: number; limit: number }): RequestHandler {
  const limiter = rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again in a while' },
  }) as RequestHandler;
  if (SKIP_RATE_LIMIT) {
    return (_req, _res, next) => next();
  }
  return limiter;
}

/**
 * Auth endpoints are the brute-force surface: 10 attempts per 15 minutes.
 */
export const authLimiter = makeLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });

/**
 * Account creation, password resets and newsletter signups are spam surfaces:
 * strict per-IP quotas (5 per hour).
 */
export const registrationLimiter = makeLimiter({ windowMs: 60 * 60 * 1000, limit: 5 });

/**
 * Public form submissions (enquiries): generous but bounded — 10 per hour.
 */
export const enquiryLimiter = makeLimiter({ windowMs: 60 * 60 * 1000, limit: 10 });

/**
 * Booking flow: creating a booking / payment order is heavier — 20 per hour.
 */
export const bookingLimiter = makeLimiter({ windowMs: 60 * 60 * 1000, limit: 20 });

/**
 * Coupon validation is infinitely queryable if abused — 60 per hour.
 */
export const couponLimiter = makeLimiter({ windowMs: 60 * 60 * 1000, limit: 60 });