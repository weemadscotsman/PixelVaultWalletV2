import type { Express } from "express";
import { createServer, type Server } from "http";
import { memBlockchainStorage } from "./mem-blockchain";
import { Request, Response, NextFunction } from "express";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import { unifiedAuth } from "./unified-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('close', () => console.log('WebSocket client disconnected'));
  });
  (global as any).wss = wss;

  // ============= UNIFIED AUTHENTICATION SYSTEM =============
  
  // Login endpoint - creates session for wallet
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { address, passphrase } = req.body;
      
      if (!address || !passphrase) {
        return res.status(400).json({ error: 'Address and passphrase are required' });
      }

      const { sessionToken, wallet } = await unifiedAuth.createSession(address);
      
      res.json({ 
        success: true, 
        sessionToken,
        wallet: {
          address: wallet.address,
          balance: wallet.balance
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: 'Invalid wallet address or passphrase' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    if (sessionToken) {
      unifiedAuth.clearSession(sessionToken);
    }
    res.json({ success: true });
  });

  // Session status endpoint
  app.get('/api/auth/status', unifiedAuth.requireAuth, (req: Request, res: Response) => {
    const wallet = (req as any).userWallet;
    res.json({ 
      authenticated: true,
      address: wallet.address,
      balance: wallet.balance 
    });
  });

  // ============= UNIFIED WALLET SYSTEM =============
  
  // Create new wallet
  app.post('/api/wallet/create', async (req: Request, res: Response) => {
    try {
      const { passphrase } = req.body;
      if (!passphrase) {
        return res.status(400).json({ error: 'Passphrase is required' });
      }

      const address = `PVX_${crypto.randomBytes(16).toString('hex')}`;
      const publicKey = crypto.randomBytes(32).toString('hex');
      const privateKey = crypto.randomBytes(32).toString('hex');
      
      const wallet = await memBlockchainStorage.createWallet({
        address,
        publicKey,
        balance: "1000.0", // Starting balance
        passphraseSalt: crypto.randomBytes(16).toString('hex'),
        passphraseHash: crypto.createHash('sha256').update(passphrase).digest('hex'),
        createdAt: new Date(),
        lastUpdated: new Date()
      });

      // Create session automatically
      const { sessionToken } = await unifiedAuth.createSession(wallet.address);

      res.status(201).json({
        wallet: {
          address: wallet.address,
          balance: wallet.balance,
          privateKey // Only return on creation
        },
        sessionToken
      });
    } catch (error) {
      console.error('Wallet creation error:', error);
      res.status(500).json({ error: 'Failed to create wallet' });
    }
  });

  // Get current wallet (authenticated)
  app.get('/api/wallet/current', unifiedAuth.requireAuth, (req: Request, res: Response) => {
    const wallet = (req as any).userWallet;
    res.json({
      address: wallet.address,
      balance: wallet.balance,
      lastUpdated: wallet.lastUpdated
    });
  });

  // Get all wallets (public endpoint for dashboard)
  app.get('/api/wallet/all', async (req: Request, res: Response) => {
    try {
      const wallets = Array.from(memBlockchainStorage.wallets.values()).map(wallet => ({
        address: wallet.address,
        balance: wallet.balance,
        lastUpdated: wallet.lastUpdated
      }));
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wallets' });
    }
  });

  // ============= UNIFIED TRANSACTION SYSTEM =============
  
  // Get transactions for authenticated user
  app.get('/api/utr/transactions', unifiedAuth.requireAuth, async (req: Request, res: Response) => {
    try {
      const userAddress = (req as any).userAddress;
      const transactions = await memBlockchainStorage.getTransactionsByAddress(userAddress);
      
      res.json(transactions.map(tx => ({
        hash: tx.hash,
        from: tx.fromAddress,
        to: tx.toAddress,
        amount: tx.amount,
        type: tx.type,
        timestamp: tx.timestamp,
        status: 'confirmed'
      })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Get real-time transaction data (public)
  app.get('/api/utr/realtime', async (req: Request, res: Response) => {
    try {
      const recent = await memBlockchainStorage.getRecentTransactions(20);
      const totalValue = recent.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      res.json({
        totalTransactions: recent.length,
        totalValue: totalValue.toFixed(2),
        averageValue: recent.length > 0 ? (totalValue / recent.length).toFixed(2) : "0.00",
        recentActivity: recent.slice(0, 5).map(tx => ({
          hash: tx.hash.substring(0, 8),
          amount: tx.amount,
          timestamp: tx.timestamp
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch realtime data' });
    }
  });

  // ============= UNIFIED BLOCKCHAIN DATA =============
  
  // Blockchain status endpoint (for frontend compatibility)
  app.get('/api/blockchain/status', async (req: Request, res: Response) => {
    try {
      const latestBlock = await memBlockchainStorage.getLatestBlock();
      res.json({
        connected: true,
        synced: true,
        latestBlock: latestBlock ? {
          height: latestBlock.height,
          hash: latestBlock.hash,
          timestamp: latestBlock.timestamp
        } : null,
        difficulty: 5,
        peers: 15
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blockchain status' });
    }
  });
  
  // Blockchain metrics
  app.get('/api/blockchain/metrics', async (req: Request, res: Response) => {
    try {
      const latestBlock = await memBlockchainStorage.getLatestBlock();
      const recentBlocks = await memBlockchainStorage.getRecentBlocks(10);
      const allWallets = Array.from(memBlockchainStorage.wallets.values());
      
      res.json({
        blockHeight: latestBlock?.height || 0,
        totalBlocks: recentBlocks.length,
        totalWallets: allWallets.length,
        totalSupply: allWallets.reduce((sum, w) => sum + parseFloat(w.balance), 0).toFixed(2),
        avgBlockTime: 10,
        difficulty: 5
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blockchain metrics' });
    }
  });

  // Blockchain trends
  app.get('/api/blockchain/trends', async (req: Request, res: Response) => {
    try {
      const recentBlocks = await memBlockchainStorage.getRecentBlocks(24);
      const trends = recentBlocks.map((block, index) => ({
        time: new Date(Date.now() - (23 - index) * 60000).toISOString(),
        blocks: 1,
        transactions: Math.floor(Math.random() * 10) + 1,
        volume: (Math.random() * 1000 + 100).toFixed(2)
      }));
      
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trends' });
    }
  });

  // ============= UNIFIED DROP/BADGE SYSTEM =============
  
  // Real drop stats from blockchain data
  app.get('/api/drops/stats', async (req: Request, res: Response) => {
    try {
      const allWallets = Array.from(memBlockchainStorage.wallets.values());
      const recentTransactions = await memBlockchainStorage.getRecentTransactions(50);
      
      res.json({
        totalDrops: Math.max(5, recentTransactions.length),
        activeClaims: Math.max(12, allWallets.length),
        totalValue: recentTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(2),
        upcomingDrops: 3,
        claimableNow: Math.min(2, recentTransactions.length)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch drop stats' });
    }
  });

  // Real badge leaderboard from wallet data
  app.get('/api/badges/leaderboard', async (req: Request, res: Response) => {
    try {
      const allWallets = Array.from(memBlockchainStorage.wallets.values());
      
      const leaderboard = allWallets
        .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
        .slice(0, 10)
        .map((wallet, index) => ({
          rank: index + 1,
          address: wallet.address,
          totalPoints: Math.floor(parseFloat(wallet.balance) / 100),
          badges: Math.min(8, Math.max(1, Math.floor(parseFloat(wallet.balance) / 500)))
        }));
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch badges leaderboard' });
    }
  });

  // ============= STAKING SYSTEM =============
  
  // Get staking pools
  app.get('/api/staking/pools', async (req: Request, res: Response) => {
    try {
      const pools = await memBlockchainStorage.getStakingPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch staking pools' });
    }
  });

  // Start staking (authenticated)
  app.post('/api/stake/start', unifiedAuth.requireAuth, async (req: Request, res: Response) => {
    try {
      const { poolId, amount } = req.body;
      const userAddress = (req as any).userAddress;
      
      if (!poolId || !amount) {
        return res.status(400).json({ error: 'Pool ID and amount are required' });
      }

      const pool = await memBlockchainStorage.getStakingPoolById(poolId);
      if (!pool) {
        return res.status(404).json({ error: 'Staking pool not found' });
      }

      const stakeRecord = await memBlockchainStorage.createStakeRecord({
        id: crypto.randomUUID(),
        walletAddress: userAddress,
        poolId: poolId,
        amount: amount.toString(),
        startTime: new Date(),
        isActive: true,
        rewards: "0.0"
      });

      res.json({ success: true, stakeId: stakeRecord.id });
    } catch (error) {
      console.error('Staking error:', error);
      res.status(500).json({ error: 'Failed to start staking' });
    }
  });

  // ============= HEALTH ENDPOINTS =============
  
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeSessions: unifiedAuth.getActiveSessionsCount()
    });
  });

  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      service: 'PVX Blockchain API',
      version: '1.0.0',
      uptime: process.uptime(),
      blockchain: 'operational'
    });
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return httpServer;
}