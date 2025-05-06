export enum DropTier {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum ThringletRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface SecretDrop {
  id: string;
  name: string;
  code: string;
  description: string;
  tier: DropTier;
  reward: number; // in μPVX (micro-PVX)
  claimable: boolean;
  expiresAt: Date;
  imageUrl?: string;
  claimedBy?: string[]; // List of addresses that claimed this drop
}

export interface Thringlet {
  id: string;
  name: string;
  rarity: ThringletRarity;
  ownerAddress: string;
  properties: {
    [key: string]: string | number | boolean;
  };
  imageUrl?: string;
  createdAt: Date;
  mintTxHash?: string;
}

export interface TerminalCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[], context: any) => string[];
}