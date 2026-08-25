import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../http.js';
import { verifyAccessToken, type JwtPayload } from '../auth/tokens.js';
import type { Role } from '../constants.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Requires a valid access token; attaches the decoded user to req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) throw new HttpError(401, 'Authentication required');
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

/** Requires the authenticated user to hold one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to do this');
    }
    next();
  };
}
