import { 
  Block, 
  Transaction, 
  MiningStats, 
  TransactionType,
  ThringletEmotionState,
  StakeRecord,
  StakingPool
} from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';

// Wallet type for in-memory storage
export interface Wallet {
  address: string;
  publicKey: string;
  balance: string;
  createdAt: Date;
  lastUpdated: Date; // Changed from lastSynced to match database schema
  passphraseSalt: string;
  passphraseHash: string;
}

// Serializable storage state
interface StorageState {
  blocks: Block[];
  transactions: Transaction[];
  wallets: [string, Wallet][];
  minerStats: [string, MiningStats][];
  stakeRecords: [string, StakeRecord][];
  stakingPools: StakingPool[];
}

// Path for persisting blockchain data
const DATA_FILE_PATH = './data/blockchain-data.json';

// In-memory blockchain data storage with file persistence
export class MemBlockchainStorage {
  private blocks: Block[] = [];
  private transactions: Transaction[] = [];
  wallets: Map<string, Wallet> = new Map();
  private minerStats: Map<string, MiningStats> = new Map();
  private stakeRecords: Map<string, StakeRecord> = new Map();
  private stakingPools: StakingPool[] = [];
  
  constructor() {
    this.loadFromFile();
    // Initialize default staking pools if none exist
    if (this.stakingPools.length === 0) {
      this.initializeDefaultStakingPools();
    }
  }
  
  // Initialize default staking pools
  private initializeDefaultStakingPools() {
    this.stakingPools = [
      {
        id: 'pool1',
        name: 'Genesis Pool',
        description: 'The original PVX staking pool with no lockup period',
        apy: '8.5',
        totalStaked: '1500000000',
        minStake: '10000',
        lockupPeriod: 0, // No lockup
        active: true
      },
      {
        id: 'pool2',
        name: 'Hodler Pool',
        description: 'Higher APY with a short 7-day lockup period',
        apy: '12.0',
        totalStaked: '750000000',
        minStake: '100000',
        lockupPeriod: 7, // 7 days
        active: true
      },
      {
        id: 'pool3',
        name: 'Validator Pool',
        description: 'Premium returns for long-term stakers with 30-day lockup',
        apy: '15.0',
        totalStaked: '350000000',
        minStake: '1000000',
        lockupPeriod: 30, // 30 days
        active: true
      },
      {
        id: 'pool4',
        name: 'ZK Privacy Pool',
        description: 'Highest returns with enhanced privacy features',
        apy: '18.5',
        totalStaked: '200000000',
        minStake: '5000000',
        lockupPeriod: 90, // 90 days
        active: true
      }
    ];
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
        stakeRecords: Array.from(this.stakeRecords.entries()),
        stakingPools: this.stakingPools
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
            lastUpdated: new Date(wallet.lastUpdated || wallet.lastSynced) // Support both field names for backward compatibility
          };
          return [key, restoredWallet];
        }));
        
        // Restore miner stats
        this.minerStats = new Map(data.minerStats || []);
        
        // Restore stake records
        this.stakeRecords = new Map(data.stakeRecords || []);
        
        // Restore staking pools
        this.stakingPools = data.stakingPools || [];
        
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
  
  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    const index = this.transactions.findIndex(t => t.hash === transaction.hash);
    if (index !== -1) {
      this.transactions[index] = transaction;
      await this.saveToFile();
    }
    return transaction;
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
  
  // Staking methods
  async createStakeRecord(stake: StakeRecord): Promise<StakeRecord> {
    this.stakeRecords.set(stake.id, stake);
    await this.saveToFile();
    return stake;
  }
  
  async getStakeById(id: string): Promise<StakeRecord | undefined> {
    return this.stakeRecords.get(id);
  }
  
  async getStakesByAddress(address: string): Promise<StakeRecord[]> {
    return Array.from(this.stakeRecords.values())
      .filter(stake => stake.walletAddress === address);
  }
  
  async getActiveStakesByAddress(address: string): Promise<StakeRecord[]> {
    return Array.from(this.stakeRecords.values())
      .filter(stake => stake.walletAddress === address && stake.isActive);
  }
  
  async getActiveStakesByPoolId(poolId: string): Promise<StakeRecord[]> {
    return Array.from(this.stakeRecords.values())
      .filter(stake => stake.poolId === poolId && stake.isActive);
  }
  
  async updateStakeRecord(stake: StakeRecord): Promise<StakeRecord> {
    this.stakeRecords.set(stake.id, stake);
    await this.saveToFile();
    return stake;
  }
  
  async getStakingPools(): Promise<StakingPool[]> {
    return this.stakingPools;
  }
  
  async getStakingPoolById(id: string): Promise<StakingPool | undefined> {
    return this.stakingPools.find(pool => pool.id === id);
  }
  
  async updateStakingPool(pool: StakingPool): Promise<StakingPool> {
    const index = this.stakingPools.findIndex(p => p.id === pool.id);
    if (index !== -1) {
      this.stakingPools[index] = pool;
      await this.saveToFile();
    }
    return pool;
  }
}

// Create and export singleton instance
export const memBlockchainStorage = new MemBlockchainStorage();