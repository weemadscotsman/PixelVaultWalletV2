// Transaction types
export type TransactionType = 
  | 'TRANSFER' 
  | 'MINING_REWARD' 
  | 'STAKING_REWARD' 
  | 'STAKE_START' 
  | 'STAKE_END' 
  | 'DROP_CLAIM'
  | 'GOVERNANCE_PROPOSAL'
  | 'GOVERNANCE_VOTE'
  | 'LEARNING_REWARD'
  | 'nft_mint'
  | 'nft_sale'
  | 'nft_transfer';

export interface Transaction {
  hash: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  nonce: number;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
  fee?: number;
  metadata?: any;
  // Alternative property names used in different parts of the codebase
  id?: string; // Used in visualization components
  fromAddress?: string; // Alternative to 'from'
  toAddress?: string; // Alternative to 'to'
  senderAddress?: string; // Alternative to 'from'
  receiverAddress?: string; // Alternative to 'to'
  note?: string; // Used in transaction displays
}

// Block related types
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

// Mining related types
export interface MiningStats {
  address: string;
  blocksMined: number;
  totalRewards: string;
  lastBlockMined: number;
  isCurrentlyMining: boolean;
  hardware: 'CPU' | 'GPU' | 'ASIC';
  joinedAt: Date;
  currentHashRate: number;
  isActive?: boolean;
  totalBlocks?: number; // Alias for blocksMined used in some files
  hashRate?: string; // String representation of currentHashRate
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
  timestamp: number;
  hashRate: number;
  difficulty: number;
  totalTransactions: number;
  activeMiners: number;
  blockTime: number;
}

export type TransactionHash = string;

export interface BlockchainStatus {
  isRunning?: boolean;
  latestBlockHeight?: number;
  difficulty?: number;
  networkHashRate?: number;
  lastBlockTime?: number;
  connected?: boolean;
  synced?: boolean;
  error?: string | null;
  latestBlock?: any;
  peers?: number;  // Number of connected peers
  hashRate?: string; // String representation of networkHashRate
}

// Wallet related types
export interface Wallet {
  address: string;
  publicKey: string;
  publicAddress?: string; // Alias for address used in some files
  balance: string;
  createdAt: Date;
  lastUpdated?: Date;
  lastSynced?: Date; // Supporting both field naming conventions
  passphraseSalt?: string;
  passphraseHash?: string;
  note?: string; // Used in some transaction displays
}

// Staking related types
export interface StakeRecord {
  id: string;
  walletAddress: string;
  poolId: string;
  amount: string;
  startTime: number;
  endTime?: number;
  unlockTime?: number; // Some code uses unlockTime instead of endTime
  isActive: boolean;
  rewards: string;
  lastRewardClaim: number;
  lastRewardTime?: number; // Some code uses lastRewardTime instead of lastRewardClaim
  autoCompound: boolean;
}

export interface StakingPool {
  id: string;
  name: string;
  description: string;
  apr?: number;
  apy?: string; // Some code uses apy instead of apr
  minStake?: string; // Used in mem-blockchain.ts
  minStakeAmount?: number; // Used in other places
  lockupPeriod: number;
  totalStaked: string;
  activeStakers?: number;
  active?: boolean;
}

// Badge related types
export type BadgeType = 
  | 'transaction' 
  | 'mining' 
  | 'staking' 
  | 'governance' 
  | 'thringlet'
  | 'special';
  
export type BadgeRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'mythic';

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

// Thringlet related types
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

export interface Thringlet {
  id: string;
  name: string;
  ownerAddress: string;
  owner?: string; // Alternative name for ownerAddress
  emotionState: ThringletEmotionState;
  personalityTraits: any;
  blockchainAffinities: any;
  level: number;
  experience: number;
  backstory: string;
  description?: string;
  abilities: any[];
  lastInteraction: number;
  interactionCount?: number;
  metadata?: any; // For additional data storage
  stateHistory?: {state: ThringletEmotionState, timestamp: number, trigger?: string}[];
  stats: {
    strength: number;
    intelligence: number;
    agility: number;
    charisma: number;
  };
}

// Governance related types
export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  endTime: number;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  minimumVotingPower: number;
  category: string;
  parameterChanges?: any;
  executionTransactionHash?: string;
}

export interface GovernanceVote {
  proposalId: string;
  voterAddress: string;
  voteType: 'for' | 'against' | 'abstain';
  votingPower: number;
  timestamp: number;
}

// Drop related types
export interface Drop {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  imageUrl: string;
  tokenAmount?: number;
  createdAt: Date;
  expiresAt: Date;
  claimLimit: number;
  minWalletAge: number;
  minStakingAmount: number;
  minMiningBlocks: number;
  securityScore: number;
}

export interface DropClaim {
  dropId: string;
  walletAddress: string;
  claimedAt: Date;
  transactionHash?: string;
}

// Learning related types
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  type: string;
  xpReward: number;
  tokenReward: number;
  badgeId?: string;
  completionCriteria?: any;
  questions?: LearningQuestion[];
}

export interface LearningQuestion {
  id: string;
  moduleId: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface UserLearningProgress {
  userId: string;
  moduleId: string;
  completed: boolean;
  score: number;
  attemptsCount: number;
  lastAttemptDate: number;
  rewardsClaimed: boolean;
}