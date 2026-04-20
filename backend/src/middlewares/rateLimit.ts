import { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
  message: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const MAX_RATE_LIMIT_ENTRIES = 10_000;

const cleanupExpiredEntries = (entries: Map<string, RateLimitEntry>) => {
  const now = Date.now();
  for (const [key, entry] of entries.entries()) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
  }
};

const createRateLimiter = ({
  maxRequests,
  windowMs,
  message,
}: RateLimitOptions) => {
  const entries = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    // Keep local development unblocked.
    if ((process.env.NODE_ENV || "development") === "development") {
      return next();
    }

    if (entries.size > MAX_RATE_LIMIT_ENTRIES) {
      cleanupExpiredEntries(entries);
    }

    const clientIp = req.ip || "unknown";
    const key = clientIp;
    const now = Date.now();

    const existingEntry = entries.get(key);

    if (!existingEntry || existingEntry.resetAt <= now) {
      entries.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (existingEntry.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil(
        (existingEntry.resetAt - now) / 1000,
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ error: message });
    }

    existingEntry.count += 1;
    entries.set(key, existingEntry);
    next();
  };
};

export const apiRateLimiter = createRateLimiter({
  maxRequests: 120,
  windowMs: 60 * 1000,
  message: "Too many requests. Please slow down and try again shortly.",
});

export const authRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many authentication attempts. Please try again in a little while.",
});
