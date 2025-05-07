import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// In-memory storage for users
const users = new Map();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'pvx-blockchain-secret-key';

/**
 * Login to account
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Get user
    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Verify password
    const hash = crypto.createHash('sha256')
      .update(password + user.salt)
      .digest('hex');
    
    if (hash !== user.password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallets: user.wallets,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to login'
    });
  }
};

/**
 * Register a new account
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    
    // Check if username already exists
    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Generate salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash password
    const hash = crypto.createHash('sha256')
      .update(password + salt)
      .digest('hex');
    
    // Generate user ID
    const id = crypto.randomBytes(16).toString('hex');
    
    // Create user
    const user = {
      id,
      username,
      email,
      password: hash,
      salt,
      wallets: [],
      role: 'user',
      createdAt: Date.now()
    };
    
    // Save user
    users.set(username, user);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallets: user.wallets,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error registering:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to register'
    });
  }
};

/**
 * Logout from account
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // In a real implementation, you would invalidate the token
    // For now, we just return a success message
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to logout'
    });
  }
};

/**
 * Get current user info
 * GET /api/auth/user
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string, username: string };
      
      // Get user
      const user = users.get(decoded.username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        wallets: user.wallets,
        role: user.role
      });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get current user'
    });
  }
};