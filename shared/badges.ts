// Achievement badge types and schemas

export const BadgeRarity = {
  Common: 'Common',
  Uncommon: 'Uncommon',
  Rare: 'Rare',
  Epic: 'Epic',
  Legendary: 'Legendary',
  Mythic: 'Mythic',
} as const;

export type BadgeRarity = (typeof BadgeRarity)[keyof typeof BadgeRarity];

export const BadgeCategory = {
  Blockchain: 'Blockchain',
  Mining: 'Mining',
  Staking: 'Staking',
  Wallet: 'Wallet',
  Thringlet: 'Thringlet',
  Governance: 'Governance',
  Trading: 'Trading',
  Quest: 'Quest',
  System: 'System',
} as const;

export type BadgeCategory = (typeof BadgeCategory)[keyof typeof BadgeCategory];

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  criteria: string;
  experience: number;
  completedAt?: number | null;
  progress?: number;
  progressMax?: number;
  locked?: boolean;
  secret?: boolean;
}

export interface BadgeProgress {
  id: string;
  userId: string;
  badgeId: string;
  progress: number;
  completed: boolean;
  completedAt?: number | null;
}

// Achievement badge registry
export const badgeRegistry: Badge[] = [
  {
    id: 'genesis_node',
    name: 'Genesis Node',
    description: 'Connected to the PVX blockchain for the first time.',
    icon: 'Power',
    color: '#00C2FF',
    rarity: BadgeRarity.Common,
    category: BadgeCategory.Blockchain,
    criteria: 'Connect to the blockchain network',
    experience: 100,
  },
  {
    id: 'first_transaction',
    name: 'First Transaction',
    description: 'Completed your first blockchain transaction.',
    icon: 'Stamp',
    color: '#4ade80',
    rarity: BadgeRarity.Common,
    category: BadgeCategory.Wallet,
    criteria: 'Send or receive PVX tokens',
    experience: 150,
  },
  {
    id: 'novice_miner',
    name: 'Novice Miner',
    description: 'Mined your first block.',
    icon: 'Pickaxe',
    color: '#f59e0b',
    rarity: BadgeRarity.Common,
    category: BadgeCategory.Mining,
    criteria: 'Successfully mine a block',
    experience: 200,
  },
  {
    id: 'stake_holder',
    name: 'Stake Holder',
    description: 'Started staking PVX for the first time.',
    icon: 'BarChart',
    color: '#8b5cf6',
    rarity: BadgeRarity.Common,
    category: BadgeCategory.Staking,
    criteria: 'Stake PVX tokens in any pool',
    experience: 200,
  },
  {
    id: 'thringlet_tamer',
    name: 'Thringlet Tamer',
    description: 'Acquired your first Thringlet.',
    icon: 'Bot',
    color: '#06b6d4',
    rarity: BadgeRarity.Common,
    category: BadgeCategory.Thringlet,
    criteria: 'Own at least one Thringlet',
    experience: 250,
  },
  {
    id: 'vault_architect',
    name: 'Vault Architect',
    description: 'Created your first secure wallet vault.',
    icon: 'Shield',
    color: '#ec4899',
    rarity: BadgeRarity.Uncommon,
    category: BadgeCategory.Wallet,
    criteria: 'Create a secure wallet vault with advanced features',
    experience: 300,
  },
  {
    id: 'fusion_pioneer',
    name: 'Fusion Pioneer',
    description: 'Successfully fused two Thringlets for the first time.',
    icon: 'Merge',
    color: '#06b6d4',
    rarity: BadgeRarity.Uncommon,
    category: BadgeCategory.Thringlet,
    criteria: 'Perform a Thringlet fusion',
    experience: 350,
  },
  {
    id: 'mining_streak',
    name: 'Mining Streak',
    description: 'Mined blocks for 7 consecutive days.',
    icon: 'Flame',
    color: '#f59e0b',
    rarity: BadgeRarity.Rare,
    category: BadgeCategory.Mining,
    criteria: 'Mine at least one block per day for 7 days',
    experience: 500,
    progressMax: 7,
  },
  {
    id: 'whale_status',
    name: 'Whale Status',
    description: 'Accumulated 100,000 PVX in your wallet.',
    icon: 'Whale',
    color: '#4f46e5',
    rarity: BadgeRarity.Rare,
    category: BadgeCategory.Wallet,
    criteria: 'Reach a balance of 100,000 PVX',
    experience: 650,
    progressMax: 100000,
  },
  {
    id: 'advanced_staker',
    name: 'Advanced Staker',
    description: 'Stake PVX for over 30 days without withdrawing.',
    icon: 'Medal',
    color: '#8b5cf6',
    rarity: BadgeRarity.Rare,
    category: BadgeCategory.Staking,
    criteria: 'Keep PVX tokens staked for 30 consecutive days',
    experience: 750,
    progressMax: 30,
  },
  {
    id: 'governance_voter',
    name: 'Governance Voter',
    description: 'Participated in your first governance proposal vote.',
    icon: 'Vote',
    color: '#0ea5e9',
    rarity: BadgeRarity.Rare,
    category: BadgeCategory.Governance,
    criteria: 'Vote on a governance proposal',
    experience: 800,
  },
  {
    id: 'block_50',
    name: 'Block Master',
    description: 'Mined 50 blocks on the PVX blockchain.',
    icon: 'Trophy',
    color: '#f59e0b',
    rarity: BadgeRarity.Epic,
    category: BadgeCategory.Mining,
    criteria: 'Mine 50 blocks in total',
    experience: 1000,
    progressMax: 50,
  },
  {
    id: 'legendary_thringlet',
    name: 'Legendary Collector',
    description: 'Acquired a Legendary Thringlet.',
    icon: 'Star',
    color: '#f59e0b',
    rarity: BadgeRarity.Epic,
    category: BadgeCategory.Thringlet,
    criteria: 'Own at least one Legendary Thringlet',
    experience: 1200,
  },
  {
    id: 'governance_proposal',
    name: 'Governance Pioneer',
    description: 'Created your first governance proposal.',
    icon: 'FileText',
    color: '#0ea5e9',
    rarity: BadgeRarity.Epic,
    category: BadgeCategory.Governance,
    criteria: 'Create a governance proposal that reaches voting stage',
    experience: 1500,
  },
  {
    id: 'staking_millionaire',
    name: 'Staking Millionaire',
    description: 'Earned over 1,000,000 PVX from staking rewards.',
    icon: 'Diamond',
    color: '#8b5cf6',
    rarity: BadgeRarity.Legendary,
    category: BadgeCategory.Staking,
    criteria: 'Accumulate 1,000,000 PVX in staking rewards',
    experience: 2000,
    progressMax: 1000000,
  },
  {
    id: 'genesis_block',
    name: 'Genesis Miner',
    description: 'One of the first 100 miners on the PVX blockchain.',
    icon: 'Award',
    color: '#f59e0b',
    rarity: BadgeRarity.Legendary,
    category: BadgeCategory.Mining,
    criteria: 'Be among the first 100 miners on the blockchain',
    experience: 2500,
  },
  {
    id: 'thringlet_collector',
    name: 'Master Collector',
    description: 'Collected all Thringlet varieties.',
    icon: 'Archive',
    color: '#06b6d4',
    rarity: BadgeRarity.Legendary,
    category: BadgeCategory.Thringlet,
    criteria: 'Own at least one of each Thringlet type',
    experience: 3000,
  },
  {
    id: 'node_operator',
    name: 'Node Operator',
    description: 'Successfully ran a full node for 30 consecutive days.',
    icon: 'Server',
    color: '#0ea5e9',
    rarity: BadgeRarity.Legendary,
    category: BadgeCategory.Blockchain,
    criteria: 'Operate a full node for 30 days without interruption',
    experience: 3500,
    progressMax: 30,
  },
  {
    id: 'blockchain_scholar',
    name: 'Blockchain Scholar',
    description: 'Completed all learning modules in the blockchain academy.',
    icon: 'GraduationCap',
    color: '#0ea5e9',
    rarity: BadgeRarity.Epic,
    category: BadgeCategory.Blockchain,
    criteria: 'Complete all blockchain learning modules',
    experience: 1800,
  },
  {
    id: 'zk_master',
    name: 'Zero-Knowledge Master',
    description: 'Successfully completed a ZK-proof transaction.',
    icon: 'EyeOff',
    color: '#4f46e5',
    rarity: BadgeRarity.Mythic,
    category: BadgeCategory.Blockchain,
    criteria: 'Execute a private transaction using zero-knowledge proofs',
    experience: 5000,
    secret: true,
  },
];

// Get badge by ID
export function getBadgeById(badgeId: string): Badge | undefined {
  return badgeRegistry.find((badge) => badge.id === badgeId);
}

// Get badges by category
export function getBadgesByCategory(category: BadgeCategory): Badge[] {
  return badgeRegistry.filter((badge) => badge.category === category);
}

// Get badges by rarity
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
  return badgeRegistry.filter((badge) => badge.rarity === rarity);
}