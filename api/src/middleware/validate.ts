import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../http.js';

/** Validates req.body against a Zod schema, replacing it with the parsed value. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(422, 'Validation failed', result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}
