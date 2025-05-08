// Badge type definitions
export type BadgeRarity = 
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'Mythic';

export type BadgeCategory = 
  | 'Blockchain'
  | 'Mining'
  | 'Staking'
  | 'Wallet'
  | 'Thringlet'
  | 'Governance'
  | 'Trading'
  | 'Quest'
  | 'System';

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