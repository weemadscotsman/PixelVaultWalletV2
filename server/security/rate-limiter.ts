import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait before trying to authenticate again.',
  },
  skipSuccessfulRequests: true,
});

// Wallet creation limiter
export const walletCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 wallet creations per hour
  message: {
    error: 'Wallet creation limit exceeded',
    message: 'Maximum 3 wallets per hour. Please try again later.',
  },
});

// Transaction limiter
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 transactions per minute
  message: {
    error: 'Transaction rate limit exceeded',
    message: 'Please wait before submitting more transactions.',
  },
});