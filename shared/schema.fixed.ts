import { pgTable, varchar, text, integer, timestamp, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// Custom bigint function with proper configuration
const bigint = (name: string) => {
  return integer(name);
};

// Blocks table
export const blocks = pgTable('blocks', {
  height: integer('height').primaryKey(),
  hash: varchar('hash', { length: 64 }).notNull().unique(),
  previousHash: varchar('previous_hash', { length: 64 }).notNull(),
  timestamp: bigint('timestamp').notNull(),
  nonce: bigint('nonce').notNull(),
  difficulty: integer('difficulty').notNull(),
  miner: varchar('miner', { length: 100 }).notNull(),
  merkleRoot: varchar('merkle_root', { length: 64 }).notNull(),
  totalTransactions: integer('total_transactions').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  hash: varchar('hash', { length: 64 }).primaryKey(),
  type: varchar('type', { length: 20 }).notNull(),
  fromAddress: varchar('from_address', { length: 100 }).notNull(),
  toAddress: varchar('to_address', { length: 100 }).notNull(),
  amount: bigint('amount').notNull(),
  timestamp: bigint('timestamp').notNull(),
  nonce: bigint('nonce').notNull(),
  signature: text('signature').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  blockHeight: integer('block_height'),
  fee: bigint('fee'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Wallets table - using last_updated instead of last_synced
export const wallets = pgTable('wallets', {
  address: varchar('address', { length: 100 }).primaryKey(),
  publicKey: text('public_key').notNull(),
  balance: varchar('balance', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  lastUpdated: timestamp('last_updated').notNull(), // Using last_updated column name for database
  passphraseSalt: varchar('passphrase_salt', { length: 100 }),
  passphraseHash: varchar('passphrase_hash', { length: 100 }),
});

// Mining stats table
export const minerStats = pgTable('miner_stats', {
  address: varchar('address', { length: 100 }).primaryKey(),
  blocksMined: integer('blocks_mined').notNull(),
  totalRewards: varchar('total_rewards', { length: 100 }).notNull(),
  lastBlockMined: bigint('last_block_mined').notNull(),
  isCurrentlyMining: boolean('is_currently_mining').notNull(),
  hardware: varchar('hardware', { length: 10 }).notNull(),
  joinedAt: timestamp('joined_at').notNull(),
  currentHashRate: integer('current_hash_rate').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Staking records table
export const stakeRecords = pgTable('stake_records', {
  id: varchar('id', { length: 100 }).primaryKey(),
  walletAddress: varchar('wallet_address', { length: 100 }).notNull(),
  poolId: varchar('pool_id', { length: 100 }).notNull(),
  amount: varchar('amount', { length: 100 }).notNull(),
  startTime: bigint('start_time').notNull(),
  endTime: bigint('end_time'),
  isActive: boolean('is_active').notNull(),
  rewards: varchar('rewards', { length: 100 }).notNull(),
  lastRewardClaim: bigint('last_reward_claim').notNull(),
  autoCompound: boolean('auto_compound').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Staking pools table
export const stakingPools = pgTable('staking_pools', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  apr: integer('apr').notNull(),
  minStakeAmount: integer('min_stake_amount').notNull(),
  lockupPeriod: integer('lockup_period').notNull(),
  totalStaked: varchar('total_staked', { length: 100 }).notNull(),
  activeStakers: integer('active_stakers').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Badges table
export const badges = pgTable('badges', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  tier: varchar('tier', { length: 20 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(),
  requirements: jsonb('requirements'),
  dateAdded: bigint('date_added').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User badges table
export const userBadges = pgTable('user_badges', {
  userId: varchar('user_id', { length: 100 }).notNull(),
  badgeId: varchar('badge_id', { length: 100 }).notNull(),
  obtained: boolean('obtained').notNull(),
  dateObtained: bigint('date_obtained'),
  progress: integer('progress'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.badgeId] }),
  };
});

// Thringlets table
export const thringlets = pgTable('thringlets', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  ownerAddress: varchar('owner_address', { length: 100 }).notNull(),
  emotionState: varchar('emotion_state', { length: 20 }).notNull(),
  personalityTraits: jsonb('personality_traits').notNull(),
  blockchainAffinities: jsonb('blockchain_affinities').notNull(),
  level: integer('level').notNull(),
  experience: integer('experience').notNull(),
  backstory: text('backstory').notNull(),
  abilities: jsonb('abilities').notNull(),
  lastInteraction: bigint('last_interaction').notNull(),
  stats: jsonb('stats').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Governance proposals table
export const governanceProposals = pgTable('governance_proposals', {
  id: varchar('id', { length: 100 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  proposer: varchar('proposer', { length: 100 }).notNull(),
  createdAt: bigint('created_at').notNull(),
  endTime: bigint('end_time').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  votesFor: bigint('votes_for').notNull(),
  votesAgainst: bigint('votes_against').notNull(),
  votesAbstain: bigint('votes_abstain').notNull(),
  minimumVotingPower: integer('minimum_voting_power').notNull(),
  category: varchar('category', { length: 20 }).notNull(),
  parameterChanges: jsonb('parameter_changes'),
  executionTransactionHash: varchar('execution_transaction_hash', { length: 64 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Governance votes table
export const governanceVotes = pgTable('governance_votes', {
  proposalId: varchar('proposal_id', { length: 100 }).notNull(),
  voterAddress: varchar('voter_address', { length: 100 }).notNull(),
  voteType: varchar('vote_type', { length: 10 }).notNull(),
  votingPower: bigint('voting_power').notNull(),
  timestamp: bigint('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.proposalId, table.voterAddress] }),
  };
});

// Drops table
export const drops = pgTable('drops', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  totalTokens: varchar('total_tokens', { length: 100 }).notNull(),
  remainingTokens: varchar('remaining_tokens', { length: 100 }).notNull(),
  startDate: bigint('start_date').notNull(),
  endDate: bigint('end_date').notNull(),
  claimRequirements: jsonb('claim_requirements'),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Drop claims table
export const dropClaims = pgTable('drop_claims', {
  dropId: varchar('drop_id', { length: 100 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 100 }).notNull(),
  claimedAmount: varchar('claimed_amount', { length: 100 }).notNull(),
  claimedAt: bigint('claimed_at').notNull(),
  transactionHash: varchar('transaction_hash', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.dropId, table.walletAddress] }),
  };
});

// Learning modules table
export const learningModules = pgTable('learning_modules', {
  id: varchar('id', { length: 100 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  rewardAmount: varchar('reward_amount', { length: 100 }).notNull(),
  content: text('content').notNull(),
  order: integer('order').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Learning questions table
export const learningQuestions = pgTable('learning_questions', {
  id: varchar('id', { length: 100 }).primaryKey(),
  moduleId: varchar('module_id', { length: 100 }).notNull(),
  question: text('question').notNull(),
  options: jsonb('options').notNull(),
  correctOption: integer('correct_option').notNull(),
  explanation: text('explanation').notNull(),
  points: integer('points').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User learning progress table
export const userLearningProgress = pgTable('user_learning_progress', {
  userId: varchar('user_id', { length: 100 }).notNull(),
  moduleId: varchar('module_id', { length: 100 }).notNull(),
  completed: boolean('completed').notNull(),
  score: integer('score').notNull(),
  completedAt: bigint('completed_at'),
  rewardClaimed: boolean('reward_claimed').notNull(),
  rewardTxHash: varchar('reward_tx_hash', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.moduleId] }),
  };
});

// Sessions table for storing user sessions
export const sessions = pgTable('sessions', {
  sid: varchar('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});