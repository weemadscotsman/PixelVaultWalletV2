import { MiningReward, MiningStats } from "@/types/blockchain";

// Base URL for blockchain API
const API_BASE_URL = "/api/blockchain";

// Start mining process
export async function startMining(address: string, threads: number = 2, hardwareType: string = 'cpu'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/mining/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, threads, hardwareType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start mining: ${response.statusText}`);
    }

    const data = await response.json();
    return true; // Return true if we got a successful response
  } catch (error) {
    console.error("Error starting mining:", error);
    throw new Error("Failed to start mining");
  }
}

// Stop mining process
export async function stopMining(address: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/mining/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop mining: ${response.statusText}`);
    }

    const data = await response.json();
    return true; // Return true if we got a successful response
  } catch (error) {
    console.error("Error stopping mining:", error);
    throw new Error("Failed to stop mining");
  }
}

// Get current mining stats for an address
export async function getMiningStats(address: string): Promise<MiningStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/mining/stats/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch mining stats: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching mining stats:", error);
    throw new Error("Failed to fetch mining stats");
  }
}

// Get mining rewards for an address
export async function getMiningRewards(address: string): Promise<MiningReward[]> {
  try {
    // This endpoint might need to be added to the server if it doesn't exist yet
    const response = await fetch(`${API_BASE_URL}/mining/rewards/${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch mining rewards: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching mining rewards:", error);
    throw new Error("Failed to fetch mining rewards");
  }
}

// Web Worker based mining implementation
// In a real implementation, this would use WebAssembly for improved performance
export class WebWorkerMiner {
  private worker: Worker | null = null;
  private address: string;
  private isRunning: boolean = false;
  private hashRate: number = 0;
  private onHashRateUpdate: (hashRate: number) => void;
  private onBlockFound: (blockHeight: number, reward: number) => void;

  constructor(
    address: string,
    onHashRateUpdate: (hashRate: number) => void,
    onBlockFound: (blockHeight: number, reward: number) => void
  ) {
    this.address = address;
    this.onHashRateUpdate = onHashRateUpdate;
    this.onBlockFound = onBlockFound;
  }

  public start(threads: number = 2, speedMultiplier: number = 1, hardwareType: string = 'cpu'): void {
    if (this.isRunning) {
      console.warn("Miner is already running");
      return;
    }

    // In a real implementation, we would:
    // 1. Create a Web Worker
    // 2. Initialize it with mining parameters
    // 3. Start the mining process
    
    // Simulate mining with periodic updates
    this.isRunning = true;
    this.simulateMining(threads, speedMultiplier);
    
    // Report mining started to server
    startMining(this.address, threads, hardwareType)
      .catch(error => console.error("Error reporting mining start to server:", error));
  }

  public stop(): void {
    if (!this.isRunning) {
      console.warn("Miner is not running");
      return;
    }

    this.isRunning = false;
    this.hashRate = 0;
    this.onHashRateUpdate(0);
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Report mining stopped to server
    stopMining(this.address)
      .catch(error => console.error("Error reporting mining stop to server:", error));
  }

  private simulateMining(threads: number, speedMultiplier: number = 1): void {
    // This is a simplified simulation
    // In a real implementation, this would be replaced by actual mining logic
    
    // Simulate hash rate based on threads and hardware type
    const baseHashRate = 50; // hashes per second per thread
    const maxHashRate = baseHashRate * threads * speedMultiplier;
    
    // Periodically update hash rate with some variability
    const updateInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(updateInterval);
        return;
      }
      
      // Simulate some variability in hash rate
      const variability = Math.random() * 0.2 - 0.1; // +/- 10%
      this.hashRate = maxHashRate * (1 + variability);
      this.onHashRateUpdate(this.hashRate);
      
      // Simulate finding a block (probability increases with hardware capabilities)
      // In a real implementation, this would be based on actual mining results
      const baseFindBlockProbability = 0.001; // 0.1% chance per update for CPU
      const hardwareFactor = Math.min(speedMultiplier, 5); // Cap the probability increase
      const findBlockProbability = baseFindBlockProbability * hardwareFactor;
      
      if (Math.random() < findBlockProbability) {
        // Simulate block found
        const mockBlockHeight = 3420000 + Math.floor(Math.random() * 10000);
        const mockReward = 75; // 50% of 150 PVX block reward
        this.onBlockFound(mockBlockHeight, mockReward);
      }
    }, 1000);
  }
}
