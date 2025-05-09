import express from "express";
import { json, urlencoded } from "express";
import { registerRoutes } from "./routes";
import * as blockchainService from "./services/blockchain-service";
import { setupVite, serveStatic } from "./vite";
import { dbInit } from "./database/dbInit";
import { closeDatabase, checkDatabaseConnection } from "./database";

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

async function startServer() {
  try {
    // Check database connection
    console.log("Checking database connection...");
    const isDatabaseConnected = await checkDatabaseConnection();
    
    if (isDatabaseConnected) {
      console.log("Database connection successful");
      
      // Initialize the database and migrate memory data if needed
      await dbInit.initDatabaseWithMigration();
      
      // Seed default data if needed
      await dbInit.seedDefaultData();
    } else {
      console.warn("Database connection failed - falling back to in-memory storage");
    }
    
    // Initialize the blockchain
    console.log("Initializing PVX blockchain...");
    await blockchainService.initializeBlockchain();
    console.log("Connecting to PVX blockchain...");
    console.log("Connected to PVX blockchain successfully");
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Setup Vite in development mode
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`[express] serving on port ${PORT}`);
    });
    
    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      server.close();
      
      // Close the database connection
      await closeDatabase();
      
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();