import { eq, desc } from 'drizzle-orm';
import { db } from './index';
import { minerStats } from './schema';
import { MiningStats } from '@shared/types';

/**
 * Data access object for miner stats
 */
export class MinerDao {
  /**
   * Create new miner stats
   * @param stats Mining stats to create
   * @returns Created mining stats
   */
  async createMinerStats(stats: MiningStats): Promise<MiningStats> {
    try {
      // Convert mining stats to database format
      const dbStats = {
        address: stats.address,
        blocksMined: stats.blocksMined,
        totalRewards: stats.totalRewards,
        lastBlockMined: BigInt(stats.lastBlockMined),
        isCurrentlyMining: stats.isCurrentlyMining,
        hardware: stats.hardware,
        joinedAt: stats.joinedAt,
        currentHashRate: stats.currentHashRate,
      };

      // Insert mining stats
      await db.insert(minerStats).values(dbStats);
      
      // Return original stats
      return stats;
    } catch (error) {
      console.error('Error creating miner stats:', error);
      throw new Error('Failed to create miner stats');
    }
  }

  /**
   * Get miner stats by address
   * @param address Miner address
   * @returns Mining stats or undefined if not found
   */
  async getMinerStatsByAddress(address: string): Promise<MiningStats | undefined> {
    try {
      const result = await db.select()
        .from(minerStats)
        .where(eq(minerStats.address, address))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to MiningStats
      const dbStats = result[0];
      return {
        address: dbStats.address,
        blocksMined: dbStats.blocksMined,
        totalRewards: dbStats.totalRewards,
        lastBlockMined: Number(dbStats.lastBlockMined),
        isCurrentlyMining: dbStats.isCurrentlyMining,
        hardware: dbStats.hardware as 'CPU' | 'GPU' | 'ASIC',
        joinedAt: dbStats.joinedAt,
        currentHashRate: dbStats.currentHashRate,
      };
    } catch (error) {
      console.error('Error getting miner stats by address:', error);
      throw new Error('Failed to get miner stats');
    }
  }

  /**
   * Update miner stats
   * @param stats Mining stats to update
   * @returns Updated mining stats
   */
  async updateMinerStats(stats: MiningStats): Promise<MiningStats> {
    try {
      // Check if miner exists
      const existingStats = await this.getMinerStatsByAddress(stats.address);
      if (!existingStats) {
        return this.createMinerStats(stats);
      }
      
      // Convert mining stats to database format
      const dbStats = {
        blocksMined: stats.blocksMined,
        totalRewards: stats.totalRewards,
        lastBlockMined: BigInt(stats.lastBlockMined),
        isCurrentlyMining: stats.isCurrentlyMining,
        hardware: stats.hardware,
        currentHashRate: stats.currentHashRate,
        updatedAt: new Date(),
      };

      // Update mining stats
      await db.update(minerStats)
        .set(dbStats)
        .where(eq(minerStats.address, stats.address));
      
      // Return updated stats
      return stats;
    } catch (error) {
      console.error('Error updating miner stats:', error);
      throw new Error('Failed to update miner stats');
    }
  }

  /**
   * Get all active miners
   * @returns Array of active mining stats
   */
  async getAllActiveMiners(): Promise<MiningStats[]> {
    try {
      const result = await db.select()
        .from(minerStats)
        .where(eq(minerStats.isCurrentlyMining, true));
      
      // Convert database format to MiningStats[]
      return result.map(dbStats => ({
        address: dbStats.address,
        blocksMined: dbStats.blocksMined,
        totalRewards: dbStats.totalRewards,
        lastBlockMined: Number(dbStats.lastBlockMined),
        isCurrentlyMining: dbStats.isCurrentlyMining,
        hardware: dbStats.hardware as 'CPU' | 'GPU' | 'ASIC',
        joinedAt: dbStats.joinedAt,
        currentHashRate: dbStats.currentHashRate,
      }));
    } catch (error) {
      console.error('Error getting active miners:', error);
      throw new Error('Failed to get active miners');
    }
  }

  /**
   * Get top miners by blocks mined
   * @param limit Maximum number of miners to return
   * @returns Array of mining stats
   */
  async getTopMinersByBlocksMined(limit: number = 10): Promise<MiningStats[]> {
    try {
      const result = await db.select()
        .from(minerStats)
        .orderBy(desc(minerStats.blocksMined))
        .limit(limit);
      
      // Convert database format to MiningStats[]
      return result.map(dbStats => ({
        address: dbStats.address,
        blocksMined: dbStats.blocksMined,
        totalRewards: dbStats.totalRewards,
        lastBlockMined: Number(dbStats.lastBlockMined),
        isCurrentlyMining: dbStats.isCurrentlyMining,
        hardware: dbStats.hardware as 'CPU' | 'GPU' | 'ASIC',
        joinedAt: dbStats.joinedAt,
        currentHashRate: dbStats.currentHashRate,
      }));
    } catch (error) {
      console.error('Error getting top miners:', error);
      throw new Error('Failed to get top miners');
    }
  }

  /**
   * Get total network hash rate
   * @returns Total hash rate of all active miners
   */
  async getTotalNetworkHashRate(): Promise<number> {
    try {
      const activeMiners = await this.getAllActiveMiners();
      return activeMiners.reduce((total, miner) => total + miner.currentHashRate, 0);
    } catch (error) {
      console.error('Error getting total network hash rate:', error);
      throw new Error('Failed to get total network hash rate');
    }
  }

  /**
   * Update miner status (active/inactive)
   * @param address Miner address
   * @param isActive Whether the miner is active
   * @returns Updated mining stats
   */
  async updateMinerStatus(address: string, isActive: boolean): Promise<MiningStats | undefined> {
    try {
      // Check if miner exists
      const existingStats = await this.getMinerStatsByAddress(address);
      if (!existingStats) {
        return undefined;
      }
      
      // Update mining stats
      await db.update(minerStats)
        .set({ 
          isCurrentlyMining: isActive,
          updatedAt: new Date() 
        })
        .where(eq(minerStats.address, address));
      
      // Return updated stats
      return {
        ...existingStats,
        isCurrentlyMining: isActive
      };
    } catch (error) {
      console.error('Error updating miner status:', error);
      throw new Error('Failed to update miner status');
    }
  }
}

// Create a singleton instance
export const minerDao = new MinerDao();