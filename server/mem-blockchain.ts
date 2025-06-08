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
  lastUpdated: Date; // Primary timestamp field for last update
  lastSynced?: Date; // Kept for backward compatibility
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
          const lastUpdatedTimestamp = new Date(wallet.lastUpdated || wallet.lastSynced);
          const restoredWallet = {
            ...wallet,
            createdAt: new Date(wallet.createdAt),
            lastUpdated: lastUpdatedTimestamp,
            lastSynced: lastUpdatedTimestamp // Ensure both fields are present
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
    console.log('MemBlockchainStorage.createWallet - Wallet data:', {
      address: wallet.address,
      hasPublicKey: Boolean(wallet.publicKey),
      hasPassphraseSalt: Boolean(wallet.passphraseSalt),
      hasPassphraseHash: Boolean(wallet.passphraseHash)
    });
    
    // Make sure we're storing the complete wallet object with all fields
    const completeWallet: Wallet = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      lastUpdated: wallet.lastUpdated || new Date(),
      lastSynced: wallet.lastSynced,
      // These are the critical auth fields that must be preserved
      passphraseSalt: wallet.passphraseSalt,
      passphraseHash: wallet.passphraseHash
    };
    
    this.wallets.set(wallet.address, completeWallet);
    await this.saveToFile();
    return completeWallet;
  }
  
  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return this.wallets.get(address);
  }
  
  async updateWallet(wallet: Wallet): Promise<Wallet> {
    // Get the existing wallet to preserve critical fields if they're missing
    const existingWallet = this.wallets.get(wallet.address);
    
    // Create a complete wallet with all needed fields, preserving existing values if not provided
    const updatedWallet: Wallet = {
      address: wallet.address,
      publicKey: wallet.publicKey || existingWallet?.publicKey || '',
      balance: wallet.balance || existingWallet?.balance || '0',
      createdAt: wallet.createdAt || existingWallet?.createdAt || new Date(),
      lastUpdated: new Date(), // Always update this timestamp
      lastSynced: wallet.lastSynced || new Date(), // For compatibility
      // Critical auth fields - preserve from existing if not in update
      passphraseSalt: wallet.passphraseSalt || existingWallet?.passphraseSalt || '',
      passphraseHash: wallet.passphraseHash || existingWallet?.passphraseHash || ''
    };
    
    this.wallets.set(wallet.address, updatedWallet);
    await this.saveToFile();
    return updatedWallet;
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

  async startMining(address: string): Promise<MiningStats> {
    let miner = this.minerStats.get(address);
    
    if (!miner) {
      // Create new miner stats if they don't exist
      miner = {
        address,
        hashRate: '250.5',
        totalRewards: '0.0',
        blocksFound: 0,
        isCurrentlyMining: true,
        startTime: Date.now(),
        lastBlockTime: null
      };
    } else {
      // Update existing miner to start mining
      miner.isCurrentlyMining = true;
      miner.startTime = Date.now();
      miner.hashRate = '250.5'; // Activate mining with real hash rate
    }
    
    this.minerStats.set(address, miner);
    await this.saveToFile();
    
    // Start the mining process for this address
    this.startMiningProcess(address);
    
    return miner;
  }

  private startMiningProcess(address: string): void {
    // Start continuous mining process
    const miningInterval = setInterval(async () => {
      const miner = this.minerStats.get(address);
      if (!miner || !miner.isCurrentlyMining) {
        clearInterval(miningInterval);
        return;
      }

      // Simulate mining activity - chance to find a block every 30 seconds
      const random = Math.random();
      if (random < 0.1) { // 10% chance to find a block
        await this.mineBlock(address);
      }
    }, 30000); // Check every 30 seconds
  }

  private async mineBlock(minerAddress: string): Promise<void> {
    const miner = this.minerStats.get(minerAddress);
    if (!miner) return;

    // Create a new block
    const previousBlock = this.blocks[this.blocks.length - 1];
    const newBlock: Block = {
      height: previousBlock ? previousBlock.height + 1 : 1,
      hash: this.generateBlockHash(),
      previousHash: previousBlock?.hash || '0',
      timestamp: Date.now(),
      transactions: [],
      nonce: Math.floor(Math.random() * 1000000),
      difficulty: 5,
      minerAddress
    };

    this.blocks.push(newBlock);

    // Update miner stats
    miner.blocksFound += 1;
    miner.lastBlockTime = Date.now();
    const blockReward = 50.0;
    miner.totalRewards = (parseFloat(miner.totalRewards) + blockReward).toString();

    // Update miner's wallet balance
    const wallet = this.wallets.get(minerAddress);
    if (wallet) {
      wallet.balance = (parseFloat(wallet.balance) + blockReward).toString();
      wallet.lastUpdated = new Date();
    }

    await this.saveToFile();
    console.log(`Block mined by ${minerAddress}! Height: ${newBlock.height}, Reward: ${blockReward} PVX`);
  }

  private generateBlockHash(): string {
    return 'block_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
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

  async getBlockchainStatus(): Promise<any> {
    const latestBlock = await this.getLatestBlock();
    return {
      connected: true,
      synced: true,
      difficulty: 5,
      peers: 15,
      latestBlock: latestBlock ? {
        height: latestBlock.height,
        hash: latestBlock.hash,
        timestamp: latestBlock.timestamp
      } : null
    };
  }

  // Mining operations
  get miners(): Map<string, any> {
    return this.minerStats;
  }

  async startMining(walletAddress: string): Promise<any> {
    const miner = {
      address: walletAddress,
      isActive: true,
      hashRate: Math.floor(Math.random() * 100) + 50,
      blocksFound: 0,
      totalRewards: '0',
      lastBlockTime: null,
      startedAt: new Date()
    };
    
    this.minerStats.set(walletAddress, miner);
    await this.saveToFile();
    
    return {
      success: true,
      message: 'Mining started successfully',
      miner
    };
  }

  async stopMining(walletAddress: string): Promise<any> {
    const miner = this.minerStats.get(walletAddress);
    if (miner) {
      miner.isActive = false;
      miner.stoppedAt = new Date();
      this.minerStats.set(walletAddress, miner);
      await this.saveToFile();
    }
    
    return {
      success: true,
      message: 'Mining stopped successfully'
    };
  }

  // Staking rewards
  async getStakeRewards(address: string): Promise<any> {
    const stakes = await this.getStakesByAddress(address);
    let totalRewards = '0';
    let pendingRewards = '0';
    let claimedRewards = '0';
    
    stakes.forEach(stake => {
      if (stake.rewards) {
        totalRewards = (parseFloat(totalRewards) + parseFloat(stake.rewards)).toString();
        if (stake.isActive) {
          pendingRewards = (parseFloat(pendingRewards) + parseFloat(stake.rewards)).toString();
        } else {
          claimedRewards = (parseFloat(claimedRewards) + parseFloat(stake.rewards)).toString();
        }
      }
    });
    
    return {
      totalRewards,
      pendingRewards,
      claimedRewards,
      stakes: stakes.length
    };
  }

  // Governance operations
  async createProposal(proposal: any): Promise<any> {
    const newProposal = {
      id: `prop_${Date.now()}`,
      ...proposal,
      votes: { for: 0, against: 0, abstain: 0 },
      status: 'active',
      createdAt: new Date()
    };
    
    // Store in a simple array for now
    if (!this.proposals) {
      this.proposals = [];
    }
    this.proposals.push(newProposal);
    await this.saveToFile();
    
    return newProposal;
  }

  async voteOnProposal(proposalId: string, vote: string, voter: string): Promise<any> {
    if (!this.proposals) {
      this.proposals = [];
    }
    
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    // Simple vote counting
    if (vote === 'for') proposal.votes.for++;
    else if (vote === 'against') proposal.votes.against++;
    else if (vote === 'abstain') proposal.votes.abstain++;
    
    await this.saveToFile();
    
    return {
      success: true,
      proposal,
      vote,
      voter
    };
  }

  private proposals: any[] = [];
}

// Create and export singleton instance
export const memBlockchainStorage = new MemBlockchainStorage();