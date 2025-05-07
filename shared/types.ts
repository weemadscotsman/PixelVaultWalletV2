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
  requirement: string;
  image?: string;
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
  LOVE = 'love'
}