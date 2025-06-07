import { pgTable, varchar, text, integer, timestamp, boolean, jsonb, bigint, primaryKey } from 'drizzle-orm/pg-core';

// Blocks table
export const blocks = pgTable('blocks', {
  height: integer('height').primaryKey(),
  hash: varchar('hash', { length: 64 }).notNull().unique(),
  previousHash: varchar('previous_hash', { length: 64 }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  nonce: bigint('nonce', { mode: 'number' }).notNull(),
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
  amount: bigint('amount', { mode: 'number' }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  nonce: bigint('nonce', { mode: 'number' }).notNull(),
  signature: text('signature').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  blockHeight: integer('block_height'),
  fee: bigint('fee', { mode: 'number' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Wallets table
export const wallets = pgTable('wallets', {
  address: varchar('address', { length: 100 }).primaryKey(),
  publicKey: text('public_key').notNull(),
  balance: varchar('balance', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
  lastSynced: timestamp('last_synced').notNull(),
  passphraseSalt: varchar('passphrase_salt', { length: 100 }),
  passphraseHash: varchar('passphrase_hash', { length: 100 }),
});

// Mining stats table
export const minerStats = pgTable('miner_stats', {
  address: varchar('address', { length: 100 }).primaryKey(),
  blocksMined: integer('blocks_mined').notNull(),
  totalRewards: varchar('total_rewards', { length: 100 }).notNull(),
  lastBlockMined: bigint('last_block_mined', { mode: 'number' }).notNull(),
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
  startTime: bigint('start_time', { mode: 'number' }).notNull(),
  endTime: bigint('end_time', { mode: 'number' }),
  isActive: boolean('is_active').notNull(),
  rewards: varchar('rewards', { length: 100 }).notNull(),
  lastRewardClaim: bigint('last_reward_claim', { mode: 'number' }).notNull(),
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
  dateAdded: bigint('date_added', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User badges table (many-to-many)
export const userBadges = pgTable('user_badges', {
  userId: varchar('user_id', { length: 100 }).notNull(),
  badgeId: varchar('badge_id', { length: 100 }).notNull(),
  obtained: boolean('obtained').notNull(),
  dateObtained: bigint('date_obtained', { mode: 'number' }),
  progress: integer('progress'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => ({
  pk: primaryKey({ columns: [table.userId, table.badgeId] }),
}));

// Thringlet table
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
  lastInteraction: bigint('last_interaction', { mode: 'number' }).notNull(),
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
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  endTime: bigint('end_time', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  votesFor: bigint('votes_for', { mode: 'number' }).notNull(),
  votesAgainst: bigint('votes_against', { mode: 'number' }).notNull(),
  votesAbstain: bigint('votes_abstain', { mode: 'number' }).notNull(),
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
  votingPower: bigint('voting_power', { mode: 'number' }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => ({
  pk: primaryKey({ columns: [table.proposalId, table.voterAddress] }),
}));

// Drops table
export const drops = pgTable('drops', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  rarity: varchar('rarity', { length: 20 }).notNull(),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  tokenAmount: integer('token_amount'),
  createdAt: timestamp('created_at').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  claimLimit: integer('claim_limit').notNull(),
  minWalletAge: integer('min_wallet_age').notNull(),
  minStakingAmount: integer('min_staking_amount').notNull(),
  minMiningBlocks: integer('min_mining_blocks').notNull(),
  securityScore: integer('security_score').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Drop claims table (many-to-many)
export const dropClaims = pgTable('drop_claims', {
  dropId: varchar('drop_id', { length: 100 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 100 }).notNull(),
  claimedAt: timestamp('claimed_at').defaultNow().notNull(),
  transactionHash: varchar('transaction_hash', { length: 64 }),
}, table => ({
  pk: primaryKey({ columns: [table.dropId, table.walletAddress] }),
}));

// Learning modules table
export const learningModules = pgTable('learning_modules', {
  id: varchar('id', { length: 100 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  xpReward: integer('xp_reward').notNull(),
  tokenReward: integer('token_reward').notNull(),
  badgeId: varchar('badge_id', { length: 100 }),
  completionCriteria: jsonb('completion_criteria'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Learning questions table
export const learningQuestions = pgTable('learning_questions', {
  id: varchar('id', { length: 100 }).primaryKey(),
  moduleId: varchar('module_id', { length: 100 }).notNull(),
  text: text('text').notNull(),
  options: jsonb('options').notNull(),
  correctOption: integer('correct_option').notNull(),
  explanation: text('explanation').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User learning progress table
export const userLearningProgress = pgTable('user_learning_progress', {
  userId: varchar('user_id', { length: 100 }).notNull(),
  moduleId: varchar('module_id', { length: 100 }).notNull(),
  completed: boolean('completed').notNull(),
  score: integer('score').notNull(),
  attemptsCount: integer('attempts_count').notNull(),
  lastAttemptDate: bigint('last_attempt_date', { mode: 'number' }).notNull(),
  rewardsClaimed: boolean('rewards_claimed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => ({
  pk: primaryKey({ columns: [table.userId, table.moduleId] }),
}));

// Veto guardians table for governance
export const vetoGuardians = pgTable('veto_guardians', {
  id: integer('id').primaryKey(),
  address: varchar('address', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  appointedAt: timestamp('appointed_at').defaultNow().notNull(),
  activeUntil: timestamp('active_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Veto actions table
export const vetoActions = pgTable('veto_actions', {
  id: integer('id').primaryKey(),
  guardianId: integer('guardian_id').notNull(),
  proposalId: varchar('proposal_id', { length: 100 }).notNull(),
  reason: text('reason').notNull(),
  actionDate: timestamp('action_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NFT Collections table
export const nftCollections = pgTable('nft_collections', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  creatorAddress: varchar('creator_address', { length: 100 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  bannerUrl: varchar('banner_url', { length: 500 }),
  website: varchar('website', { length: 500 }),
  royaltyPercentage: integer('royalty_percentage').notNull().default(0), // 0-1000 (0-10%)
  isVerified: boolean('is_verified').notNull().default(false),
  totalSupply: integer('total_supply').notNull().default(0),
  floorPrice: varchar('floor_price', { length: 100 }).default('0'),
  volume: varchar('volume', { length: 100 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NFT tokens table
export const nftTokens = pgTable('nft_tokens', {
  id: varchar('id', { length: 100 }).primaryKey(),
  tokenId: varchar('token_id', { length: 100 }).notNull(),
  collectionId: varchar('collection_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  attributes: jsonb('attributes'), // Array of trait objects
  ownerAddress: varchar('owner_address', { length: 100 }).notNull(),
  creatorAddress: varchar('creator_address', { length: 100 }).notNull(),
  mintTransactionHash: varchar('mint_transaction_hash', { length: 64 }).notNull(),
  currentPrice: varchar('current_price', { length: 100 }),
  isListed: boolean('is_listed').notNull().default(false),
  listingType: varchar('listing_type', { length: 20 }), // 'fixed', 'auction'
  auctionEndTime: bigint('auction_end_time', { mode: 'number' }),
  highestBid: varchar('highest_bid', { length: 100 }),
  highestBidder: varchar('highest_bidder', { length: 100 }),
  mintedAt: timestamp('minted_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NFT marketplace listings table
export const nftListings = pgTable('nft_listings', {
  id: varchar('id', { length: 100 }).primaryKey(),
  tokenId: varchar('token_id', { length: 100 }).notNull(),
  sellerAddress: varchar('seller_address', { length: 100 }).notNull(),
  price: varchar('price', { length: 100 }).notNull(),
  listingType: varchar('listing_type', { length: 20 }).notNull(), // 'fixed', 'auction'
  startTime: bigint('start_time', { mode: 'number' }).notNull(),
  endTime: bigint('end_time', { mode: 'number' }),
  isActive: boolean('is_active').notNull().default(true),
  currency: varchar('currency', { length: 20 }).notNull().default('PVX'),
  reservePrice: varchar('reserve_price', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NFT bids table (for auctions)
export const nftBids = pgTable('nft_bids', {
  id: varchar('id', { length: 100 }).primaryKey(),
  listingId: varchar('listing_id', { length: 100 }).notNull(),
  bidderAddress: varchar('bidder_address', { length: 100 }).notNull(),
  amount: varchar('amount', { length: 100 }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  transactionHash: varchar('transaction_hash', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NFT sales history table
export const nftSales = pgTable('nft_sales', {
  id: varchar('id', { length: 100 }).primaryKey(),
  tokenId: varchar('token_id', { length: 100 }).notNull(),
  sellerAddress: varchar('seller_address', { length: 100 }).notNull(),
  buyerAddress: varchar('buyer_address', { length: 100 }).notNull(),
  price: varchar('price', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 20 }).notNull().default('PVX'),
  transactionHash: varchar('transaction_hash', { length: 64 }).notNull(),
  royaltyPaid: varchar('royalty_paid', { length: 100 }).notNull().default('0'),
  saleType: varchar('sale_type', { length: 20 }).notNull(), // 'direct', 'auction'
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});