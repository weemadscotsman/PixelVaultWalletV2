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
