import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { staysRouter } from './routes/stays.js';
import { bookingsRouter } from './routes/bookings.js';
import { enquiriesRouter } from './routes/enquiries.js';
import { dashboardRouter } from './routes/dashboard.js';
import { auditRouter } from './routes/audit.js';
import { availabilityRouter } from './routes/availability.js';
import { contentRouter } from './routes/content.js';
import { couponsRouter } from './routes/coupons.js';
import { bannersRouter } from './routes/banners.js';
import { reviewsRouter } from './routes/reviews.js';
import { usersRouter } from './routes/users.js';
import { settingsRouter } from './routes/settings.js';
import { mediaRouter } from './routes/media.js';
import { reportsRouter } from './routes/reports.js';
import { paymentsRouter } from './routes/payments.js';
import { menuRouter } from './routes/menu.js';
import { addonsRouter } from './routes/addons.js';
import { emailRouter } from './routes/email.js';
import { marketingRouter } from './routes/marketing.js';
import { errorHandler, notFound } from './middleware/error.js';
import {
  authLimiter,
  bookingLimiter,
  couponLimiter,
  enquiryLimiter,
  registrationLimiter,
} from './middleware/rateLimit.js';

/**
 * Baseline security headers. CSP is deliberately NOT set here — the Razorpay
 * checkout inlines its own scripts, so a restrictive CSP would break payments.
 * HSTS is set by Nginx (HTTPS is terminated there, not in Express).
 */
function securityHeaders(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  // Request log: method, path, status, duration — one line per request.
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms`);
    });
    next();
  });

  app.use(
    cors({
      // Allow the configured origins, plus any localhost/127.0.0.1 port in dev
      // (Vite often falls back to 5174+ when 5173 is taken).
      origin(origin, callback) {
        if (!origin) return callback(null, true); // curl / server-to-server
        const ok =
          env.corsOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        callback(ok ? null : new Error('Not allowed by CORS'), ok);
      },
      credentials: true,
    }),
  );
  app.use(securityHeaders);
  // The payment webhook needs the raw body for HMAC verification — capture it
  // before the JSON parser runs (body-parser skips paths already parsed).
  app.use('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'shraddha-garden-api' }));

  // Brute-force / spam protection before any handler runs.
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', registrationLimiter);
  app.use('/api/auth/forgot-password', registrationLimiter);
  app.use('/api/marketing/subscribe', registrationLimiter);
  app.use('/api/enquiries', enquiryLimiter);
  app.use('/api/availability/check', bookingLimiter);
  app.use('/api/bookings/public', bookingLimiter);
  app.use('/api/payments/order', bookingLimiter);
  app.use('/api/coupons/validate', couponLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/stays', staysRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/enquiries', enquiriesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/coupons', couponsRouter);
  app.use('/api/banners', bannersRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/menu', menuRouter);
  app.use('/api/addons', addonsRouter);
  app.use('/api/email', emailRouter);
  app.use('/api/marketing', marketingRouter);

  // In production the API also serves the built frontend, so the whole app is
  // ONE deployable service (set SERVE_WEB=true). Unknown non-/api paths fall
  // back to index.html for client-side routing.
  if (process.env.SERVE_WEB === 'true') {
    const webRoot = process.env.WEB_ROOT
      ? resolve(process.env.WEB_ROOT)
      : resolve(dirname(fileURLToPath(import.meta.url)), '../../../dist');
    if (existsSync(webRoot)) {
      app.use(express.static(webRoot));
      app.get(/^\/(?!api\/|health$).*/, (_req, res) => res.sendFile(join(webRoot, 'index.html')));
    } else {
      console.warn(`[web] SERVE_WEB is on but no build found at ${webRoot}`);
    }
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
