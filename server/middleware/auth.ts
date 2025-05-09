import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Secret key for JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'pixelvault-secure-key-change-in-production';

// Store revoked tokens
const revokedTokens = new Set<string>();

/**
 * Generate a new JWT token for a wallet address
 */
export function generateToken(walletAddress: string): string {
  return jwt.sign(
    { walletAddress },
    JWT_SECRET,
    { 
      expiresIn: '24h', // Short TTL for security
      algorithm: 'HS256'
    }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Revoke a token (add to blacklist)
 */
export function revokeToken(token: string): void {
  revokedTokens.add(token);
  
  // Cleanup old tokens from the set periodically
  // In a production environment, this would be stored in Redis or a database
  if (revokedTokens.size > 1000) {
    console.log('Cleaning up revoked tokens cache...');
    // In a real implementation, we would remove expired tokens
  }
}

/**
 * Check if a token is revoked
 */
function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  // Check if token is revoked
  if (isTokenRevoked(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }
  
  try {
    // Verify the token
    const decoded = verifyToken(token);
    
    // Add the decoded data to the request
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware to validate wallet ownership
 * Ensures the authenticated user owns the wallet being accessed
 */
export function validateWalletOwnership(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const addressParam = req.params.address || req.body.address;
  
  if (!user || !user.walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!addressParam) {
    return res.status(400).json({ error: 'Wallet address parameter is required' });
  }
  
  // Check if the authenticated user owns the wallet
  if (user.walletAddress !== addressParam) {
    return res.status(403).json({ error: 'You do not have permission to access this wallet' });
  }
  
  next();
}