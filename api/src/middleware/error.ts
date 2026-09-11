import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../http.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  // Prisma "record not found" on update/delete
  if (typeof err === 'object' && err && (err as { code?: string }).code === 'P2025') {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  // Prisma unique constraint violation (e.g. duplicate slug, code, email)
  if (typeof err === 'object' && err && (err as { code?: string }).code === 'P2002') {
    const target = (err as { meta?: { target?: string[] } }).meta?.target;
    const fieldName = Array.isArray(target) && target.length > 0 ? target.join(', ') : 'value';
    res.status(409).json({ error: `A record with that unique ${fieldName} already exists.` });
    return;
  }
  // Client errors raised by express/body-parser (bad JSON, oversized payload)
  // carry their own status and expose flag.
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { expose?: boolean }).expose &&
    typeof (err as { statusCode?: number }).statusCode === 'number'
  ) {
    const status = (err as { statusCode: number }).statusCode;
    res.status(status).json({ error: (err as { message?: string }).message ?? 'Bad request' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
