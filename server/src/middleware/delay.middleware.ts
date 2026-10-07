import { Request, Response, NextFunction } from 'express';

const MAX_DELAY_MS = 10_000;

/**
 * Delay middleware: ?delay=<ms> pauses the response.
 * Invalid or out-of-range values are silently ignored.
 */
export const delayMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const raw = req.query.delay;
  const ms = Number(raw);

  if (raw !== undefined && !isNaN(ms) && ms > 0) {
    const clamped = Math.min(ms, MAX_DELAY_MS);
    setTimeout(next, clamped);
  } else {
    next();
  }
};
