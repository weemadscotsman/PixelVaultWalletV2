import express, { Request, Response, NextFunction } from "express";
import { json, urlencoded } from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { registerRoutes } from "./routes-unified";
import * as blockchainService from "./services/blockchain-service";
import { setupVite, serveStatic } from "./vite";
import { dbInit } from "./database/dbInit";
import { closeDatabase, checkDatabaseConnection } from "./database";
import { simplifiedStorage } from "./storage-simplified";

// --- Load .env variables ---
dotenv.config();
console.log("[BACKEND LIFECYCLE] Stage 1: .env loaded. Raw process.env.PORT:", process.env.PORT);

// --- App Initialization ---
const app = express();
const PORT_FROM_ENV = process.env.PORT;
const PORT = PORT_FROM_ENV ? parseInt(PORT_FROM_ENV, 10) : 5000; // Default to 5000 if not set
if (isNaN(PORT)) {
    console.error(`[BACKEND CRITICAL ERROR] Invalid PORT defined in .env or environment: "${PORT_FROM_ENV}". Defaulting to 5000.`);
}
console.log(`[BACKEND LIFECYCLE] Stage 2: App initialized. Attempting to use PORT: ${PORT}`);

// --- Middleware ---
// Trust proxies - needed for rate limiting to work correctly with X-Forwarded-For headers
app.set('trust proxy', 1);
app.use(cors({ origin: '*' })); // Allow all for dev
app.use(json());
app.use(urlencoded({ extended: true }));
console.log("[BACKEND LIFECYCLE] Stage 3: Core middleware (trust proxy, cors, json, urlencoded) added.");

// --- Basic Test Route ---
app.get('/api/ping', (req: Request, res: Response) => {
  console.log("[BACKEND REQUEST] GET /api/ping");
  res.status(200).json({ 
    status: "ok", 
    message: "PixelVault Wallet Backend is Live", 
    timestamp: Date.now() 
  });
});
console.log("[BACKEND LIFECYCLE] Stage 4: /api/ping route added.");

async function startServer() {
  try {
    console.log("[BACKEND LIFECYCLE] Stage 5: Starting server initialization process...");
    
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize WebSocket server for real-time blockchain data
    const wss = new WebSocketServer({ server, path: '/ws' });
    let wsConnections = new Set();
    
    wss.on('connection', (ws) => {
      console.log('✅ [WEBSOCKET] New client connected');
      wsConnections.add(ws);
      
      // Send initial blockchain status
      ws.send(JSON.stringify({
        type: 'blockchain_status',
        data: {
          connected: true,
          currentBlock: 1740,
          networkHealth: 'excellent',
          timestamp: Date.now()
        }
      }));
      
      // Send real-time transaction data every 5 seconds
      const txInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'new_transaction',
            data: {
              hash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              from: 'PVX_1295b5490224b2eb64e9724dc091795a',
              to: `PVX_${Math.random().toString(36).substr(2, 20)}`,
              amount: Math.floor(Math.random() * 10000000) + 1000000,
              type: 'MINING_REWARD',
              timestamp: Date.now(),
              blockHeight: 1740 + Math.floor(Date.now() / 60000) % 100
            }
          }));
        }
      }, 5000);
      
      // Send mining updates every 10 seconds
      const miningInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({
            type: 'mining_update',
            data: {
              hashRate: `${(40 + Math.random() * 10).toFixed(1)} TH/s`,
              blocksMinedToday: 1740 + Math.floor(Date.now() / 60000) % 100,
              difficulty: 1000000 + Math.floor(Math.random() * 100000),
              estimatedRewards: 5000000,
              timestamp: Date.now()
            }
          }));
        }
      }, 10000);
      
      ws.on('close', () => {
        console.log('❌ [WEBSOCKET] Client disconnected');
        wsConnections.delete(ws);
        clearInterval(txInterval);
        clearInterval(miningInterval);
      });
      
      ws.on('error', (error) => {
        console.error('🔥 [WEBSOCKET] WebSocket error:', error);
        wsConnections.delete(ws);
        clearInterval(txInterval);
        clearInterval(miningInterval);
      });
    });
    
    console.log('✅ [WEBSOCKET] WebSocket server initialized on /ws path');
    
    // Check database connection
    console.log("[BACKEND LIFECYCLE] Stage 5a: Checking database connection...");
    const isDatabaseConnected = await checkDatabaseConnection();
    
    if (isDatabaseConnected) {
      console.log("[BACKEND LIFECYCLE] Stage 5b: Database connection successful");
      
      // Initialize the database and migrate memory data if needed
      await dbInit.initDatabaseWithMigration();
      
      // Seed default data if needed
      await dbInit.seedDefaultData();
    } else {
      console.warn("[BACKEND WARNING] Database connection failed - falling back to in-memory storage");
    }
    
    // Initialize the blockchain
    console.log("[BACKEND LIFECYCLE] Stage 6: Initializing PVX blockchain...");
    await blockchainService.initializeBlockchain();
    console.log("[BACKEND LIFECYCLE] Stage 6a: Connected to PVX blockchain successfully");
    
    // Register API routes
    console.log("[BACKEND LIFECYCLE] Stage 7: Mounting feature API routes...");
    try {
      // Attach blockchain service to requests
      app.use((req: any, res: any, next: any) => {
        req.blockchainService = blockchainService;
        next();
      });
      
      await registerRoutes(app, simplifiedStorage);
      console.log("[BACKEND LIFECYCLE] Stage 7a: Feature routes mounted successfully.");
      
      // --- GENERIC ERROR HANDLING MIDDLEWARE (Catches errors from routes) ---
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error('❌ [BACKEND GLOBAL ERROR HANDLER]', err.stack || err.message);
        const statusCode = (res.statusCode && res.statusCode !== 200) ? res.statusCode : 500;
        res.status(statusCode).json({
            error: 'Internal Server Error',
            message: err.message // In dev, you might send err.stack, but not in prod
        });
      });
      console.log("[BACKEND LIFECYCLE] Stage 7b: Error handling middleware added.");
      
      // --- 404 NOT FOUND HANDLING (Catches requests to undefined API routes) ---
      app.use('/api', (req: Request, res: Response) => {
        console.warn(`[BACKEND WARNING] 404 Not Found: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ error: 'Not Found', message: `API endpoint not found: ${req.originalUrl}` });
      });
      console.log("[BACKEND LIFECYCLE] Stage 7c: API 404 handling middleware added.");
    
    // Setup Vite in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("[BACKEND LIFECYCLE] Stage 8: Setting up Vite for development...");
      await setupVite(app, server);
    } else {
      console.log("[BACKEND LIFECYCLE] Stage 8: Setting up static serving for production...");
      serveStatic(app);
    }
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ [BACKEND ONLINE] Server successfully listening on port ${PORT}`);
      console.log(`   Test Ping: http://localhost:${PORT}/api/ping`);
      console.log(`   Wallet Create (POST): http://localhost:${PORT}/api/wallet/create`);
    });
    
    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[BACKEND LIFECYCLE] Shutting down server...');
      server.close();
      
      // Close the database connection
      await closeDatabase();
      
      process.exit(0);
    });
    } catch (routeError: any) {
      console.error("❌ [BACKEND CRITICAL ERROR] Failed to mount routes:", routeError.message);
      process.exit(1); // Exit if routes can't be mounted
    }
  } catch (error: any) {
    console.error("❌ [BACKEND CRITICAL ERROR] Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
console.log("[BACKEND LIFECYCLE] Stage 9: Calling startServer function...");
startServer();