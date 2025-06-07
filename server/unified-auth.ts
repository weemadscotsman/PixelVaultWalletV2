import { Request, Response, NextFunction } from 'express';
import { memBlockchainStorage } from './mem-blockchain';

// Unified session management
export class UnifiedAuthSystem {
  private activeSessions = new Map<string, {
    address: string;
    timestamp: number;
    wallet: any;
  }>();

  private sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

  // Initialize genesis wallet session automatically
  async initializeGenesisSession() {
    const genesisWallet = 'PVX_1295b5490224b2eb64e9724dc091795a';
    try {
      const wallet = await memBlockchainStorage.getWalletByAddress(genesisWallet);
      if (wallet) {
        const sessionToken = `pvx_genesis_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        this.activeSessions.set(sessionToken, {
          address: wallet.address,
          timestamp: Date.now(),
          wallet: wallet
        });
        console.log(`🔐 Genesis wallet session initialized: ${sessionToken}`);
        return sessionToken;
      }
    } catch (error) {
      console.error('Failed to initialize genesis session:', error);
    }
    return null;
  }

  // Create session for authenticated wallet
  async createSession(address: string) {
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const sessionToken = `pvx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    this.activeSessions.set(sessionToken, {
      address: wallet.address,
      timestamp: Date.now(),
      wallet: wallet
    });

    return { sessionToken, wallet };
  }

  // Get session data
  getSession(sessionToken: string) {
    const session = this.activeSessions.get(sessionToken);
    if (!session) return null;

    // Check if session expired
    if (Date.now() - session.timestamp > this.sessionTimeout) {
      this.activeSessions.delete(sessionToken);
      return null;
    }

    return session;
  }

  // Clear session
  clearSession(sessionToken: string) {
    this.activeSessions.delete(sessionToken);
  }

  // Middleware to authenticate requests with genesis wallet bypass
  requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // Check for genesis wallet bypass first
    const genesisWallet = 'PVX_1295b5490224b2eb64e9724dc091795a';
    const userAddressParam = req.params.address || req.query.address || req.query.userAddress;
    
    if (userAddressParam === genesisWallet) {
      // Auto-authenticate genesis wallet
      (req as any).userAddress = genesisWallet;
      (req as any).userWallet = { address: genesisWallet };
      (req as any).sessionToken = 'genesis-bypass';
      return next();
    }

    const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                        req.query.sessionToken as string ||
                        req.headers['x-session-token'] as string;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Session token required' });
    }

    const session = this.getSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Attach user data to request
    (req as any).userAddress = session.address;
    (req as any).userWallet = session.wallet;
    (req as any).sessionToken = sessionToken;

    next();
  };

  // Optional auth middleware (doesn't require authentication)
  optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') ||
                        req.query.sessionToken as string ||
                        req.headers['x-session-token'] as string;

    if (sessionToken) {
      const session = this.getSession(sessionToken);
      if (session) {
        (req as any).userAddress = session.address;
        (req as any).userWallet = session.wallet;
        (req as any).sessionToken = sessionToken;
      }
    }

    next();
  };

  // Get all active sessions count
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }

  // Clean expired sessions
  cleanExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of this.activeSessions) {
      if (now - session.timestamp > this.sessionTimeout) {
        this.activeSessions.delete(token);
      }
    }
  }
}

export const unifiedAuth = new UnifiedAuthSystem();

// Clean expired sessions every hour
setInterval(() => {
  unifiedAuth.cleanExpiredSessions();
}, 60 * 60 * 1000);