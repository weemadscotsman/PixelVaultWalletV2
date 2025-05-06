// Transaction types
export enum TransactionType {
  TRANSFER = 'transfer',
  MINING_REWARD = 'mining_reward',
  STAKING_REWARD = 'staking_reward',
  NFT_MINT = 'nft_mint',
  NFT_TRANSFER = 'nft_transfer',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  GOVERNANCE_PROPOSAL = 'governance_proposal',
  GOVERNANCE_VOTE = 'governance_vote'
}

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: Date;
  blockHeight?: number;
  note?: string;
}

// Block structure
export interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: Date;
  nonce: number;
  difficulty: number;
  transactions: Transaction[];
  miner: string;
  reward: number;
}

// Mining related types
export interface MiningStats {
  address: string;
  blocksMined: number;
  totalRewards: number;
  isCurrentlyMining: boolean;
  currentHashRate: number;
  lastBlockMined?: Date;
}

export interface MiningReward {
  id: string;
  blockHeight: number;
  amount: number;
  timestamp: Date;
  address: string;
}

// Staking related types
export interface Stake {
  id: string;
  address: string;
  amount: number;
  startTime: Date;
  endTime: Date;
  duration: number;  // in days
  votingPower: number;
  isActive: boolean;
}

export interface StakingStats {
  totalStaked: number;
  votingPower: number;
  estimatedYield: string;  // percentage as string (e.g. "8.2")
}

// Governance related types
export enum VoteOption {
  YES = 'YES',
  NO = 'NO',
  ABSTAIN = 'ABSTAIN'
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  creatorAddress: string;
  createTime: Date;
  endTime: Date;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  quorum: number;
  voteCount: number;
  ttl: number;  // Time to live in days
}

// NFT related types
export interface NFT {
  id: string;
  name: string;
  description: string;
  ownerAddress: string;
  createdAt: Date;
  imageUrl?: string;
  metadata?: Record<string, any>;
  enableZkVerification: boolean;
  hideOwnerAddress: boolean;
  transactionHash: string;
}

// Network stats
export interface NetworkStats {
  blockHeight: number;
  blockTime: string;  // e.g. "~15 sec"
  peers: number;
  hashRate: string;  // e.g. "12.4 TH/s"
  lastBlockTimestamp: Date;
  difficulty: number;
  circulatingSupply: number;
  totalSupply: number;
}
