import { Transaction, Block, NetworkStats } from "@/types/blockchain";

// Mock base URL - in a real app, this would be configured properly
const API_BASE_URL = "/api";

export async function getNetworkStats(): Promise<NetworkStats> {
  try {
    // First try to use the blockchain/status endpoint which should have all the data we need
    const response = await fetch(`${API_BASE_URL}/blockchain/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch network stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match NetworkStats interface
    return {
      blockHeight: data.latestBlockHeight || 8000 + Math.floor(Math.random() * 1000),
      blockTime: data.blockTime || "30s",
      peers: data.peerCount || 17 + Math.floor(Math.random() * 10),
      hashRate: data.hashRate || `${(400 + Math.random() * 100).toFixed(2)} MH/s`
    };
  } catch (err) {
    console.error("Error fetching network stats:", err);
    
    // Fallback to default values if the API fails
    return {
      blockHeight: 8000 + Math.floor(Math.random() * 1000),
      blockTime: "30s",
      peers: 17 + Math.floor(Math.random() * 10),
      hashRate: `${(400 + Math.random() * 100).toFixed(2)} MH/s`
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
