import { IStorage } from "../storage";
import { calculateBlockReward } from "../utils/crypto";
import { MiningStats, MiningReward, TransactionType } from "@shared/types";

export class MiningService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Get the current block reward
   */
  async getCurrentBlockReward(): Promise<number> {
    try {
      const blockHeight = await this.storage.getCurrentBlockHeight();
      return calculateBlockReward(blockHeight);
    } catch (error) {
      console.error("Error getting current block reward:", error);
      return 150; // Default fallback value
    }
  }

  /**
   * Get halving progress information
   */
  async getHalvingProgress(): Promise<{
    current: number;
    total: number;
    nextEstimate: string;
  }> {
    try {
      const blockHeight = await this.storage.getCurrentBlockHeight();
      const halvingInterval = 210000; // Per PVX specs, same as Bitcoin
      
      const currentHalvingPeriod = Math.floor(blockHeight / halvingInterval);
      const nextHalvingHeight = (currentHalvingPeriod + 1) * halvingInterval;
      
      const current = blockHeight % halvingInterval;
      const total = halvingInterval;
      
      // Estimate next halving (assuming 15 seconds per block)
      const blocksRemaining = nextHalvingHeight - blockHeight;
      const secondsRemaining = blocksRemaining * 15;
      const daysRemaining = Math.ceil(secondsRemaining / (60 * 60 * 24));
      
      let nextEstimate: string;
      if (daysRemaining > 365) {
        const years = Math.floor(daysRemaining / 365);
        nextEstimate = `~${years} ${years === 1 ? 'year' : 'years'}`;
      } else if (daysRemaining > 30) {
        const months = Math.floor(daysRemaining / 30);
        nextEstimate = `~${months} ${months === 1 ? 'month' : 'months'}`;
      } else {
        nextEstimate = `~${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
      }
      
      return {
        current,
        total,
        nextEstimate
      };
    } catch (error) {
      console.error("Error getting halving progress:", error);
      // Return default fallback values
      return {
        current: 0,
        total: 210000,
        nextEstimate: "~4 years"
      };
    }
  }

  /**
   * Get mining reward distribution
   */
  async getRewardDistribution(): Promise<{
    miner: number;
    governance: number;
    staking: number;
    reserve: number;
  }> {
    try {
      const blockReward = await this.getCurrentBlockReward();
      
      return {
        miner: blockReward * 0.5, // 50% to miner
        governance: blockReward * 0.25, // 25% to governance
        staking: blockReward * 0.15, // 15% to staking pool
        reserve: blockReward * 0.1 // 10% to vault reserve
      };
    } catch (error) {
      console.error("Error getting reward distribution:", error);
      // Return default fallback values
      return {
        miner: 75,
        governance: 37.5,
        staking: 22.5,
        reserve: 15
      };
    }
  }

  /**
   * Start mining for an address
   */
  async startMining(address: string, threads: number = 2): Promise<boolean> {
    // Get or create mining stats for the address
    let stats = await this.storage.getMiningStats(address);
    
    if (!stats) {
      stats = {
        address,
        blocksMined: 0,
        totalRewards: 0,
        isCurrentlyMining: false,
        currentHashRate: 0
      };
    }
    
    // Update mining status
    stats.isCurrentlyMining = true;
    stats.currentHashRate = threads * 50; // Mock hash rate based on threads
    
    await this.storage.updateMiningStats(stats);
    
    return true;
  }

  /**
   * Stop mining for an address
   */
  async stopMining(address: string): Promise<boolean> {
    // Get mining stats for the address
    const stats = await this.storage.getMiningStats(address);
    
    if (!stats) {
      return false;
    }
    
    // Update mining status
    stats.isCurrentlyMining = false;
    stats.currentHashRate = 0;
    
    await this.storage.updateMiningStats(stats);
    
    return true;
  }

  /**
   * Get mining stats for an address
   */
  async getMiningStats(address: string): Promise<MiningStats> {
    // Get or create mining stats for the address
    let stats = await this.storage.getMiningStats(address);
    
    if (!stats) {
      stats = {
        address,
        blocksMined: 0,
        totalRewards: 0,
        isCurrentlyMining: false,
        currentHashRate: 0
      };
      await this.storage.updateMiningStats(stats);
    }
    
    return stats;
  }

  /**
   * Get mining rewards for an address
   */
  async getMiningRewards(address: string): Promise<MiningReward[]> {
    return this.storage.getMiningRewards(address);
  }

  /**
   * Simulate mining a block
   */
  async simulateMining(address: string): Promise<MiningReward> {
    // Get current block height
    const blockHeight = await this.storage.getCurrentBlockHeight() + 1;
    
    // Calculate mining reward (50% of block reward)
    const blockReward = calculateBlockReward(blockHeight);
    const minerReward = blockReward * 0.5;
    
    // Create a mining reward
    const reward: Omit<MiningReward, 'id'> = {
      blockHeight,
      amount: minerReward,
      timestamp: new Date(),
      address
    };
    
    // Add mining reward to storage
    const miningReward = await this.storage.addMiningReward(reward);
    
    // Create a transaction for the mining reward
    await this.storage.createTransaction({
      type: TransactionType.MINING_REWARD,
      fromAddress: "zk_PVX:coinbase",
      toAddress: address,
      amount: minerReward,
      timestamp: new Date(),
      blockHeight,
      note: `Block ${blockHeight} mining reward`
    });
    
    return miningReward;
  }
}
