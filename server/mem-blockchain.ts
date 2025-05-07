import { 
  Block, 
  Transaction, 
  MiningStats, 
  TransactionType,
  ThringletEmotionState
} from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';

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

// Serializable storage state
interface StorageState {
  blocks: Block[];
  transactions: Transaction[];
  wallets: [string, Wallet][];
  minerStats: [string, MiningStats][];
}

// Path for persisting blockchain data
const DATA_FILE_PATH = './data/blockchain-data.json';

// In-memory blockchain data storage with file persistence
export class MemBlockchainStorage {
  private blocks: Block[] = [];
  private transactions: Transaction[] = [];
  wallets: Map<string, Wallet> = new Map();
  private minerStats: Map<string, MiningStats> = new Map();
  
  constructor() {
    this.loadFromFile();
  }
  
  // Save data to file
  private async saveToFile() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Prepare data for serialization
      const data: StorageState = {
        blocks: this.blocks,
        transactions: this.transactions,
        wallets: Array.from(this.wallets.entries()),
        minerStats: Array.from(this.minerStats.entries()),
      };
      
      // Write to file
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
      console.log("Blockchain data saved to file");
    } catch (error) {
      console.error("Failed to save blockchain data:", error);
    }
  }
  
  // Load data from file
  private loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8')) as StorageState;
        
        // Restore data
        this.blocks = data.blocks || [];
        this.transactions = data.transactions || [];
        
        // Restore wallets with proper Date objects
        this.wallets = new Map(data.wallets.map(([key, wallet]) => {
          const restoredWallet = {
            ...wallet,
            createdAt: new Date(wallet.createdAt),
            lastSynced: new Date(wallet.lastSynced)
          };
          return [key, restoredWallet];
        }));
        
        // Restore miner stats
        this.minerStats = new Map(data.minerStats);
        
        console.log("Blockchain data loaded from file");
      } else {
        console.log("No blockchain data file found, starting with empty state");
      }
    } catch (error) {
      console.error("Failed to load blockchain data:", error);
    }
  }
  
  // Block methods
  async createBlock(block: Block): Promise<Block> {
    this.blocks.push(block);
    await this.saveToFile();
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
    await this.saveToFile();
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
    await this.saveToFile();
    return wallet;
  }
  
  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return this.wallets.get(address);
  }
  
  async updateWallet(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.address, wallet);
    await this.saveToFile();
    return wallet;
  }
  
  // Miner stats methods
  async createMiner(stats: MiningStats): Promise<MiningStats> {
    this.minerStats.set(stats.address, stats);
    await this.saveToFile();
    return stats;
  }
  
  async getMinerByAddress(address: string): Promise<MiningStats | undefined> {
    return this.minerStats.get(address);
  }
  
  async updateMiner(stats: MiningStats): Promise<MiningStats> {
    this.minerStats.set(stats.address, stats);
    await this.saveToFile();
    return stats;
  }
  
  async getAllActiveMiners(): Promise<MiningStats[]> {
    return Array.from(this.minerStats.values())
      .filter(miner => miner.isCurrentlyMining);
  }
}

// Create and export singleton instance
export const memBlockchainStorage = new MemBlockchainStorage();