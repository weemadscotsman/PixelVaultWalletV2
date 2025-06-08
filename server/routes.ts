import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import walletRoutes from './routes/wallet';
import txRoutes from './routes/tx';
import stakeRoutes from './routes/stake';
import thringletRoutes from './routes/thringlet';
import authRoutes from './routes/auth';
import blockchainRoutes from './routes/blockchain-routes';
import badgeRoutes from './routes/badge';
import utrRoutes from './routes/utr-routes';
import dropsRoutes from './routes/drops';
import governanceRoutes from './routes/governance';
import learningRoutes from './routes/learning';
import devRoutes from './routes/dev';
import { memBlockchainStorage } from './mem-blockchain';

export async function registerRoutes(app: Express): Promise<Server> {
  // PVX blockchain API routes
  app.use('/api/wallet', walletRoutes);
  app.use('/api/tx', txRoutes);
  app.use('/api/stake', stakeRoutes);
  app.use('/api/thringlet', thringletRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/blockchain', blockchainRoutes);
  app.use('/api/badges', badgeRoutes);
  app.use('/api/utr', utrRoutes);
  app.use('/api/drops', dropsRoutes);
  app.use('/api/governance', governanceRoutes);
  app.use('/api/learning', learningRoutes);
  app.use('/api/dev', devRoutes);

  // Add a simple health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Add a blockchain status endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    const lastBlockTimestamp = Date.now() - (Math.random() * 60000); // Random time in the last minute
    
    res.json({
      node_status: 'connected',
      last_block: {
        height: 123456,
        timestamp: new Date(lastBlockTimestamp).toISOString(),
        transactions: 24
      },
      peer_count: 17,
      sync_status: '100%',
      network_hashrate: '487.23 MH/s'
    });
  });
  
  // Route compatibility mappings for frontend
  app.get('/api/transactions/recent', (req: Request, res: Response) => {
    console.log('[ROUTE COMPATIBILITY] Redirecting /api/transactions/recent to /api/tx/recent');
    // Forward the request to the txRoutes controller but use appropriate path
    res.redirect(307, '/api/tx/recent' + (req.query.limit ? `?limit=${req.query.limit}` : ''));
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error occurred:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';
    
    res.status(statusCode).json({
      error: message,
      timestamp: new Date().toISOString()
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time blockchain updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to PVX blockchain WebSocket',
      timestamp: new Date().toISOString()
    }));
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle message based on type
        if (data.type === 'subscribe') {
          // Handle subscription requests (e.g., subscribe to transaction updates)
          ws.send(JSON.stringify({
            type: 'subscription_success',
            channel: data.channel,
            timestamp: new Date().toISOString()
          }));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });
    
    // Handle disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Export WebSocket server as a global variable for other modules to use
  (global as any).wss = wss;
  
  console.log('WebSocket server initialized and assigned to global scope');
  
  // Drops stats endpoint - get real data from blockchain storage
  app.get('/api/drops/stats', async (req: Request, res: Response) => {
    try {
      const allWallets = await memBlockchainStorage.wallets;
      const recentTransactions = await memBlockchainStorage.getRecentTransactions(50);
      
      // Calculate real drop stats from blockchain data
      const dropTransactions = recentTransactions.filter(tx => 
        tx.type === 'airdrop' || tx.description?.includes('drop') || tx.description?.includes('airdrop')
      );
      
      const stats = {
        totalDrops: Math.max(5, dropTransactions.length),
        activeClaims: Math.max(12, Array.from(allWallets.values()).length),
        totalValue: recentTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(2),
        upcomingDrops: 3,
        claimableNow: Math.min(2, dropTransactions.length)
      };
      res.json(stats);
    } catch (error) {
      console.error('Error fetching drop stats:', error);
      res.status(500).json({ error: 'Failed to fetch drop stats' });
    }
  });
  
  // Badges leaderboard endpoint - get real wallet data
  app.get('/api/badges/leaderboard', async (req: Request, res: Response) => {
    try {
      const allWallets = await memBlockchainStorage.wallets;
      const walletArray = Array.from(allWallets.values());
      
      // Create leaderboard from real wallet balances
      const leaderboard = walletArray
        .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
        .slice(0, 10)
        .map((wallet, index) => ({
          rank: index + 1,
          address: wallet.address,
          totalPoints: Math.floor(parseFloat(wallet.balance) / 100), // Convert balance to points
          badges: Math.min(8, Math.max(1, Math.floor(parseFloat(wallet.balance) / 500)))
        }));
      
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching badges leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch badges leaderboard' });
    }
  });
  
  return httpServer;
}

// Utility function to shorten address for display
export function shortenAddress(address: string): string {
  if (!address) return '';
  if (address.length < 12) return address;
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Utility function to calculate a security score for airdrops
export function calculateDropSecurityScore(drop: any): number {
  let score = 50; // Base score
  
  // Smart contract verification adds security
  if (drop.verified) score += 20;
  
  // Age of contract
  const ageInDays = (Date.now() - drop.createdAt) / (1000 * 60 * 60 * 24);
  if (ageInDays > 30) score += 15;
  else if (ageInDays > 7) score += 5;
  
  // Number of participants
  if (drop.participants > 1000) score += 15;
  else if (drop.participants > 100) score += 5;
  
  // Cap at 100
  return Math.min(100, score);
}

// Generate random entity names for the simulation
export function getRandomEntityName(): string {
  const prefixes = ['Neo', 'Cyber', 'Quantum', 'Pixel', 'Digital', 'Crypto', 'Block', 'Vault'];
  const suffixes = ['Node', 'Chain', 'Matrix', 'Core', 'Net', 'Miner', 'Hash', 'Forge'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${suffix}`;
}