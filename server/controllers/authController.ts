import { Request, Response } from 'express';
import { createToken } from '../middleware/auth';
import crypto from 'crypto';
import { walletDao } from '../database/walletDao';
import { memBlockchainStorage } from '../mem-blockchain';

/**
 * Login with wallet credentials
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { address, passphrase } = req.body;
    
    if (!address || !passphrase) {
      return res.status(400).json({ error: 'Address and passphrase are required' });
    }
    
    // Try to get the wallet from DB first, then memory storage
    let wallet = await walletDao.getWalletByAddress(address);
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(address);
    }
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Verify passphrase
    const hash = crypto.createHash('sha256')
      .update(passphrase + wallet.passphraseSalt)
      .digest('hex');
    
    if (hash !== wallet.passphraseHash) {
      return res.status(401).json({ error: 'Invalid passphrase' });
    }
    
    // Generate JWT token
    const token = createToken(address);
    
    // Issue a refresh token (in a real implementation, this would be stored in a database)
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh'
    });
    
    res.json({
      token,
      user: {
        address: wallet.address,
        balance: wallet.balance,
        publicKey: wallet.publicKey
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

/**
 * Logout 
 * POST /api/auth/logout
 */
export const logout = (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // No need to revoke tokens as we're using JWT
    // In a real implementation, we'd add the token to a blacklist
    // or use short-lived tokens with refresh tokens
    
    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/refresh'
    });
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Logout failed'
    });
  }
};

/**
 * Refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }
    
    // In a real implementation, we would validate the refresh token against a database
    // For now, we'll just issue a new token if the refresh token exists
    
    // Get the address from the user property (added by middleware)
    const address = (req as any).user?.walletAddress;
    
    if (!address) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Generate a new token
    const token = createToken(address);
    
    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Token refresh failed'
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // The authenticateJWT middleware would have already validated the token
    // and attached the user data to the request object
    const walletAddress = (req as any).user?.walletAddress;
    
    if (!walletAddress) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Try to get the wallet from DB first, then memory storage
    let wallet = await walletDao.getWalletByAddress(walletAddress);
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(walletAddress);
    }
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Return the user data
    res.json({
      address: wallet.address,
      balance: wallet.balance,
      publicKey: wallet.publicKey,
      createdAt: wallet.createdAt,
      lastUpdated: wallet.lastUpdated
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get current user'
    });
  }
};