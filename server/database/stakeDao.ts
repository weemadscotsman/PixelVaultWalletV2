import { eq, desc, and, isNotNull, isNull } from 'drizzle-orm';
import { db } from './index';
import { stakeRecords, stakingPools } from './schema';
import { StakeRecord, StakingPool } from '@shared/types';

/**
 * Data access object for stake records and staking pools
 */
export class StakeDao {
  /**
   * Create a new stake record
   * @param stake Stake record to create
   * @returns Created stake record
   */
  async createStakeRecord(stake: StakeRecord): Promise<StakeRecord> {
    try {
      // Convert stake record to database format
      const dbStake = {
        id: stake.id,
        walletAddress: stake.walletAddress,
        poolId: stake.poolId,
        amount: stake.amount,
        startTime: BigInt(stake.startTime),
        endTime: stake.endTime ? BigInt(stake.endTime) : undefined,
        isActive: stake.isActive,
        rewards: stake.rewards,
        lastRewardClaim: BigInt(stake.lastRewardClaim),
        autoCompound: stake.autoCompound
      };

      // Insert stake record
      await db.insert(stakeRecords).values(dbStake);
      
      // Update pool statistics
      await this.updatePoolStatistics(stake.poolId);
      
      // Return original stake record
      return stake;
    } catch (error) {
      console.error('Error creating stake record:', error);
      throw new Error('Failed to create stake record');
    }
  }

  /**
   * Get stake record by ID
   * @param id Stake record ID
   * @returns Stake record or undefined if not found
   */
  async getStakeById(id: string): Promise<StakeRecord | undefined> {
    try {
      const result = await db.select()
        .from(stakeRecords)
        .where(eq(stakeRecords.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to StakeRecord
      const dbStake = result[0];
      return {
        id: dbStake.id,
        walletAddress: dbStake.walletAddress,
        poolId: dbStake.poolId,
        amount: dbStake.amount,
        startTime: Number(dbStake.startTime),
        endTime: dbStake.endTime ? Number(dbStake.endTime) : undefined,
        isActive: dbStake.isActive,
        rewards: dbStake.rewards,
        lastRewardClaim: Number(dbStake.lastRewardClaim),
        autoCompound: dbStake.autoCompound
      };
    } catch (error) {
      console.error('Error getting stake by ID:', error);
      throw new Error('Failed to get stake record');
    }
  }

  /**
   * Get all stake records by wallet address
   * @param address Wallet address
   * @returns Array of stake records
   */
  async getStakesByAddress(address: string): Promise<StakeRecord[]> {
    try {
      const result = await db.select()
        .from(stakeRecords)
        .where(eq(stakeRecords.walletAddress, address))
        .orderBy(desc(stakeRecords.startTime));
      
      // Convert database format to StakeRecord[]
      return result.map(dbStake => ({
        id: dbStake.id,
        walletAddress: dbStake.walletAddress,
        poolId: dbStake.poolId,
        amount: dbStake.amount,
        startTime: Number(dbStake.startTime),
        endTime: dbStake.endTime ? Number(dbStake.endTime) : undefined,
        isActive: dbStake.isActive,
        rewards: dbStake.rewards,
        lastRewardClaim: Number(dbStake.lastRewardClaim),
        autoCompound: dbStake.autoCompound
      }));
    } catch (error) {
      console.error('Error getting stakes by address:', error);
      throw new Error('Failed to get stake records');
    }
  }

  /**
   * Get active stake records by wallet address
   * @param address Wallet address
   * @returns Array of active stake records
   */
  async getActiveStakesByAddress(address: string): Promise<StakeRecord[]> {
    try {
      const result = await db.select()
        .from(stakeRecords)
        .where(
          and(
            eq(stakeRecords.walletAddress, address),
            eq(stakeRecords.isActive, true)
          )
        )
        .orderBy(desc(stakeRecords.startTime));
      
      // Convert database format to StakeRecord[]
      return result.map(dbStake => ({
        id: dbStake.id,
        walletAddress: dbStake.walletAddress,
        poolId: dbStake.poolId,
        amount: dbStake.amount,
        startTime: Number(dbStake.startTime),
        endTime: dbStake.endTime ? Number(dbStake.endTime) : undefined,
        isActive: dbStake.isActive,
        rewards: dbStake.rewards,
        lastRewardClaim: Number(dbStake.lastRewardClaim),
        autoCompound: dbStake.autoCompound
      }));
    } catch (error) {
      console.error('Error getting active stakes by address:', error);
      throw new Error('Failed to get active stake records');
    }
  }

  /**
   * Get active stake records by pool ID
   * @param poolId Staking pool ID
   * @returns Array of active stake records
   */
  async getActiveStakesByPoolId(poolId: string): Promise<StakeRecord[]> {
    try {
      const result = await db.select()
        .from(stakeRecords)
        .where(
          and(
            eq(stakeRecords.poolId, poolId),
            eq(stakeRecords.isActive, true)
          )
        )
        .orderBy(desc(stakeRecords.startTime));
      
      // Convert database format to StakeRecord[]
      return result.map(dbStake => ({
        id: dbStake.id,
        walletAddress: dbStake.walletAddress,
        poolId: dbStake.poolId,
        amount: dbStake.amount,
        startTime: Number(dbStake.startTime),
        endTime: dbStake.endTime ? Number(dbStake.endTime) : undefined,
        isActive: dbStake.isActive,
        rewards: dbStake.rewards,
        lastRewardClaim: Number(dbStake.lastRewardClaim),
        autoCompound: dbStake.autoCompound
      }));
    } catch (error) {
      console.error('Error getting active stakes by pool ID:', error);
      throw new Error('Failed to get active stake records');
    }
  }

  /**
   * Update a stake record
   * @param stake Stake record to update
   * @returns Updated stake record
   */
  async updateStakeRecord(stake: StakeRecord): Promise<StakeRecord> {
    try {
      // Check if stake exists
      const existingStake = await this.getStakeById(stake.id);
      if (!existingStake) {
        return this.createStakeRecord(stake);
      }
      
      // Convert stake record to database format
      const dbStake = {
        amount: stake.amount,
        endTime: stake.endTime ? BigInt(stake.endTime) : null,
        isActive: stake.isActive,
        rewards: stake.rewards,
        lastRewardClaim: BigInt(stake.lastRewardClaim),
        autoCompound: stake.autoCompound,
        updatedAt: new Date()
      };

      // Update stake record
      await db.update(stakeRecords)
        .set(dbStake)
        .where(eq(stakeRecords.id, stake.id));
      
      // Update pool statistics if active status changed
      if (existingStake.isActive !== stake.isActive) {
        await this.updatePoolStatistics(stake.poolId);
      }
      
      // Return updated stake record
      return stake;
    } catch (error) {
      console.error('Error updating stake record:', error);
      throw new Error('Failed to update stake record');
    }
  }

  /**
   * End an active stake
   * @param stakeId Stake record ID
   * @param endTime End timestamp
   * @returns Updated stake record
   */
  async endStake(stakeId: string, endTime: number): Promise<StakeRecord | undefined> {
    try {
      // Get existing stake
      const stake = await this.getStakeById(stakeId);
      if (!stake || !stake.isActive) {
        return undefined;
      }
      
      // Update stake
      stake.isActive = false;
      stake.endTime = endTime;
      
      // Save updated stake
      return await this.updateStakeRecord(stake);
    } catch (error) {
      console.error('Error ending stake:', error);
      throw new Error('Failed to end stake');
    }
  }

  /**
   * Get all staking pools
   * @returns Array of staking pools
   */
  async getStakingPools(): Promise<StakingPool[]> {
    try {
      const result = await db.select()
        .from(stakingPools)
        .orderBy(desc(stakingPools.apr));
      
      // Convert database format to StakingPool[]
      return result.map(dbPool => ({
        id: dbPool.id,
        name: dbPool.name,
        description: dbPool.description,
        apr: dbPool.apr,
        minStakeAmount: dbPool.minStakeAmount,
        lockupPeriod: dbPool.lockupPeriod,
        totalStaked: dbPool.totalStaked,
        activeStakers: dbPool.activeStakers
      }));
    } catch (error) {
      console.error('Error getting staking pools:', error);
      throw new Error('Failed to get staking pools');
    }
  }

  /**
   * Get staking pool by ID
   * @param id Staking pool ID
   * @returns Staking pool or undefined if not found
   */
  async getStakingPoolById(id: string): Promise<StakingPool | undefined> {
    try {
      const result = await db.select()
        .from(stakingPools)
        .where(eq(stakingPools.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to StakingPool
      const dbPool = result[0];
      return {
        id: dbPool.id,
        name: dbPool.name,
        description: dbPool.description,
        apr: dbPool.apr,
        minStakeAmount: dbPool.minStakeAmount,
        lockupPeriod: dbPool.lockupPeriod,
        totalStaked: dbPool.totalStaked,
        activeStakers: dbPool.activeStakers
      };
    } catch (error) {
      console.error('Error getting staking pool by ID:', error);
      throw new Error('Failed to get staking pool');
    }
  }

  /**
   * Create a new staking pool
   * @param pool Staking pool to create
   * @returns Created staking pool
   */
  async createStakingPool(pool: StakingPool): Promise<StakingPool> {
    try {
      // Convert staking pool to database format
      const dbPool = {
        id: pool.id,
        name: pool.name,
        description: pool.description,
        apr: pool.apr,
        minStakeAmount: pool.minStakeAmount,
        lockupPeriod: pool.lockupPeriod,
        totalStaked: pool.totalStaked,
        activeStakers: pool.activeStakers
      };

      // Insert staking pool
      await db.insert(stakingPools).values(dbPool);
      
      // Return original staking pool
      return pool;
    } catch (error) {
      console.error('Error creating staking pool:', error);
      throw new Error('Failed to create staking pool');
    }
  }

  /**
   * Update a staking pool
   * @param pool Staking pool to update
   * @returns Updated staking pool
   */
  async updateStakingPool(pool: StakingPool): Promise<StakingPool> {
    try {
      // Check if pool exists
      const existingPool = await this.getStakingPoolById(pool.id);
      if (!existingPool) {
        return this.createStakingPool(pool);
      }
      
      // Convert staking pool to database format
      const dbPool = {
        name: pool.name,
        description: pool.description,
        apr: pool.apr,
        minStakeAmount: pool.minStakeAmount,
        lockupPeriod: pool.lockupPeriod,
        totalStaked: pool.totalStaked,
        activeStakers: pool.activeStakers,
        updatedAt: new Date()
      };

      // Update staking pool
      await db.update(stakingPools)
        .set(dbPool)
        .where(eq(stakingPools.id, pool.id));
      
      // Return updated staking pool
      return pool;
    } catch (error) {
      console.error('Error updating staking pool:', error);
      throw new Error('Failed to update staking pool');
    }
  }

  /**
   * Update pool statistics based on active stakes
   * @param poolId Staking pool ID
   */
  private async updatePoolStatistics(poolId: string): Promise<void> {
    try {
      // Get pool
      const pool = await this.getStakingPoolById(poolId);
      if (!pool) {
        throw new Error(`Staking pool not found: ${poolId}`);
      }
      
      // Get active stakes for this pool
      const activeStakes = await this.getActiveStakesByPoolId(poolId);
      
      // Calculate total staked amount
      const totalStaked = activeStakes.reduce((sum, stake) => {
        return (BigInt(sum) + BigInt(stake.amount)).toString();
      }, '0');
      
      // Update pool
      await db.update(stakingPools)
        .set({ 
          totalStaked,
          activeStakers: activeStakes.length,
          updatedAt: new Date()
        })
        .where(eq(stakingPools.id, poolId));
    } catch (error) {
      console.error('Error updating pool statistics:', error);
      throw new Error('Failed to update pool statistics');
    }
  }
}

// Create a singleton instance
export const stakeDao = new StakeDao();