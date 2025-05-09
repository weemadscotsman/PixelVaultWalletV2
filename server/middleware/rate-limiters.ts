import rateLimit from 'express-rate-limit';

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per minute per IP
 */
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { 
    error: 'Too many requests', 
    message: 'Please try again later' 
  }
});

/**
 * Stricter rate limiter for sensitive operations (login, wallet creation, etc.)
 * 20 requests per 10 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Too many authentication attempts', 
    message: 'Please try again later' 
  }
});

/**
 * Mining rate limiter to prevent hashrate spoofing
 * 5 mining operations per minute per IP
 */
export const miningLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Mining rate limit exceeded', 
    message: 'Please slow down mining operations' 
  }
});

/**
 * Transaction rate limiter to prevent transaction spamming
 * 30 transactions per 5 minutes per IP
 */
export const transactionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Transaction rate limit exceeded', 
    message: 'Please wait before submitting more transactions' 
  }
});

/**
 * Staking rate limiter
 * 10 staking operations per 5 minutes per IP
 */
export const stakingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Staking rate limit exceeded', 
    message: 'Please wait before making more staking operations' 
  }
});

/**
 * Wallet creation rate limiter
 * 3 wallet creations per hour per IP
 */
export const walletCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Wallet creation rate limit exceeded', 
    message: 'You can only create 3 wallets per hour' 
  }
});

/**
 * Learning module completion rate limiter
 * 15 learning module operations per hour per IP
 */
export const learningLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Learning module rate limit exceeded', 
    message: 'Please slow down and take time to learn the material' 
  }
});

/**
 * Thringlet interaction rate limiter
 * 20 thringlet interactions per 5 minutes per IP
 */
export const thringletLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Thringlet interaction rate limit exceeded', 
    message: 'Please wait before interacting with your Thringlet again' 
  }
});