/**
 * Enum for transaction types in the PVX blockchain
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  REWARD = 'reward',
  MINE = 'mine',
  VOTE = 'vote',
  NFT_MINT = 'nft_mint',
  NFT_TRANSFER = 'nft_transfer'
}

/**
 * Represents the blockchain status
 */
export interface BlockchainStatus {
  connected: boolean;
  error?: string;
  latestBlock?: {
    height: number;
    hash: string;
    timestamp: number;
  };
  peers?: number;
  networkHashRate?: number;
  circulatingSupply?: string;
  difficulty?: number;
}

/**
 * Represents a transaction hash (for response types)
 */
export type TransactionHash = string;

/**
 * Represents a block in the PVX blockchain
 */
export interface Block {
  hash: string;
  previousHash: string;
  height: number;
  timestamp: number;
  transactions: string[]; // Transaction hashes
  miner: string; // Miner address
  difficulty: number;
  nonce: string;
  reward: string;
}

/**
 * Represents a transaction in the PVX blockchain
 */
export interface Transaction {
  hash: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  nonce: number;
  signature: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

/**
 * Represents a wallet in the PVX blockchain
 */
export interface Wallet {
  address: string;
  publicKey: string;
  balance: string;
  createdAt: Date;
  lastSynced: Date;
  passphraseSalt: string;
  passphraseHash: string;
}

/**
 * Represents statistics for a miner
 */
export interface MiningStats {
  address: string;
  blocksMined: number;
  totalRewards: string;
  isCurrentlyMining: boolean;
  currentHashRate: string;
  lastBlockMined?: number;
}

/**
 * Represents blockchain trends for visualization
 */
export interface BlockchainTrends {
  metrics: any[]; // Simplified for now
}

/**
 * Represents a stake record
 */
export interface StakeRecord {
  id: string;
  address: string;
  poolId: string;
  amount: string;
  startTime: number;
  unlockTime: number;
  lastRewardTime: number;
  isActive: boolean;
}

/**
 * Represents a staking pool
 */
export interface StakingPool {
  id: string;
  name: string;
  apy: string;
  totalStaked: string;
  minStake: string;
  lockupPeriod: number; // Days
}

/**
 * Represents the emotional state of a Thringlet
 */
export enum ThringletEmotionState {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  EXCITED = 'excited',
  TIRED = 'tired',
  HUNGRY = 'hungry',
  SCARED = 'scared',
  LOVE = 'love'
}

/**
 * Represents a state history entry
 */
export interface StateHistoryEntry {
  state: ThringletEmotionState;
  timestamp: number;
}

/**
 * Represents a Thringlet entity
 */
export interface Thringlet {
  id: string;
  name: string;
  owner: string; // Wallet address
  createdAt: number;
  lastInteraction: number;
  emotionalState: ThringletEmotionState;
  interactionCount: number;
  stateHistory: StateHistoryEntry[];
  description?: string;
  metadata?: any;
  zk_verified?: boolean;
  abilities: string[];
}