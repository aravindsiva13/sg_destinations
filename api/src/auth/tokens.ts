import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../env.js';
import type { Role } from '../constants.js';

// `expiresIn` accepts a number of seconds or a vercel/ms string like "15m".
// Our TTLs come from env as plain strings, so widen them to the option type.
const accessTtl = env.accessTtl as SignOptions['expiresIn'];
const refreshTtl = env.refreshTtl as SignOptions['expiresIn'];

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.accessSecret, { algorithm: 'HS256', expiresIn: accessTtl });
}

export function signRefreshToken(payload: Pick<JwtPayload, 'sub'>): string {
  return jwt.sign(payload, env.refreshSecret, { algorithm: 'HS256', expiresIn: refreshTtl });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.accessSecret, { algorithms: ['HS256'] }) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.refreshSecret, { algorithms: ['HS256'] }) as { sub: string };
}

/** Expiry Date for a refresh token, derived from REFRESH_TOKEN_TTL (e.g. "7d"). */
export function refreshExpiryDate(): Date {
  const ttl = env.refreshTtl;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 86_400_000);
  const n = Number(match[1]);
  const unit = match[2];
  const ms =
    unit === 's' ? n * 1000 : unit === 'm' ? n * 60_000 : unit === 'h' ? n * 3_600_000 : n * 86_400_000;
  return new Date(now + ms);
}
