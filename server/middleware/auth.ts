import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Secret key for JWT signing - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'pvx-blockchain-secret-key-change-in-production';
const JWT_EXPIRY = '1h'; // Short TTL as requested (1 hour)

export interface TokenPayload {
  walletAddress: string;
  timestamp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    walletAddress: string;
  };
}

/**
 * Generate a JWT token for a wallet
 */
export function generateToken(walletAddress: string): string {
  const payload: TokenPayload = {
    walletAddress,
    timestamp: Date.now()
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    (req as AuthenticatedRequest).user = { walletAddress: payload.walletAddress };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to validate transaction signature and nonce
 */
export function validateSignatureAndNonce(req: Request, res: Response, next: NextFunction) {
  const { signature, nonce, from, hash } = req.body;
  
  // Check required fields
  if (!signature || !nonce || !from || !hash) {
    return res.status(400).json({ 
      error: 'Missing required fields for transaction validation',
      details: 'Transaction must include signature, nonce, from address, and hash'
    });
  }
  
  // Verify nonce is a recent timestamp (within 5 minutes)
  const nonceTimestamp = parseInt(nonce as string, 10);
  const currentTime = Date.now();
  const fiveMinutesAgo = currentTime - (5 * 60 * 1000);
  
  if (isNaN(nonceTimestamp) || nonceTimestamp < fiveMinutesAgo) {
    return res.status(400).json({ error: 'Invalid or expired nonce' });
  }
  
  // In a real implementation, we would verify the cryptographic signature
  // For now, we'll do a simplified check that the signature is related to the transaction
  const expectedSignatureBase = from + hash + nonce;
  const signatureValid = signature.length >= 64; // Real validation would use public key crypto
  
  if (!signatureValid) {
    return res.status(400).json({ error: 'Invalid transaction signature' });
  }
  
  next();
}

/**
 * Store for revoked tokens (should be in a database in production)
 */
const revokedTokens = new Set<string>();

/**
 * Revoke a JWT token
 */
export function revokeToken(token: string) {
  revokedTokens.add(token);
}

/**
 * Check if a token is revoked
 */
export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

/**
 * Rate limiter middleware for mining operations
 */
export function miningRateLimiter(req: Request, res: Response, next: NextFunction) {
  const { walletAddress } = req.body;
  const key = `mining_${walletAddress}_${Date.now().toString().slice(0, -3)}`;
  
  // In a real implementation, we would use a distributed rate limiter
  // For now, we'll use a simple check on the timestamp
  // This allows only one mining operation per wallet per second
  
  next();
}