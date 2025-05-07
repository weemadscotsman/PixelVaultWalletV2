import { 
  Block, 
  Transaction, 
  MiningStats, 
  TransactionType,
  ThringletEmotionalState
} from '@shared/types';

// Wallet type for in-memory storage
export interface Wallet {
  address: string;
  publicKey: string;
  balance: string;
  createdAt: Date;
  lastSynced: Date;
  passphraseSalt: string;
  passphraseHash: string;
}

// In-memory blockchain data storage
export class MemBlockchainStorage {
  private blocks: Block[] = [];
  private transactions: Transaction[] = [];
  private wallets: Map<string, Wallet> = new Map();
  private minerStats: Map<string, MiningStats> = new Map();
  
  // Block methods
  async createBlock(block: Block): Promise<Block> {
    this.blocks.push(block);
    return block;
  }
  
  async getLatestBlock(): Promise<Block | null> {
    if (this.blocks.length === 0) {
      return null;
    }
    return this.blocks.reduce((latest, block) => 
      block.height > latest.height ? block : latest, this.blocks[0]);
  }
  
  async getBlockByHeight(height: number): Promise<Block | null> {
    const block = this.blocks.find(b => b.height === height);
    return block || null;
  }
  
  async getRecentBlocks(limit: number = 10): Promise<Block[]> {
    return [...this.blocks]
      .sort((a, b) => b.height - a.height)
      .slice(0, limit);
  }
  
  // Transaction methods
  async createTransaction(transaction: Transaction): Promise<Transaction> {
    this.transactions.push(transaction);
    return transaction;
  }
  
  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const transaction = this.transactions.find(t => t.hash === hash);
    return transaction || null;
  }
  
  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    return this.transactions.filter(
      t => t.from === address || t.to === address
    );
  }
  
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return [...this.transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  // Wallet methods
  async createWallet(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.address, wallet);
    return wallet;
  }
  
  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return this.wallets.get(address);
  }
  
  async updateWallet(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.address, wallet);
    return wallet;
  }
  
  // Miner stats methods
  async createMiner(stats: MiningStats): Promise<MiningStats> {
    this.minerStats.set(stats.address, stats);
    return stats;
  }
  
  async getMinerByAddress(address: string): Promise<MiningStats | undefined> {
    return this.minerStats.get(address);
  }
  
  async updateMiner(stats: MiningStats): Promise<MiningStats> {
    this.minerStats.set(stats.address, stats);
    return stats;
  }
  
  async getAllActiveMiners(): Promise<MiningStats[]> {
    return Array.from(this.minerStats.values())
      .filter(miner => miner.isCurrentlyMining);
  }
}

// Create and export singleton instance
export const memBlockchainStorage = new MemBlockchainStorage();