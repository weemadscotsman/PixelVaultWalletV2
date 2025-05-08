// Shared types for the PVX blockchain system

export enum TransactionType {
  TRANSFER = 'transfer',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  MINE = 'mine',
  REWARD = 'reward',
  FEE = 'fee',
  GOVERNANCE = 'governance'
}

export enum BadgeType {
  TRANSACTION = 'transaction',
  MINING = 'mining',
  STAKING = 'staking',
  GOVERNANCE = 'governance',
  THRINGLET = 'thringlet',
  SPECIAL = 'special'
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  rarity: BadgeRarity;
  icon: string;
  requirement: string;
  secret?: boolean;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: number; // timestamp when earned, 0 if not earned yet
  progress?: number; // progress percentage 0-100
}

// Thringlet emotion states
export enum ThringletEmotionState {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  EXCITED = 'excited',
  ANGRY = 'angry',
  SCARED = 'scared',
  SLEEPY = 'sleepy',
  SICK = 'sick',
  LOVE = 'love',
  // Additional states needed for the system
  TIRED = 'tired',
  HUNGRY = 'hungry'
}

// Thringlet personality traits
export enum ThringletPersonalityTrait {
  ANALYTICAL = 'analytical',    // Loves data and blockchain statistics
  ADVENTUROUS = 'adventurous',  // Eager to explore new chains and protocols
  CAUTIOUS = 'cautious',        // Risk-averse, prefers proven systems
  CREATIVE = 'creative',        // Thinks outside the box, innovative
  SOCIAL = 'social',            // Connects well with other thringlets and users
  CURIOUS = 'curious',          // Constantly asking questions, learning
  PROTECTIVE = 'protective',    // Guards wallet and assets carefully
  CHAOTIC = 'chaotic',          // Unpredictable, sometimes risky behavior
  LOGICAL = 'logical',          // Makes decisions based on facts
  EMOTIONAL = 'emotional'       // Reacts strongly to market changes
}

// Blockchain personality affinities - what aspects of blockchain they resonate with
export enum BlockchainAffinity {
  SECURITY = 'security',        // Values strong cryptography and secure systems
  PRIVACY = 'privacy',          // Champions privacy features and zero-knowledge proofs
  EFFICIENCY = 'efficiency',    // Focuses on transaction speed and low fees
  GOVERNANCE = 'governance',    // Interested in voting and protocol decisions
  DEFI = 'defi',                // Passionate about financial applications
  MINING = 'mining',            // Enthusiastic about mining and block production
  STAKING = 'staking',          // Prefers passive income through staking
  INNOVATION = 'innovation',    // Drawn to cutting-edge technology
  COMMUNITY = 'community',      // Values social aspects and network effects
  UTILITY = 'utility'           // Appreciates practical blockchain applications
}