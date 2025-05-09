export interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  miner: string;
  merkleRoot: string;
  totalTransactions: number;
  size: number;
  transactions?: Transaction[];
}

export interface Transaction {
  hash: string;
  type: string; // Using string instead of enum to avoid usage issues
  fromAddress: string; // Changed from 'from' to be more explicit
  toAddress: string;   // Changed from 'to' to be more explicit
  amount: number;
  timestamp: number;
  nonce: number;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
  fee?: number;
  metadata?: any;
  note?: string;
  
  // Keeping these for backwards compatibility
  from?: string;
  to?: string;
}

export interface Wallet {
  address: string;
  publicKey: string;
  balance: string;
  createdAt: Date;
  lastUpdated: Date; // Changed from lastSynced to match database schema
  nonce?: number; // Added to track transaction nonces for security
  passphraseSalt?: string;
  passphraseHash?: string;
}

export interface MiningStats {
  address: string;
  blocksMined: number;
  totalRewards: string;
  lastBlockMined: number;
  isCurrentlyMining: boolean;
  hardware: 'CPU' | 'GPU' | 'ASIC';
  joinedAt: Date;
  currentHashRate: number;
}

export interface StakeRecord {
  id: string;
  walletAddress: string;
  poolId: string;
  amount: string;
  startTime: number;
  endTime?: number;
  unlockTime?: number;
  isActive: boolean;
  rewards?: string;
  lastRewardClaim?: number;
  lastRewardTime?: number;
  autoCompound?: boolean;
}

export interface StakingPool {
  id: string;
  name: string;
  description: string;
  apr: number;
  apy?: string;
  minStakeAmount: number;
  minStake?: number; // Alias for minStakeAmount
  lockupPeriod: number;
  totalStaked: string;
  activeStakers: number;
}

export type ThringletEmotionState = 
  | 'happy'
  | 'sad'
  | 'excited'
  | 'neutral'
  | 'angry'
  | 'curious';

export enum ThringletPersonalityTrait {
  ANALYTICAL = 'analytical',
  CURIOUS = 'curious',
  CREATIVE = 'creative',
  ADVENTUROUS = 'adventurous',
  CAUTIOUS = 'cautious',
  SOCIAL = 'social',
  PROTECTIVE = 'protective',
  CHAOTIC = 'chaotic',
  LOGICAL = 'logical',
  EMOTIONAL = 'emotional'
}

export enum BlockchainAffinity {
  MINING = 'mining',
  STAKING = 'staking',
  PRIVACY = 'privacy',
  GOVERNANCE = 'governance',
  DEFI = 'defi',
  INNOVATION = 'innovation',
  SECURITY = 'security',
  SCALING = 'scaling'
}

export enum BadgeType {
  TRANSACTION = 'transaction',
  MINING = 'mining',
  STAKING = 'staking',
  GOVERNANCE = 'governance',
  THRINGLET = 'thringlet',
  SPECIAL = 'special'
}

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  MINING_REWARD = 'MINING_REWARD',
  STAKING_REWARD = 'STAKING_REWARD',
  STAKE_START = 'STAKE_START',
  STAKE_END = 'STAKE_END',
  DROP_CLAIM = 'DROP_CLAIM',
  GOVERNANCE_PROPOSAL = 'GOVERNANCE_PROPOSAL',
  GOVERNANCE_VOTE = 'GOVERNANCE_VOTE',
  LEARNING_REWARD = 'LEARNING_REWARD'
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  MYTHIC = 'mythic'
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tier: string;
  category: string;
  requirements: any;
  dateAdded: number;
  type?: BadgeType;
  rarity?: BadgeRarity;
  icon?: string;
  requirement?: string;
  secret?: boolean;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  progress?: number;
  earnedAt?: number;
}

export interface Thringlet {
  id: string;
  name: string;
  ownerAddress: string;
  emotionState: ThringletEmotionState;
  personalityTraits: any;
  blockchainAffinities: any;
  level: number;
  experience: number;
  backstory: string;
  abilities: any[];
  lastInteraction: number;
  interactionCount?: number;
  stateHistory?: {state: ThringletEmotionState, timestamp: number}[];
  stats: {
    strength: number;
    intelligence: number;
    agility: number;
    charisma: number;
  };
}

export interface BlockchainStatus {
  isRunning: boolean;
  latestBlockHeight: number;
  difficulty: number;
  networkHashRate: number;
  lastBlockTime: number;
  connected?: boolean;
  latestBlock?: Block;
  
  // Additional properties used in routes
  height?: number; // Alias for latestBlockHeight
  activeMiners?: number;
  pendingTransactions?: number;
  totalTransactions?: number;
}

export interface BlockchainMetrics {
  totalBlocks: number;
  totalTransactions: number;
  totalMiners: number;
  totalWallets: number;
  totalStaked: string;
  totalSupply: string;
  circulatingSupply: string;
  averageBlockTime: number;
  difficulty: number;
  networkHashRate: number;
}

export interface BlockchainTrends {
  timeIntervals: string[];
  hashRates: number[];
  transactions: number[];
  newUsers: number[];
  blockTimes: number[];
  difficulties: number[];
}