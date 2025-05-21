import { Transaction, Block, NetworkStats } from "@/types/blockchain";

// Mock base URL - in a real app, this would be configured properly
const API_BASE_URL = "/api";

export async function getNetworkStats(): Promise<NetworkStats> {
  try {
    // First try to use the blockchain/status endpoint which has the real blockchain data
    const response = await fetch(`${API_BASE_URL}/blockchain/status`, {
      // Add cache-busting to ensure we always get fresh data
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      // Try the alternative endpoint if the primary one fails
      const altResponse = await fetch(`${API_BASE_URL}/blockchain/info`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!altResponse.ok) {
        throw new Error(`Failed to fetch network stats: ${response.statusText}`);
      }
      
      const altData = await altResponse.json();
      console.log("Using alternative blockchain data source:", altData);
      
      return {
        blockHeight: altData.currentHeight || altData.height || 0,
        blockTime: altData.averageBlockTime || altData.blockTime || "N/A",
        peers: altData.connectedPeers || altData.peers || 0,
        hashRate: altData.networkHashRate ? `${altData.networkHashRate.toFixed(2)} MH/s` : "N/A"
      };
    }
    
    const data = await response.json();
    console.log("Using primary blockchain data source:", data);
    
    // Transform the data to match NetworkStats interface - no fallbacks to mock data
    return {
      blockHeight: data.latestBlockHeight || data.height || (data.latestBlock ? data.latestBlock.height : 0),
      blockTime: data.blockTime || data.averageBlockTime || "N/A",
      peers: data.peerCount || data.connectedPeers || data.peers || 0,
      hashRate: data.networkHashRate ? 
                `${data.networkHashRate.toFixed(2)} MH/s` : 
                (data.hashRate ? data.hashRate : "N/A")
    };
  } catch (err) {
    console.error("Error fetching network stats:", err);
    
    // Try a last resort direct attempt on the raw blockchain endpoint
    try {
      const lastResortResponse = await fetch(`${API_BASE_URL}/blockchain/raw-stats`);
      if (lastResortResponse.ok) {
        const rawData = await lastResortResponse.json();
        console.log("Using raw blockchain stats data:", rawData);
        
        return {
          blockHeight: rawData.height || 0,
          blockTime: rawData.blockTime || "N/A",
          peers: rawData.peers || 0,
          hashRate: rawData.hashRate || "N/A"
        };
      }
    } catch (lastResortErr) {
      console.error("Last resort blockchain stats fetch also failed:", lastResortErr);
    }
    
    // If all attempts fail, return zeroed data - no mock values
    return {
      blockHeight: 0,
      blockTime: "N/A",
      peers: 0,
      hashRate: "N/A"
    };
  }
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
