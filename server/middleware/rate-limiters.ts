import rateLimit from 'express-rate-limit';

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per minute per IP
 */
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.'
  }
});

/**
 * Stricter rate limiter for sensitive operations (login, wallet creation, etc.)
 * 20 requests per 10 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

/**
 * Mining rate limiter to prevent hashrate spoofing
 * 5 mining operations per minute per IP
 */
export const miningLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 mining operations per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Mining rate limit exceeded, please wait before making more mining requests.'
  }
});

/**
 * Transaction rate limiter to prevent transaction spamming
 * 30 transactions per 5 minutes per IP
 */
export const transactionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each IP to 30 transactions per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Transaction rate limit exceeded, please wait before sending more transactions.'
  }
});

/**
 * Staking rate limiter
 * 10 staking operations per 5 minutes per IP
 */
export const stakingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 staking operations per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Staking rate limit exceeded, please wait before making more staking requests.'
  }
});