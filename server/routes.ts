import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import blockchainRoutes from "./routes/blockchain-routes";
import walletRoutes from "./routes/wallet-routes";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register blockchain API routes
  app.use("/api/blockchain", blockchainRoutes);
  
  // Register wallet API routes - following the /api/wallet specification
  app.use("/api/wallet", walletRoutes);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  });

  const httpServer = createServer(app);

  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send initial connection status
    ws.send(JSON.stringify({
      type: 'CONNECTION_STATUS',
      data: { connected: true }
    }));
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'SUBSCRIBE_BLOCKCHAIN') {
          // Subscribe to blockchain events
          console.log(`Client subscribed to blockchain updates for ${data.address || 'all'}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}

// Helper functions for formatting data
export function shortenAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

// Calculate a security score for a drop (for demonstration)
export function calculateDropSecurityScore(drop: any): number {
  let score = 70; // Base score
  
  // Add points for specific security features
  if (drop.zkVerified) score += 15;
  if (drop.multiSigRequired) score += 10;
  if (drop.timeDelayedWithdrawals) score += 5;
  
  return Math.min(score, 100); // Cap at 100
}

// Generate a random entity name for simulation
export function getRandomEntityName(): string {
  const prefixes = ['Quantum', 'Neo', 'Cyber', 'Pixel', 'Digital', 'Crypto', 'Meta'];
  const suffixes = ['Logic', 'Nexus', 'Matrix', 'Sphere', 'Chain', 'Vault', 'Forge'];
  
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${randomPrefix}${randomSuffix}`;
}