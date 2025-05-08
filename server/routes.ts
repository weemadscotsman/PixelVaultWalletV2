import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { WebSocketServer } from 'ws';
import walletRoutes from './routes/wallet';
import txRoutes from './routes/tx';
import stakeRoutes from './routes/stake';
import thringletRoutes from './routes/thringlet';
import authRoutes from './routes/auth';
import blockchainRoutes from './routes/blockchain-routes';
import badgeRoutes from './routes/badge';

export async function registerRoutes(app: Express): Promise<Server> {
  // PVX blockchain API routes
  app.use('/api/wallet', walletRoutes);
  app.use('/api/tx', txRoutes);
  app.use('/api/stake', stakeRoutes);
  app.use('/api/thringlet', thringletRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/blockchain', blockchainRoutes);
  app.use('/api/badge', badgeRoutes);

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