export interface Wallet {
  publicAddress: string;
  privateKey: string;  // This would be encrypted in a real production environment
  balance: number;
  created: Date;
  lastUpdated: Date;
}

export interface WalletInfo {
  address: string;
  balance: number;
  transactions: any[]; // Transaction[] from blockchain.ts
  lastUpdated: Date;
}
