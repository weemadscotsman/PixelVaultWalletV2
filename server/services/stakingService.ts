import { db } from '../database/index';
import { stakeRecords, stakingPools, wallets, transactions } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { StakeRecord, StakingPool } from '@shared/types';

export class StakingService {
  /**
   * Initialize staking pools in database if they don't exist
   */
  async initializeStakingPools(): Promise<void> {
    try {
      const existingPools = await db.select().from(stakingPools);
      
      if (existingPools.length === 0) {
        const defaultPools = [
          {
            id: 'genesis-pool',
            name: 'Genesis Pool',
            description: 'The original PVX staking pool with no lockup period',
            apr: 8.5,
            minStakeAmount: 10000,
            lockupPeriod: 0,
            totalStaked: '1500000000000',
            activeStakers: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'hodler-pool',
            name: 'Hodler Pool',
            description: 'Higher APY with a short 7-day lockup period',
            apr: 12.0,
            minStakeAmount: 100000,
            lockupPeriod: 7,
            totalStaked: '750000000',
            activeStakers: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'validator-pool',
            name: 'Validator Pool',
            description: 'Premium returns for long-term stakers with 30-day lockup',
            apr: 15.0,
            minStakeAmount: 1000000,
            lockupPeriod: 30,
            totalStaked: '350000000',
            activeStakers: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'zk-privacy-pool',
            name: 'ZK Privacy Pool',
            description: 'Highest returns with enhanced privacy features',
            apr: 18.5,
            minStakeAmount: 5000000,
            lockupPeriod: 90,
            totalStaked: '200000000',
            activeStakers: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        await db.insert(stakingPools).values(defaultPools);
        console.log('✅ STAKING POOLS INITIALIZED: 4 pools created in database');
      }
    } catch (error) {
      console.error('❌ Failed to initialize staking pools:', error);
    }
  }

  /**
   * Create a new stake record and persist to database
   */
  async createStake(stakeData: {
    walletAddress: string;
    poolId: string;
    amount: number;
    passphrase: string;
  }): Promise<{ stakeId: string; transactionHash: string }> {
    try {
      // Verify wallet exists
      const wallet = await db.select().from(wallets).where(eq(wallets.address, stakeData.walletAddress)).limit(1);
      if (wallet.length === 0) {
        throw new Error('Wallet not found');
      }

      // Verify pool exists
      const pool = await db.select().from(stakingPools).where(eq(stakingPools.id, stakeData.poolId)).limit(1);
      if (pool.length === 0) {
        throw new Error('Staking pool not found');
      }

      // Check minimum stake amount
      if (stakeData.amount < pool[0].minStakeAmount) {
        throw new Error(`Minimum stake amount is ${pool[0].minStakeAmount} μPVX`);
      }

      // Verify wallet balance
      const walletBalance = parseFloat(wallet[0].balance);
      if (walletBalance < stakeData.amount) {
        throw new Error('Insufficient balance');
      }

      // Generate unique stake ID
      const stakeId = `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      // Create stake record
      const stakeRecord = {
        id: stakeId,
        walletAddress: stakeData.walletAddress,
        poolId: stakeData.poolId,
        amount: stakeData.amount.toString(),
        startTime: now.toString(),
        endTime: null,
        isActive: true,
        rewards: '0',
        lastRewardClaim: now.toString(),
        autoCompound: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Persist stake to database
      await db.insert(stakeRecords).values([stakeRecord]);

      // Update wallet balance
      const newBalance = (walletBalance - stakeData.amount).toString();
      await db.update(wallets)
        .set({ 
          balance: newBalance,
          lastUpdated: new Date()
        })
        .where(eq(wallets.address, stakeData.walletAddress));

      // Create transaction record
      const txHash = `stake_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transaction = {
        hash: txHash,
        type: 'STAKE_START',
        fromAddress: stakeData.walletAddress,
        toAddress: `STAKE_POOL_${stakeData.poolId}`,
        amount: stakeData.amount,
        timestamp: now,
        nonce: Math.floor(Math.random() * 100000),
        signature: `sig_${Math.random().toString(36).substr(2, 16)}`,
        status: 'confirmed',
        blockHeight: null,
        fee: null,
        metadata: { stakeId, poolId: stakeData.poolId },
        createdAt: new Date()
      };

      await db.insert(transactions).values([transaction]);

      // Update pool statistics
      await this.updatePoolStatistics(stakeData.poolId);

      console.log(`✅ STAKE CREATED IN DATABASE: ${stakeId} for ${stakeData.walletAddress} - ${stakeData.amount} PVX`);
      
      return { stakeId, transactionHash: txHash };
    } catch (error) {
      console.error('❌ STAKE CREATION FAILED:', error);
      throw error;
    }
  }

  /**
   * Get all active stakes for a wallet address from database
   */
  async getActiveStakes(walletAddress: string): Promise<StakeRecord[]> {
    try {
      const stakes = await db.select()
        .from(stakeRecords)
        .where(
          and(
            eq(stakeRecords.walletAddress, walletAddress),
            eq(stakeRecords.isActive, true)
          )
        )
        .orderBy(desc(stakeRecords.startTime));

      // Convert database format to StakeRecord format
      return stakes.map(stake => ({
        id: stake.id,
        walletAddress: stake.walletAddress,
        poolId: stake.poolId,
        amount: stake.amount,
        startTime: Number(stake.startTime),
        endTime: stake.endTime ? Number(stake.endTime) : undefined,
        isActive: stake.isActive,
        rewards: stake.rewards,
        lastRewardClaim: Number(stake.lastRewardClaim),
        autoCompound: stake.autoCompound
      }));
    } catch (error) {
      console.error('❌ Failed to get active stakes:', error);
      throw new Error('Failed to retrieve staking records');
    }
  }

  /**
   * Calculate and claim rewards for a stake
   */
  async claimRewards(stakeId: string, walletAddress: string): Promise<number> {
    try {
      // Get stake record from database
      const stakes = await db.select()
        .from(stakeRecords)
        .where(
          and(
            eq(stakeRecords.id, stakeId),
            eq(stakeRecords.walletAddress, walletAddress),
            eq(stakeRecords.isActive, true)
          )
        )
        .limit(1);

      if (stakes.length === 0) {
        throw new Error('Active stake not found');
      }

      const stake = stakes[0];
      const now = Date.now();
      
      // Calculate time since last claim
      const timeSinceLastClaim = now - Number(stake.lastRewardClaim);
      const hoursElapsed = timeSinceLastClaim / (1000 * 60 * 60);

      // Get pool APY
      const pools = await db.select().from(stakingPools).where(eq(stakingPools.id, stake.poolId)).limit(1);
      const apy = pools.length > 0 ? pools[0].apr : 8.5;

      // Calculate rewards: (staked amount * APY / 365 / 24) * hours elapsed
      const stakeAmount = parseFloat(stake.amount);
      const hourlyRate = (apy / 100) / (365 * 24);
      const newRewards = stakeAmount * hourlyRate * hoursElapsed;

      if (newRewards <= 0) {
        throw new Error('No rewards available to claim');
      }

      // Update stake record with new rewards and claim time
      const totalRewards = parseFloat(stake.rewards) + newRewards;
      
      await db.update(stakeRecords)
        .set({
          rewards: totalRewards.toString(),
          lastRewardClaim: now.toString(),
          updatedAt: new Date()
        })
        .where(eq(stakeRecords.id, stakeId));

      // Update wallet balance with claimed rewards
      const wallet = await db.select().from(wallets).where(eq(wallets.address, walletAddress)).limit(1);
      if (wallet.length > 0) {
        const currentBalance = parseFloat(wallet[0].balance);
        const newBalance = (currentBalance + newRewards).toString();
        
        await db.update(wallets)
          .set({ 
            balance: newBalance,
            lastUpdated: new Date()
          })
          .where(eq(wallets.address, walletAddress));
      }

      // Create transaction record for reward claim
      const txHash = `reward_claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transaction = {
        hash: txHash,
        type: 'REWARD_CLAIM',
        fromAddress: `STAKE_POOL_${stake.poolId}`,
        toAddress: walletAddress,
        amount: Math.floor(newRewards * 1000000), // Convert to μPVX
        timestamp: now,
        nonce: Math.floor(Math.random() * 100000),
        signature: `sig_${Math.random().toString(36).substr(2, 16)}`,
        status: 'confirmed',
        blockHeight: null,
        fee: null,
        metadata: { stakeId, rewardAmount: newRewards },
        createdAt: new Date()
      };

      await db.insert(transactions).values([transaction]);

      console.log(`✅ REWARDS CLAIMED FROM DATABASE: ${newRewards.toFixed(6)} PVX for stake ${stakeId}`);
      
      return newRewards;
    } catch (error) {
      console.error('❌ REWARD CLAIM FAILED:', error);
      throw error;
    }
  }

  /**
   * Get all staking pools from database
   */
  async getStakingPools(): Promise<StakingPool[]> {
    try {
      const pools = await db.select().from(stakingPools);
      
      return pools.map(pool => ({
        id: pool.id,
        name: pool.name,
        description: pool.description,
        apr: pool.apr,
        minStakeAmount: pool.minStakeAmount,
        lockupPeriod: pool.lockupPeriod,
        totalStaked: pool.totalStaked,
        activeStakers: pool.activeStakers
      }));
    } catch (error) {
      console.error('❌ Failed to get staking pools:', error);
      throw new Error('Failed to retrieve staking pools');
    }
  }

  /**
   * Update pool statistics based on active stakes
   */
  private async updatePoolStatistics(poolId: string): Promise<void> {
    try {
      // Get all active stakes for this pool
      const activeStakes = await db.select()
        .from(stakeRecords)
        .where(
          and(
            eq(stakeRecords.poolId, poolId),
            eq(stakeRecords.isActive, true)
          )
        );

      // Calculate totals
      const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
      const activeStakers = activeStakes.length;

      // Update pool record
      await db.update(stakingPools)
        .set({
          totalStaked: totalStaked.toString(),
          activeStakers,
          updatedAt: new Date()
        })
        .where(eq(stakingPools.id, poolId));

      console.log(`✅ POOL STATS UPDATED: ${poolId} - ${activeStakers} stakers, ${totalStaked} total staked`);
    } catch (error) {
      console.error('❌ Failed to update pool statistics:', error);
    }
  }
}

export const stakingService = new StakingService();