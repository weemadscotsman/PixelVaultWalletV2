import express from "express";
import { json, urlencoded } from "express";
import { registerRoutes } from "./routes";
import * as blockchainService from "./services/blockchain-service";
import { setupVite, serveStatic } from "./vite";

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

async function startServer() {
  try {
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
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();