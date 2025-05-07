// PIXELVAULT (PVX) Blockchain Types
// Based on the Rust implementation

// -- Core Types --
export type AccountId = string;
export type Balance = string; // String for precision (represents μPVX)
export type BlockNumber = number;
export type Timestamp = number;
export type Nonce = number;
export type TransactionHash = string;
export type NftId = string;
export type StakeId = string;
export type ProposalId = string;
export type ZkProof = string;

// -- Enums --
export enum TransactionType {
  TRANSFER = 'transfer',
  MINT = 'mint',
  BURN = 'burn',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CREATE_PROPOSAL = 'create_proposal',
  VOTE = 'vote',
  CLAIM_REWARD = 'claim_reward',
  MINT_NFT = 'mint_nft',
  SUBMIT_PROOF = 'submit_proof',
  THRINGLET_INTERACTION = 'thringlet_interaction'
}

export enum ProofType {
  ZK_SNARK = 'zk_snark',
  SCREEN_CAPTURE = 'screen_capture',
  GAME_ACTIVITY = 'game_activity',
}

export enum VoteOption {
  YES = 'yes',
  NO = 'no',
  ABSTAIN = 'abstain'
}

export enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  FAILED = 'failed',
  EXECUTED = 'executed',
  VETOED = 'vetoed'
}

export enum StakingDuration {
  FLEXIBLE = 0,
  ONE_MONTH = 30,
  THREE_MONTHS = 90,
  SIX_MONTHS = 180,
  ONE_YEAR = 365
}

export enum ThringletEmotionalState {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  EXCITED = 'excited',
  SCARED = 'scared',
  LOVE = 'love'
}

// -- Structs --
export interface Account {
  id: AccountId;
  balance: Balance;
  nonce: Nonce;
  nfts: NftId[];
  lastActivity: Timestamp;
}

export interface Transaction {
  hash: TransactionHash;
  type: TransactionType;
  from: AccountId;
  to: AccountId;
  amount: Balance;
  timestamp: Timestamp;
  nonce: Nonce;
  signature: string;
  blockHeight?: BlockNumber;
  payload?: any;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface Block {
  height: BlockNumber;
  hash: string;
  previousHash: string;
  timestamp: Timestamp;
  transactions: TransactionHash[];
  miner: AccountId;
  nonce: string;
  difficulty: number;
  reward: Balance;
}

export interface NFT {
  id: NftId;
  name: string;
  description?: string;
  owner: AccountId;
  metadata: {
    imageUrl?: string;
    attributes?: any;
  };
  createdAt: Timestamp;
  zk_verified: boolean;
}

export interface Thringlet extends NFT {
  emotionalState: ThringletEmotionalState;
  lastInteraction: Timestamp;
  interactionCount: number;
  stateHistory: Array<{
    state: ThringletEmotionalState;
    timestamp: Timestamp;
  }>;
  abilities: string[];
}

export interface Stake {
  id: StakeId;
  owner: AccountId;
  amount: Balance;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration: StakingDuration;
  isActive: boolean;
  votingPower: Balance;
}

export interface Proposal {
  id: ProposalId;
  title: string;
  description: string;
  creator: AccountId;
  startTime: Timestamp;
  endTime: Timestamp;
  status: ProposalStatus;
  yesVotes: Balance;
  noVotes: Balance;
  abstainVotes: Balance;
  quorum: Balance;
  voteCount: number;
}

export interface Vote {
  voter: AccountId;
  proposalId: ProposalId;
  option: VoteOption;
  amount: Balance; // Voting power used
  timestamp: Timestamp;
}

export interface MiningStats {
  address: AccountId;
  blocksMined: number;
  totalRewards: Balance;
  isCurrentlyMining: boolean;
  currentHashRate: string; // Hash/s
  lastBlockMined?: Timestamp;
}

export interface MiningReward {
  address: AccountId;
  amount: Balance;
  blockHeight: BlockNumber;
  timestamp: Timestamp;
}

export interface ZkTransaction extends Transaction {
  proof: ZkProof;
  publicInputs: string[];
  verificationKey: string;
}

export interface BlockchainStatus {
  connected: boolean;
  latestBlock?: {
    height: BlockNumber;
    hash: string;
    timestamp: Timestamp;
  };
  peers?: number;
  networkHashRate?: number;
  circulatingSupply?: Balance;
  difficulty?: number;
  error?: string;
}

// -- API Responses --
export interface WalletResponse {
  address: string;
  balance: string;
  createdAt: string;
  lastSynced: string;
  isLocalOnly?: boolean;
}

export interface CreateWalletRequest {
  passphrase: string;
}

export interface TransferRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  passphrase: string;
  note?: string;
}

export interface TransferResponse {
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  timestamp: string;
}

export interface BlockchainTrends {
  metrics: Array<{
    id: string;
    label: string;
    color: string;
    data: {
      [key: string]: {
        value: number;
        maxValue: number;
        unit: string;
      };
    };
  }>;
}

// -- Leaderboard Types --
export interface GameScore {
  userId: number;
  walletAddress: string;
  username: string;
  gameType: 'hashlord' | 'gasescape' | 'stakingwars';
  score: number;
  timeSpent: number; // in seconds
  difficulty: number;
  metadata?: {
    blocksMined?: number;
    gasSaved?: string;
    stakingRewards?: string;
  };
}

// -- Error Types --
export interface BlockchainError {
  code: string;
  message: string;
  details?: any;
}