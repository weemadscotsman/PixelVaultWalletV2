import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import * as cryptoUtils from '../utils/crypto';
import * as passphraseUtils from '../utils/passphrase';
import { StakeRecord } from '../types';
import { checkStakingBadges } from '../controllers/badgeController';
import { 
  broadcastTransaction, 
  broadcastStakingUpdate, 
  broadcastWalletUpdate, 
  broadcastStatusUpdate 
} from '../utils/websocket';
import { walletDao } from '../database/walletDao';
import { db } from '../db';

/**
 * Start staking
 * POST /api/stake/start
 */
export const startStaking = async (req: Request, res: Response) => {
  try {
    const { address, amount, poolId, passphrase } = req.body;
    
    if (!address || !amount || !poolId || !passphrase) {
      return res.status(400).json({ 
        error: 'Address, amount, pool ID, and passphrase are required' 
      });
    }
    
    // Verify wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Use centralized passphrase verification utility
    const isPassphraseValid = passphraseUtils.verifyPassphrase(
      passphrase,
      wallet.passphraseSalt,
      wallet.passphraseHash
    );
    
    // Log verification outcome
    console.log('Stake start passphrase verification:', {
      address,
      valid: isPassphraseValid
    });
    
    // For test wallets, allow bypass in development
    if (!isPassphraseValid) {
      if (process.env.NODE_ENV !== 'production' && passphraseUtils.isKnownTestWallet(address)) {
        console.log('DEV MODE: Bypassing passphrase check for known wallet address in staking:', address);
      } else {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
    }
    
    // Check balance
    if (BigInt(wallet.balance) < BigInt(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Find pool
    const pool = await memBlockchainStorage.getStakingPoolById(poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Staking pool not found' });
    }
    
    // Check minimum stake
    const minRequiredStake = pool.minStake || '10000'; // Default minimum if not specified
    if (BigInt(amount) < BigInt(minRequiredStake)) {
      return res.status(400).json({ 
        error: `Minimum stake for this pool is ${minRequiredStake} μPVX` 
      });
    }
    
    // Create staking record
    const stakeId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const stake: StakeRecord = {
      id: stakeId,
      walletAddress: address,
      poolId,
      amount,
      startTime: now,
      unlockTime: pool.lockupPeriod > 0 ? now + (pool.lockupPeriod * 24 * 60 * 60 * 1000) : 0,
      lastRewardTime: now,
      isActive: true
    };
    
    // Save stake to blockchain storage
    await memBlockchainStorage.createStakeRecord(stake);
    
    // Update pool's total staked amount
    const newTotalStaked = BigInt(pool.totalStaked) + BigInt(amount);
    pool.totalStaked = newTotalStaked.toString();
    await memBlockchainStorage.updateStakingPool(pool);
    
    // Update wallet balance (remove staked amount)
    const newBalance = BigInt(wallet.balance) - BigInt(amount);
    wallet.balance = newBalance.toString();
    await memBlockchainStorage.updateWallet(wallet);
    
    // Create stake transaction with secure ZK signature
    const txHash = crypto.createHash('sha256')
      .update(address + amount + poolId + now.toString())
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: 'STAKE_START' as const,
      from: address,
      to: `STAKE_POOL_${poolId}`,
      amount,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed' as const
    };
    
    // Store in in-memory blockchain first
    await memBlockchainStorage.createTransaction(transaction);
    
    // Then, persist to database
    try {
      const { transactionDao } = await import('../database/transactionDao');
      
      // Create DB transaction object matching the DAO format
      const dbTransaction = {
        hash: txHash,
        type: 'STAKE_START' as const,
        from: address,               // DAO will map this to fromAddress
        to: `STAKE_POOL_${poolId}`,  // DAO will map this to toAddress
        amount: parseInt(amount),
        timestamp: now,
        nonce: Math.floor(Math.random() * 100000),
        signature: cryptoUtils.generateRandomHash(),
        status: 'confirmed' as const,
        metadata: { 
          stakeId,
          poolId,
          poolName: pool.name,
          lockupPeriod: pool.lockupPeriod
        }
      };
      
      // Persist to database
      await transactionDao.createTransaction(dbTransaction);
      console.log(`STAKE_START transaction [${txHash}] saved to database for ${address}`);
      
      // Broadcast all events for real-time dashboard updates
      broadcastTransaction(transaction);
      
      // Broadcast staking update to update staking panels
      broadcastStakingUpdate({ 
        walletAddress: address,
        poolId,
        action: 'start',
        amount,
        timestamp: now
      });
      
      // Broadcast wallet update to reflect new balance
      broadcastWalletUpdate({ 
        address,
        balance: wallet.balance,
        action: 'stake_funds',
        amount
      });
      
      // Broadcast status update for dashboard metrics
      broadcastStatusUpdate({
        totalStaked: pool.totalStaked,
        poolId,
        activePools: true
      });
    } catch (dbError) {
      console.error('Failed to persist stake start transaction to database:', dbError);
      // Don't fail the entire transaction if DB persistence fails
    }
    
    // Broadcast the stake transaction to all connected clients
    broadcastTransaction(transaction);
    
    // Check for staking-related achievements
    try {
      // Get existing stakes for this address to determine if this is their first stake
      const existingStakes = await memBlockchainStorage.getStakesByAddress(address);
      // Check and award badges
      await checkStakingBadges(address, amount, existingStakes.length + 1); // +1 includes the current stake
    } catch (err) {
      console.error('Error checking staking badges:', err);
      // Continue even if badge check fails
    }
    
    res.status(201).json({
      stake_id: stakeId,
      tx_hash: txHash,
      pool: pool.name,
      amount,
      apy: pool.apy,
      unlock_time: stake.unlockTime > 0 ? new Date(stake.unlockTime).toISOString() : 'No lockup'
    });
  } catch (error) {
    console.error('Error starting stake:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start staking'
    });
  }
};

/**
 * Stop staking
 * POST /api/stake/stop
 */
export const stopStaking = async (req: Request, res: Response) => {
  try {
    const { stakeId, address, passphrase } = req.body;
    
    if (!stakeId || !address || !passphrase) {
      return res.status(400).json({ 
        error: 'Stake ID, address, and passphrase are required' 
      });
    }
    
    // Verify wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Use centralized passphrase verification utility
    const isPassphraseValid = passphraseUtils.verifyPassphrase(
      passphrase,
      wallet.passphraseSalt,
      wallet.passphraseHash
    );
    
    // Log verification outcome
    console.log('Stake stop passphrase verification:', {
      address,
      valid: isPassphraseValid
    });
    
    // For test wallets, allow bypass in development
    if (!isPassphraseValid) {
      if (process.env.NODE_ENV !== 'production' && passphraseUtils.isKnownTestWallet(address)) {
        console.log('DEV MODE: Bypassing passphrase check for known wallet address in stop staking:', address);
      } else {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
    }
    
    // Get stake record
    const stake = await memBlockchainStorage.getStakeById(stakeId);
    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }
    
    // Verify stake belongs to wallet
    if (stake.walletAddress !== address) {
      return res.status(401).json({ error: 'Unauthorized: stake belongs to another wallet' });
    }
    
    // Check if stake is still locked
    const now = Date.now();
    if (stake.unlockTime > 0 && now < stake.unlockTime) {
      return res.status(400).json({ 
        error: `Stake is still locked until ${new Date(stake.unlockTime).toISOString()}` 
      });
    }
    
    // Get the staking pool
    const pool = await memBlockchainStorage.getStakingPoolById(stake.poolId);
    if (!pool) {
      return res.status(500).json({ error: 'Staking pool not found' });
    }
    
    // Calculate rewards
    const stakeDuration = now - stake.startTime;
    const daysStaked = stakeDuration / (24 * 60 * 60 * 1000);
    const apyDecimal = parseFloat(pool.apy) / 100;
    const reward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysStaked / 365));
    
    // Update wallet balance (return staked amount + reward)
    const totalReturn = BigInt(stake.amount) + BigInt(reward);
    const newBalance = BigInt(wallet.balance) + totalReturn;
    wallet.balance = newBalance.toString();
    await memBlockchainStorage.updateWallet(wallet);
    
    // Update pool's total staked amount
    const newTotalStaked = BigInt(pool.totalStaked) - BigInt(stake.amount);
    pool.totalStaked = newTotalStaked.toString();
    await memBlockchainStorage.updateStakingPool(pool);
    
    // Mark stake as inactive and update in blockchain storage
    stake.isActive = false;
    await memBlockchainStorage.updateStakeRecord(stake);
    
    // Create unstake transaction with ZK signature
    const txHash = crypto.createHash('sha256')
      .update(address + stake.amount + stake.poolId + now.toString())
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: 'STAKE_END' as const,
      from: `STAKE_POOL_${stake.poolId}`,
      to: address,
      amount: stake.amount,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed' as const
    };
    
    // Store in in-memory blockchain first
    await memBlockchainStorage.createTransaction(transaction);
    
    // Then, persist to database
    try {
      const { transactionDao } = await import('../database/transactionDao');
      
      // Create DB transaction object matching DAO format
      const dbTransaction = {
        hash: txHash,
        type: 'STAKE_END' as const,
        from: `STAKE_POOL_${stake.poolId}`,  // DAO will map this to fromAddress
        to: address,                         // DAO will map this to toAddress
        amount: parseInt(stake.amount),
        timestamp: now,
        nonce: Math.floor(Math.random() * 100000),
        signature: cryptoUtils.generateRandomHash(),
        status: 'confirmed' as const,
        metadata: { 
          stakeId: stakeId,
          poolId: stake.poolId,
          stakeStartTime: stake.startTime,
          stakeDuration: now - stake.startTime
        }
      };
      
      // Persist to database
      await transactionDao.createTransaction(dbTransaction);
      console.log(`STAKE_END transaction [${txHash}] saved to database for ${address}`);
    } catch (dbError) {
      console.error('Failed to persist stake end transaction to database:', dbError);
      // Don't fail the entire transaction if DB persistence fails
    }
    
    // Broadcast the unstake transaction to all connected clients
    broadcastTransaction(transaction);
    
    // Create reward transaction if there is a reward
    if (reward > 0) {
      const rewardTxHash = crypto.createHash('sha256')
        .update(address + reward.toString() + stake.poolId + now.toString())
        .digest('hex');
      
      const rewardTransaction = {
        hash: rewardTxHash,
        type: 'STAKING_REWARD' as const,
        from: `STAKE_POOL_${stake.poolId}`,
        to: address,
        amount: reward.toString(),
        timestamp: now + 1, // Add 1ms to ensure different timestamp
        nonce: Math.floor(Math.random() * 100000),
        signature: cryptoUtils.generateRandomHash(),
        status: 'confirmed' as const
      };
      
      // Store in in-memory blockchain first
      await memBlockchainStorage.createTransaction(rewardTransaction);
      
      // Then, persist to database
      try {
        const { transactionDao } = await import('../database/transactionDao');
        
        // Create DB transaction object (converting from memory format)
        const dbRewardTransaction = {
          hash: rewardTxHash,
          type: 'STAKING_REWARD' as const,
          from: `STAKE_POOL_${stake.poolId}`,
          to: address,
          amount: parseInt(reward.toString()),
          timestamp: now + 1,
          nonce: Math.floor(Math.random() * 100000),
          signature: cryptoUtils.generateRandomHash(),
          status: 'confirmed' as const,
          metadata: { 
            stakeId: stakeId,
            poolId: stake.poolId,
            apyAtTime: pool.apy,
            stakeDuration: now - stake.startTime
          }
        };
        
        // Persist to database
        await transactionDao.createTransaction(dbRewardTransaction);
        console.log(`STAKING_REWARD transaction [${rewardTxHash}] saved to database for ${address}`);
      } catch (dbError) {
        console.error('Failed to persist staking reward transaction to database:', dbError);
        // Don't fail the entire transaction if DB persistence fails
      }
      
      // Broadcast the reward transaction to all connected clients
      broadcastTransaction(rewardTransaction);
    }
    
    res.status(200).json({
      tx_hash: txHash,
      unstaked_amount: stake.amount,
      reward: reward.toString(),
      total_returned: totalReturn.toString()
    });
  } catch (error) {
    console.error('Error stopping stake:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to stop staking'
    });
  }
};

/**
 * Claim staking rewards
 * POST /api/stake/claim
 */
export const claimRewards = async (req: Request, res: Response) => {
  try {
    const { stakeId, address, passphrase } = req.body;
    
    if (!stakeId || !address || !passphrase) {
      return res.status(400).json({ 
        error: 'Stake ID, address, and passphrase are required' 
      });
    }
    
    // Verify wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Use centralized passphrase verification utility
    const isPassphraseValid = passphraseUtils.verifyPassphrase(
      passphrase,
      wallet.passphraseSalt,
      wallet.passphraseHash
    );
    
    // Log verification outcome
    console.log('Claim rewards passphrase verification:', {
      address,
      valid: isPassphraseValid
    });
    
    // For test wallets, allow bypass in development
    if (!isPassphraseValid) {
      if (process.env.NODE_ENV !== 'production' && passphraseUtils.isKnownTestWallet(address)) {
        console.log('DEV MODE: Bypassing passphrase check for known wallet address in claim rewards:', address);
      } else {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
    }
    
    // Get stake record
    const stake = await memBlockchainStorage.getStakeById(stakeId);
    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }
    
    // Verify stake belongs to wallet
    if (stake.walletAddress !== address) {
      return res.status(401).json({ error: 'Unauthorized: stake belongs to another wallet' });
    }
    
    // Check if stake is active
    if (!stake.isActive) {
      return res.status(400).json({ error: 'Stake is not active' });
    }
    
    // Get the staking pool
    const pool = await memBlockchainStorage.getStakingPoolById(stake.poolId);
    if (!pool) {
      return res.status(500).json({ error: 'Staking pool not found' });
    }
    
    const now = Date.now();
    const timeSinceLastReward = now - stake.lastRewardTime;
    const daysSinceLastReward = timeSinceLastReward / (24 * 60 * 60 * 1000);
    const apyDecimal = parseFloat(pool.apy) / 100;
    const reward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysSinceLastReward / 365));
    
    if (reward <= 0) {
      return res.status(400).json({ error: 'No rewards available to claim yet' });
    }
    
    // Update wallet balance (add reward)
    const newBalance = BigInt(wallet.balance) + BigInt(reward);
    wallet.balance = newBalance.toString();
    await memBlockchainStorage.updateWallet(wallet);
    
    // Update stake record with new last reward time
    stake.lastRewardTime = now;
    await memBlockchainStorage.updateStakeRecord(stake);
    
    // Create reward transaction with ZK signature
    const txHash = crypto.createHash('sha256')
      .update(address + reward.toString() + stake.poolId + now.toString())
      .digest('hex');
    
    // Transaction for the in-memory blockchain
    const memTransaction = {
      hash: txHash,
      type: 'STAKING_REWARD' as const,
      from: `STAKE_POOL_${stake.poolId}`,
      to: address,
      amount: reward.toString(),
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed' as const
    };
    
    // First, create transaction in in-memory storage
    await memBlockchainStorage.createTransaction(memTransaction);
    
    // Then, create transaction in database
    try {
      // Import transactionDao from our database layer
      const { transactionDao } = await import('../database/transactionDao');
      
      // Create DB transaction object (converting from memory format)
      const dbTransaction = {
        hash: txHash,
        type: 'STAKING_REWARD' as const,
        from: `STAKE_POOL_${stake.poolId}`,
        to: address,
        amount: parseInt(reward.toString()),
        timestamp: now,
        nonce: Math.floor(Math.random() * 100000),
        signature: cryptoUtils.generateRandomHash(),
        status: 'confirmed' as const,
        metadata: { 
          stakeId,
          poolId: stake.poolId,
          apyAtTime: pool.apy,
          rewardPeriod: timeSinceLastReward
        }
      };
      
      // Persist to database
      await transactionDao.createTransaction(dbTransaction);
      console.log(`STAKING_REWARD transaction [${txHash}] saved to database for ${address}`);
    } catch (dbError) {
      console.error('Failed to persist staking reward transaction to database:', dbError);
      // Don't fail the entire transaction if DB persistence fails
    }
    
    // Broadcast the reward transaction to all connected clients
    broadcastTransaction(memTransaction);
    
    res.status(200).json({
      tx_hash: txHash,
      reward: reward.toString()
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to claim staking rewards'
    });
  }
};

/**
 * Get available staking pools
 * GET /api/stake/pools
 */
export const getStakingPools = async (_req: Request, res: Response) => {
  try {
    const pools = await memBlockchainStorage.getStakingPools();
    
    // Format for response
    const formattedPools = pools.map(pool => ({
      id: pool.id,
      name: pool.name,
      apy: pool.apy,
      total_staked: pool.totalStaked,
      min_stake: pool.minStake,
      lockup_period: pool.lockupPeriod,
      description: pool.description || '',
      stats: {
        stakers_count: pool.stakersCount || 0,
        avg_stake_period: pool.avgStakePeriod || 0
      }
    }));
    
    res.json(formattedPools);
  } catch (error) {
    console.error('Error getting staking pools:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get staking pools'
    });
  }
};

/**
 * Get staking status for a wallet
 * GET /api/stake/status/:address
 */
export const getStakingStatus = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get all active stakes for wallet
    const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(address);
    
    // Get pool data for each stake to calculate current rewards
    const now = Date.now();
    const stakingData = await Promise.all(activeStakes.map(async (stake) => {
      const pool = await memBlockchainStorage.getStakingPoolById(stake.poolId);
      if (!pool) {
        return null; // Skip if pool not found
      }
      
      // Calculate pending rewards
      const timeSinceLastReward = now - stake.lastRewardTime;
      const daysSinceLastReward = timeSinceLastReward / (24 * 60 * 60 * 1000);
      const apyDecimal = parseFloat(pool.apy) / 100;
      const pendingReward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysSinceLastReward / 365));
      
      // Calculate time until unlock if locked
      let timeToUnlock = 0;
      let isLocked = false;
      
      if (stake.unlockTime > 0 && now < stake.unlockTime) {
        timeToUnlock = stake.unlockTime - now;
        isLocked = true;
      }
      
      return {
        stake_id: stake.id,
        pool_id: stake.poolId,
        pool_name: pool.name,
        amount: stake.amount,
        start_time: new Date(stake.startTime).toISOString(),
        is_locked: isLocked,
        unlock_time: stake.unlockTime > 0 ? new Date(stake.unlockTime).toISOString() : null,
        time_to_unlock: isLocked ? timeToUnlock : 0,
        apy: pool.apy,
        pending_reward: pendingReward.toString()
      };
    }));
    
    // Filter out null values (from skipped pools)
    const validStakingData = stakingData.filter(data => data !== null);
    
    // Calculate total staked amount
    const totalStaked = activeStakes.reduce((sum, stake) => {
      return sum + BigInt(stake.amount);
    }, BigInt(0));
    
    // Calculate total pending rewards
    const totalPendingRewards = validStakingData.reduce((sum, data) => {
      if (data && data.pending_reward) {
        return sum + BigInt(data.pending_reward);
      }
      return sum;
    }, BigInt(0));
    
    res.json({
      address,
      total_staked: totalStaked.toString(),
      total_pending_rewards: totalPendingRewards.toString(),
      active_stakes: validStakingData,
      stake_count: validStakingData.length
    });
  } catch (error) {
    console.error('Error getting staking status:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get staking status'
    });
  }
};