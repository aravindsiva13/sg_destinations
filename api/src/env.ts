// Load variables from api/.env into process.env (Node 20.6+/22 has loadEnvFile).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '..', '.env');

try {
  if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
} catch {
  // Fall back to whatever is already in the environment.
}

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Read a secret from the environment. In production a missing/weak secret is
 * fatal — the app must never boot with known dev fallbacks. In development we
 * fall back (with a warning) so the README quickstart keeps working.
 */
function secret(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v && v.length >= 16) return v;
  if (v) {
    console.warn(`[env] ${name} is set but short/weak — use a strong random value`);
  }
  if (IS_PROD) {
    throw new Error(
      `FATAL: ${name} is missing or too weak. Set a strong secret (e.g. \`openssl rand -hex 32\`) before starting in production.`,
    );
  }
  return devFallback;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
  accessSecret: secret('JWT_ACCESS_SECRET', 'dev-access-secret'),
  refreshSecret: secret('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL ?? '7d',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@shraddhagarden.com',
  seedAdminName: process.env.SEED_ADMIN_NAME ?? 'Administrator',
  /** Demo staff/customer accounts are seeded only in development. */
  seedDemoAccounts: (process.env.SEED_DEMO_ACCOUNTS ?? 'true').toLowerCase() !== 'false' && !IS_PROD,
  // Absolute base used to build links in emails (e.g. unsubscribe). Point this
  // at the public origin (tunnel/domain) in production; /api is proxied to here.
  publicUrl: (process.env.PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, ''),
  isProduction: IS_PROD,
};

if (env.isProduction && !process.env.PUBLIC_URL) {
  console.warn('[env] PUBLIC_URL is not set — links inside emails (unsubscribe, reset) will point at localhost');
}
if (env.isProduction && !process.env.SEED_ADMIN_PASSWORD) {
  console.warn('[env] SEED_ADMIN_PASSWORD is not set — do NOT run the seed or the admin account gets no password');
}

export { IS_PROD };