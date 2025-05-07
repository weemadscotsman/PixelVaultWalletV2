import { pgTable, text, serial, integer, boolean, timestamp, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export blockchain types
export * from "./types";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Wallet table
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  balance: numeric("balance", { precision: 18, scale: 6 }).notNull().default("0"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  last_updated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  address: true,
  balance: true,
});

// Transaction table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  type: text("type").notNull(),
  from_address: text("from_address").notNull(),
  to_address: text("to_address").notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  block_height: integer("block_height"),
  note: text("note"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

// Block table
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  height: integer("height").notNull().unique(),
  hash: text("hash").notNull().unique(),
  previous_hash: text("previous_hash").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  nonce: numeric("nonce", { precision: 20, scale: 0 }).notNull(),
  difficulty: integer("difficulty").notNull(),
  miner: text("miner").notNull(),
  reward: numeric("reward", { precision: 18, scale: 6 }).notNull(),
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
});

// Mining stats table
export const mining_stats = pgTable("mining_stats", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  blocks_mined: integer("blocks_mined").notNull().default(0),
  total_rewards: numeric("total_rewards", { precision: 18, scale: 6 }).notNull().default("0"),
  is_currently_mining: boolean("is_currently_mining").notNull().default(false),
  current_hash_rate: numeric("current_hash_rate", { precision: 18, scale: 2 }).notNull().default("0"),
  last_block_mined: timestamp("last_block_mined"),
});

export const insertMiningStatsSchema = createInsertSchema(mining_stats).omit({
  id: true,
});

// Mining rewards table
export const mining_rewards = pgTable("mining_rewards", {
  id: serial("id").primaryKey(),
  block_height: integer("block_height").notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  address: text("address").notNull(),
});

export const insertMiningRewardSchema = createInsertSchema(mining_rewards).omit({
  id: true,
});

// Stakes table
export const stakes = pgTable("stakes", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(), // in days
  voting_power: numeric("voting_power", { precision: 18, scale: 6 }).notNull(),
  is_active: boolean("is_active").notNull().default(true),
});

export const insertStakeSchema = createInsertSchema(stakes).omit({
  id: true,
});

// Proposal table
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  creator_address: text("creator_address").notNull(),
  create_time: timestamp("create_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  status: text("status").notNull(),
  yes_votes: numeric("yes_votes", { precision: 18, scale: 6 }).notNull().default("0"),
  no_votes: numeric("no_votes", { precision: 18, scale: 6 }).notNull().default("0"),
  abstain_votes: numeric("abstain_votes", { precision: 18, scale: 6 }).notNull().default("0"),
  quorum: numeric("quorum", { precision: 18, scale: 6 }).notNull(),
  vote_count: integer("vote_count").notNull().default(0),
  ttl: integer("ttl").notNull(), // Time to live in days
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  proposal_id: integer("proposal_id").notNull(),
  option: text("option").notNull(), // YES, NO, ABSTAIN
  timestamp: timestamp("timestamp").notNull(),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
});

// NFT table
export const nfts = pgTable("nfts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  owner_address: text("owner_address").notNull(),
  created_at: timestamp("created_at").notNull(),
  image_url: text("image_url"),
  metadata: json("metadata"),
  enable_zk_verification: boolean("enable_zk_verification").notNull().default(false),
  hide_owner_address: boolean("hide_owner_address").notNull().default(false),
  transaction_hash: text("transaction_hash").notNull(),
});

export const insertNFTSchema = createInsertSchema(nfts).omit({
  id: true,
});

// Types based on schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

export type InsertMiningStats = z.infer<typeof insertMiningStatsSchema>;
export type MiningStats = typeof mining_stats.$inferSelect;

export type InsertMiningReward = z.infer<typeof insertMiningRewardSchema>;
export type MiningReward = typeof mining_rewards.$inferSelect;

export type InsertStake = z.infer<typeof insertStakeSchema>;
export type Stake = typeof stakes.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertNFT = z.infer<typeof insertNFTSchema>;
export type NFT = typeof nfts.$inferSelect;

// Veto Guardian table
export const veto_guardians = pgTable("veto_guardians", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name").notNull(),
  appointed_at: timestamp("appointed_at").notNull().defaultNow(),
  active_until: timestamp("active_until").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  veto_count: integer("veto_count").notNull().default(0),
  description: text("description"), // Optional description of guardian's role
});

export const insertVetoGuardianSchema = createInsertSchema(veto_guardians).omit({
  id: true,
  veto_count: true,
});

// Veto Actions table
export const veto_actions = pgTable("veto_actions", {
  id: serial("id").primaryKey(),
  guardian_id: integer("guardian_id").notNull(),
  proposal_id: integer("proposal_id").notNull(),
  reason: text("reason").notNull(),
  action_time: timestamp("action_time").notNull().defaultNow(),
});

export const insertVetoActionSchema = createInsertSchema(veto_actions).omit({
  id: true,
  action_time: true,
});

// User Feedback table
export const user_feedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  user_address: text("user_address").notNull(),
  feedback_type: text("feedback_type").notNull(), // "bug", "feature", "suggestion", "other"
  content: text("content").notNull(),
  sentiment: text("sentiment").notNull().default("neutral"), // "positive", "negative", "neutral"
  category: text("category"), // Optional category for organizing feedback
  page_url: text("page_url"), // The page where the feedback was submitted from
  browser_info: json("browser_info"), // Browser and device information 
  is_resolved: boolean("is_resolved").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  resolved_at: timestamp("resolved_at"),
  resolution_note: text("resolution_note"),
});

export const insertUserFeedbackSchema = createInsertSchema(user_feedback).omit({
  id: true,
  created_at: true,
  resolved_at: true,
});

export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof user_feedback.$inferSelect;

// Game Leaderboards table
export const game_leaderboards = pgTable("game_leaderboards", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  wallet_address: text("wallet_address").notNull(),
  username: text("username").notNull(),
  game_type: text("game_type").notNull(), // "hashlord", "gasescape", "stakingwars"
  score: integer("score").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  time_spent: integer("time_spent").notNull(), // In seconds
  blocks_mined: integer("blocks_mined"), // For hashlord
  gas_saved: numeric("gas_saved", { precision: 18, scale: 6 }), // For gasescape
  staking_rewards: numeric("staking_rewards", { precision: 18, scale: 6 }), // For stakingwars
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameLeaderboardSchema = createInsertSchema(game_leaderboards).omit({
  id: true,
  created_at: true,
});

export type InsertGameLeaderboard = z.infer<typeof insertGameLeaderboardSchema>;
export type GameLeaderboard = typeof game_leaderboards.$inferSelect;

// Types for veto guardian tables
export type InsertVetoGuardian = z.infer<typeof insertVetoGuardianSchema>;
export type VetoGuardian = typeof veto_guardians.$inferSelect;

export type InsertVetoAction = z.infer<typeof insertVetoActionSchema>;
export type VetoAction = typeof veto_actions.$inferSelect;

// Badge definitions table
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image_url: text("image_url").notNull(),
  category: text("category").notNull(), // "governance", "mining", "staking", "social", "game", "thringlet", "special"
  rarity: text("rarity").notNull(), // "common", "uncommon", "rare", "epic", "legendary"
  requirements_json: json("requirements_json"), // Specific requirements to earn the badge
  created_at: timestamp("created_at").notNull().defaultNow(),
  is_active: boolean("is_active").notNull().default(true),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  created_at: true,
});

// User badges table - many-to-many relationship between users and badges
export const user_badges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  badge_id: integer("badge_id").notNull().references(() => badges.id),
  awarded_at: timestamp("awarded_at").notNull().defaultNow(),
  awarded_reason: text("awarded_reason"),
  is_featured: boolean("is_featured").notNull().default(false), // User can feature up to 3 badges on profile
  is_hidden: boolean("is_hidden").notNull().default(false), // User can hide badges they don't want to display
});

export const insertUserBadgeSchema = createInsertSchema(user_badges).omit({
  id: true,
  awarded_at: true,
});

// Badge progress tracking table
export const badge_progress = pgTable("badge_progress", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  badge_id: integer("badge_id").notNull().references(() => badges.id),
  current_progress: json("current_progress").notNull(), // Stored as JSON to handle different badge requirements
  last_updated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertBadgeProgressSchema = createInsertSchema(badge_progress).omit({
  id: true,
  last_updated: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof user_badges.$inferSelect;

export type InsertBadgeProgress = z.infer<typeof insertBadgeProgressSchema>;
export type BadgeProgress = typeof badge_progress.$inferSelect;

// Universal Transaction Registry (UTR) table
export const universal_transaction_registry = pgTable("universal_transaction_registry", {
  id: serial("id").primaryKey(),
  tx_id: text("tx_id").notNull().unique(), // Unique identifier for the transaction
  tx_type: text("tx_type").notNull(), // Type: "transfer", "stake", "governance", "mining_reward", "nft_mint", "nft_transfer", "secret_drop", "system"
  from_address: text("from_address"), // Can be null for system-generated transactions like mining rewards
  to_address: text("to_address").notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }), // Can be null for non-value transfers like governance votes
  asset_type: text("asset_type").notNull().default("PVX"), // PVX, NFT, Thringlet, etc.
  asset_id: text("asset_id"), // ID of NFT, Thringlet, etc. if applicable
  block_height: integer("block_height"), // Can be null if not yet mined in a block
  status: text("status").notNull(), // "pending", "confirmed", "failed", "vetoed"
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: json("metadata"), // Additional data specific to transaction type
  zk_proof: text("zk_proof"), // For privacy-enhanced transactions
  signature: text("signature"), // Transaction signature
  gas_fee: numeric("gas_fee", { precision: 18, scale: 6 }), // Gas fee if applicable
  verified: boolean("verified").notNull().default(false), // Whether transaction has been cryptographically verified
});

export const insertUTRSchema = createInsertSchema(universal_transaction_registry).omit({
  id: true,
  timestamp: true,
});

export type InsertUTR = z.infer<typeof insertUTRSchema>;
export type UTR = typeof universal_transaction_registry.$inferSelect;

// Token table for DEX
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  logo_url: text("logo_url"),
  decimals: integer("decimals").notNull().default(6),
  contract_address: text("contract_address"), // For external tokens 
  is_native: boolean("is_native").notNull().default(false), // PVX is native
  is_verified: boolean("is_verified").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  total_supply: numeric("total_supply", { precision: 36, scale: 18 }),
  description: text("description"),
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  created_at: true,
});

// Liquidity pool table
export const liquidity_pools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  token0_id: integer("token0_id").notNull().references(() => tokens.id),
  token1_id: integer("token1_id").notNull().references(() => tokens.id),
  token0_amount: numeric("token0_amount", { precision: 36, scale: 18 }).notNull().default("0"),
  token1_amount: numeric("token1_amount", { precision: 36, scale: 18 }).notNull().default("0"),
  lp_token_supply: numeric("lp_token_supply", { precision: 36, scale: 18 }).notNull().default("0"),
  swap_fee_percent: numeric("swap_fee_percent", { precision: 5, scale: 2 }).notNull().default("0.3"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  last_updated: timestamp("last_updated").notNull().defaultNow(),
  pool_address: text("pool_address").notNull().unique(),
  is_active: boolean("is_active").notNull().default(true),
});

export const insertLiquidityPoolSchema = createInsertSchema(liquidity_pools).omit({
  id: true,
  created_at: true,
  last_updated: true,
});

// LP token position table
export const lp_positions = pgTable("lp_positions", {
  id: serial("id").primaryKey(),
  pool_id: integer("pool_id").notNull().references(() => liquidity_pools.id),
  owner_address: text("owner_address").notNull(),
  lp_token_amount: numeric("lp_token_amount", { precision: 36, scale: 18 }).notNull(),
  token0_amount: numeric("token0_amount", { precision: 36, scale: 18 }).notNull(),
  token1_amount: numeric("token1_amount", { precision: 36, scale: 18 }).notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  last_updated: timestamp("last_updated").notNull().defaultNow(),
  is_active: boolean("is_active").notNull().default(true),
});

export const insertLPPositionSchema = createInsertSchema(lp_positions).omit({
  id: true,
  created_at: true,
  last_updated: true,
});

// Swap transaction table
export const swaps = pgTable("swaps", {
  id: serial("id").primaryKey(),
  pool_id: integer("pool_id").notNull().references(() => liquidity_pools.id),
  trader_address: text("trader_address").notNull(),
  token_in_id: integer("token_in_id").notNull().references(() => tokens.id),
  token_out_id: integer("token_out_id").notNull().references(() => tokens.id),
  amount_in: numeric("amount_in", { precision: 36, scale: 18 }).notNull(),
  amount_out: numeric("amount_out", { precision: 36, scale: 18 }).notNull(),
  fee_amount: numeric("fee_amount", { precision: 36, scale: 18 }).notNull(),
  tx_hash: text("tx_hash").notNull().unique(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  price_impact_percent: numeric("price_impact_percent", { precision: 8, scale: 6 }),
  slippage_tolerance_percent: numeric("slippage_tolerance_percent", { precision: 5, scale: 2 }),
});

export const insertSwapSchema = createInsertSchema(swaps).omit({
  id: true,
  timestamp: true,
});

// Types for DEX
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;

export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type LiquidityPool = typeof liquidity_pools.$inferSelect;

export type InsertLPPosition = z.infer<typeof insertLPPositionSchema>;
export type LPPosition = typeof lp_positions.$inferSelect;

export type InsertSwap = z.infer<typeof insertSwapSchema>;
export type Swap = typeof swaps.$inferSelect;
