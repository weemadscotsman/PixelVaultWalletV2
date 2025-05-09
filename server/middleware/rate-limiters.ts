import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter - 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

/**
 * Mining operation rate limiter - 1 mining start request per 30 seconds per wallet
 */
export const miningLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  limit: 1, // 1 request per 30 seconds
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Mining operations are limited to once per 30 seconds' },
  keyGenerator: (req) => {
    // Use wallet address as the rate limit key
    return req.body.address || req.params.address || req.ip;
  }
});

/**
 * Wallet creation rate limiter - 5 wallets per hour per IP
 */
export const walletCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // 5 wallets per hour
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'You can only create up to 5 wallets per hour' }
});