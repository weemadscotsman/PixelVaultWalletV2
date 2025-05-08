// Blockchain type definitions

export interface NetworkStats {
  blockHeight: number;
  blockTime: string;
  peers: number;
  hashRate: string;
}

export interface Block {
  height: number;
  hash: string;
  prevHash: string;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  miner: string;
  difficulty: number;
  size: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  confirmations: number;
  blockHeight?: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'stake' | 'unstake' | 'mining_reward' | 'staking_reward';
}

export interface Wallet {
  address: string;
  balance: string;
  transactions: number;
  createdAt: number;
  lastActive: number;
}

export interface MiningStats {
  address: string;
  isActive: boolean;
  totalBlocks: number;
  totalRewards: number;
  hashRate: string;
  lastBlock?: {
    height: number;
    timestamp: number;
    reward: number;
  };
}

export interface StakeRecord {
  id: string;
  address: string;
  amount: number;
  poolId: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  rewards: number;
  apr: number;
}

export interface StakingPool {
  id: string;
  name: string;
  description: string;
  baseApr: number;
  lockupPeriod: number;
  minAmount: number;
  totalStaked: number;
  participants: number;
}