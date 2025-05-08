/**
 * System-wide constants for the PVX blockchain
 */

// Genesis wallet address that issues tokens and rewards
export const PVX_GENESIS_ADDRESS = 'PVX_0000000000000000000000000000000000';

// Governance contract address for proposals and voting
export const PVX_GOVERNANCE_ADDRESS = 'PVX_GOVERNANCE_CONTRACT_ADDRESS';

// Block time in milliseconds (2 minutes)
export const BLOCK_TIME_MS = 120000;

// Maximum number of transactions per block
export const MAX_TX_PER_BLOCK = 1000;

// Genesis block timestamp
export const GENESIS_TIMESTAMP = 1641034800000; // Jan 1, 2022

// Default transaction fee in μPVX
export const DEFAULT_TX_FEE = 1; // 0.000001 PVX

// Maximum inactive time for a miner in milliseconds (1 hour)
export const MAX_MINER_INACTIVE_TIME_MS = 60 * 60 * 1000;

// Block reward in μPVX
export const BLOCK_REWARD = 5000000; // 5 PVX

// Staking minimum lock time in milliseconds (1 day)
export const MIN_STAKE_LOCK_TIME_MS = 24 * 60 * 60 * 1000;

// Default APY for staking
export const DEFAULT_STAKING_APY = 5; // 5%

// Maximum staking APY
export const MAX_STAKING_APY = 20; // 20%

// Badge tier multipliers for rewards
export const BADGE_TIER_MULTIPLIERS = {
  COMMON: 1,
  UNCOMMON: 1.25,
  RARE: 1.5,
  EPIC: 2,
  LEGENDARY: 3,
  MYTHICAL: 5
};

// Maximum number of digits after decimal point for PVX
export const PVX_DECIMALS = 6;

// Maximum supply of PVX in μPVX
export const MAX_SUPPLY = 6009420000; // 6,009,420 PVX

// Learning module difficulty multipliers
export const LEARNING_DIFFICULTY_MULTIPLIERS = {
  beginner: 1,
  intermediate: 1.5,
  advanced: 2.5
};