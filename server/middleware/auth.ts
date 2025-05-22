import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { walletDao } from '../database/walletDao';

// Environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'pixelvault-jwt-secret-key';

/**
 * Authentication middleware to protect API routes
 * Verifies the JWT token and attaches user data to the request object
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  // DEVELOPMENT MODE: Bypass authentication completely
  if (process.env.NODE_ENV !== 'production') {
    // Mock authentication with a default wallet
    const wallet = await walletDao.getWalletByAddress('PVX_c1989203fab278dff8ef2cb0def8678d');
    (req as any).user = {
      walletAddress: 'PVX_c1989203fab278dff8ef2cb0def8678d',
      wallet
    };
    return next();
  }
  
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid authentication token format' });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if the wallet exists
    const wallet = await walletDao.getWalletByAddress(decoded.walletAddress);
    
    if (!wallet) {
      return res.status(401).json({ error: 'Wallet not found' });
    }
    
    // Attach user data to the request object for use in route handlers
    (req as any).user = {
      walletAddress: decoded.walletAddress,
      wallet
    };
    
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional JWT authentication that doesn't block requests without tokens
 * Just enriches the request with user data if a valid token is present
 */
export const optionalJWT = async (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // No token, continue without setting user
    return next();
  }
  
  const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    // Invalid token format, continue without setting user
    return next();
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if the wallet exists
    const wallet = await walletDao.getWalletByAddress(decoded.walletAddress);
    
    if (wallet) {
      // Attach user data to the request object for use in route handlers
      (req as any).user = {
        walletAddress: decoded.walletAddress,
        wallet
      };
    }
    
    next();
  } catch (err) {
    // Invalid token, continue without setting user
    console.debug('JWT verification failed in optionalJWT, continuing without user:', err);
    next();
  }
};

/**
 * Creates a JWT token for the given wallet address
 */
export const createToken = (walletAddress: string, expiresIn = '24h'): string => {
  return jwt.sign({ walletAddress }, JWT_SECRET, { expiresIn });
};

/**
 * Verifies a JWT token and returns the decoded data
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Middleware to validate that the authenticated user owns the wallet specified in the request
 */
export const validateWalletOwnership = (req: Request, res: Response, next: NextFunction) => {
  // First ensure the user is authenticated
  if (!(req as any).user || !(req as any).user.walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Get the wallet address from the request parameters
  const paramAddress = req.params.address || req.body.address;
  
  if (!paramAddress) {
    return res.status(400).json({ error: 'Wallet address parameter is required' });
  }
  
  // Check if the authenticated user owns the wallet
  if ((req as any).user.walletAddress !== paramAddress) {
    return res.status(403).json({ error: 'You do not have permission to access this wallet' });
  }
  
  // User owns the wallet, proceed
  next();
};