import express, { Request, Response, NextFunction } from "express";
import { json, urlencoded } from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoutes } from "./routes";
import * as blockchainService from "./services/blockchain-service";
import { setupVite, serveStatic } from "./vite";
import { dbInit } from "./database/dbInit";
import { closeDatabase, checkDatabaseConnection } from "./database";

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
app.use(cors({ origin: '*' })); // Allow all for dev
app.use(json());
app.use(urlencoded({ extended: true }));
console.log("[BACKEND LIFECYCLE] Stage 3: Core middleware (cors, json, urlencoded) added.");

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
      const server = await registerRoutes(app);
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