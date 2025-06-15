// /server/tokenomics/const.ts

// PVX is the main token, but rewards and calculations might be in µPVX.
// 1 PVX = 1,000,000 µPVX (microPVX)

// Maximum total supply of PVX tokens
export const MAX_SUPPLY_PVX = 6009420000; // In PVX

// Block reward per mined block, before any splits or halving
export const INITIAL_BLOCK_REWARD_PVX = 50; // In PVX

// Block interval at which halving occurs
export const HALVING_INTERVAL = 210000; // In number of blocks

// For convenience, provide µPVX versions if internal calculations use micro-units
export const MAX_SUPPLY_UPVX = MAX_SUPPLY_PVX * 1000000;
export const INITIAL_BLOCK_REWARD_UPVX = INITIAL_BLOCK_REWARD_PVX * 1000000;

// Define a DAO vault address and Founder reserve address for reward splitting
// These should be actual PVX addresses. For now, using placeholders.
export const DAO_VAULT_ADDRESS = "PVX_DAO_VAULT_ADDRESS_PLACEHOLDER";
export const FOUNDER_RESERVE_ADDRESS = "PVX_FOUNDER_RESERVE_ADDRESS_PLACEHOLDER";

// Reward split: 99% to miner (or DAO vault if miner is the vault), 1% to Founder reserve
export const MINER_REWARD_PERCENTAGE = 0.99; // Or DAO_VAULT_REWARD_PERCENTAGE
export const FOUNDER_REWARD_PERCENTAGE = 0.01;
