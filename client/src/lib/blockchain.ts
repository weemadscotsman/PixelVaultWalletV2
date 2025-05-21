import { Transaction, Block, NetworkStats } from "@/types/blockchain";

// Mock base URL - in a real app, this would be configured properly
const API_BASE_URL = "/api";

export async function getNetworkStats(): Promise<NetworkStats> {
  const endpoints = [
    '/blockchain/status', 
    '/blockchain/metrics', 
    '/blockchain/info',
    '/blockchain/data',  
    '/mem-blockchain/stats'
  ];
  
  // Try all endpoints with retry logic
  for (let i = 0; i < endpoints.length; i++) {
    try {
      console.log(`Attempting to fetch blockchain data from ${endpoints[i]}`);
      
      // Using fetch with timeout to prevent long-hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}${endpoints[i]}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Endpoint ${endpoints[i]} failed with status: ${response.status}`);
        continue; // Try the next endpoint
      }
      
      const data = await response.json();
      console.log(`Successfully fetched data from ${endpoints[i]}:`, data);
      
      // Attempt to get values from any valid field name in the response
      const blockHeight = 
        data.latestBlockHeight ?? 
        data.height ?? 
        data.currentHeight ?? 
        (data.latestBlock?.height) ?? 
        (data.blocks?.[0]?.height) ?? 
        0;
        
      const blockTime = 
        data.blockTime ?? 
        data.averageBlockTime ?? 
        (typeof data.lastBlockTime === 'number' ? 
          `~${Math.round((Date.now() - data.lastBlockTime) / 1000)} sec` : 
          "N/A");
          
      const peers = 
        data.peerCount ?? 
        data.connectedPeers ?? 
        data.peers ?? 
        data.activePeers ?? 
        0;
        
      const hashRate = data.networkHashRate ? 
        `${parseFloat(data.networkHashRate).toFixed(2)} MH/s` : 
        (data.hashRate ? data.hashRate : "N/A");
      
      return {
        blockHeight,
        blockTime,
        peers,
        hashRate
      };
    } catch (error) {
      console.error(`Error fetching from ${endpoints[i]}:`, error);
      // Continue to next endpoint
    }
  }
  
  console.error("All blockchain data endpoints failed");
  
  // Directly try to get the latest data from the mem-blockchain
  try {
    // Try to get block height directly from the backend memory
    const response = await fetch(`${API_BASE_URL}/blockchain/latest`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && typeof data.height === 'number') {
        return {
          blockHeight: data.height,
          blockTime: data.timeElapsed ? `~${Math.round(data.timeElapsed / 1000)} sec` : "N/A",
          peers: data.connections || 0,
          hashRate: data.hashRate || "N/A"
        };
      }
    }
  } catch (err) {
    console.error("Final fallback attempt failed:", err);
  }
  
  // Return zeroed state - NOT MOCK DATA
  return {
    blockHeight: 0,
    blockTime: "Syncing...",
    peers: 0,
    hashRate: "Syncing..."
  };
}

export async function getCurrentBlockHeight(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/network/block-height`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block height: ${response.statusText}`);
  }
  const data = await response.json();
  return data.height;
}

export async function getRecentBlocks(limit: number = 10): Promise<Block[]> {
  const response = await fetch(`${API_BASE_URL}/blocks/recent?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recent blocks: ${response.statusText}`);
  }
  return response.json();
}

export async function getTransactionsByAddress(address: string, limit: number = 10): Promise<Transaction[]> {
  const response = await fetch(`${API_BASE_URL}/transactions?address=${address}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  return response.json();
}

export async function getCurrentBlockReward(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/mining/block-reward`);
  if (!response.ok) {
    throw new Error(`Failed to fetch block reward: ${response.statusText}`);
  }
  const data = await response.json();
  return data.reward;
}

export async function getHalvingProgress(): Promise<{current: number, total: number, nextEstimate: string}> {
  const response = await fetch(`${API_BASE_URL}/mining/halving-progress`);
  if (!response.ok) {
    throw new Error(`Failed to fetch halving progress: ${response.statusText}`);
  }
  return response.json();
}

export async function getRewardDistribution(): Promise<{
  miner: number;
  governance: number;
  staking: number;
  reserve: number;
}> {
  const response = await fetch(`${API_BASE_URL}/mining/reward-distribution`);
  if (!response.ok) {
    throw new Error(`Failed to fetch reward distribution: ${response.statusText}`);
  }
  return response.json();
}

// Utility to convert between PVX and μPVX
export function pvxToMicro(pvx: number): number {
  return Math.round(pvx * 1_000_000);
}

export function microToPvx(microPvx: number): number {
  return microPvx / 1_000_000;
}
