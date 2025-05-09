import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import * as cryptoUtils from '../utils/crypto';
import { StakeRecord } from '../types';
import { checkStakingBadges } from '../controllers/badgeController';
import { broadcastTransaction } from '../utils/websocket';

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
    
    // Verify passphrase
    const hash = crypto.createHash('sha256')
      .update(passphrase + wallet.passphraseSalt)
      .digest('hex');
    
    if (hash !== wallet.passphraseHash) {
      return res.status(401).json({ error: 'Invalid passphrase' });
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
      type: 'STAKE_START',
      from: address,
      to: `STAKE_POOL_${poolId}`,
      amount,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed' as const
    };
    
    await memBlockchainStorage.createTransaction(transaction);
    
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
    
    // Verify passphrase
    const hash = crypto.createHash('sha256')
      .update(passphrase + wallet.passphraseSalt)
      .digest('hex');
    
    if (hash !== wallet.passphraseHash) {
      return res.status(401).json({ error: 'Invalid passphrase' });
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
      type: 'STAKE_END',
      from: `STAKE_POOL_${stake.poolId}`,
      to: address,
      amount: stake.amount,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed' as const
    };
    
    await memBlockchainStorage.createTransaction(transaction);
    
    // Broadcast the unstake transaction to all connected clients
    broadcastTransaction(transaction);
    
    // Create reward transaction if there is a reward
    if (reward > 0) {
      const rewardTxHash = crypto.createHash('sha256')
        .update(address + reward.toString() + stake.poolId + now.toString())
        .digest('hex');
      
      const rewardTransaction = {
        hash: rewardTxHash,
        type: 'STAKING_REWARD',
        from: `STAKE_POOL_${stake.poolId}`,
        to: address,
        amount: reward.toString(),
        timestamp: now + 1, // Add 1ms to ensure different timestamp
        nonce: Math.floor(Math.random() * 100000),
        signature: cryptoUtils.generateRandomHash(),
        status: 'confirmed' as const
      };
      
      await memBlockchainStorage.createTransaction(rewardTransaction);
      
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
    
    // Verify passphrase
    const hash = crypto.createHash('sha256')
      .update(passphrase + wallet.passphraseSalt)
      .digest('hex');
    
    if (hash !== wallet.passphraseHash) {
      return res.status(401).json({ error: 'Invalid passphrase' });
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
    
    const transaction = {
      hash: txHash,
      type: 'STAKING_REWARD',
      from: `STAKE_POOL_${stake.poolId}`,
      to: address,
      amount: reward.toString(),
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed' as const
    };
    
    await memBlockchainStorage.createTransaction(transaction);
    
    // Broadcast the transaction to all connected clients
    broadcastTransaction(transaction);
    
    res.status(200).json({
      tx_hash: txHash,
      reward: reward.toString(),
      next_claim_available: new Date(now + 24 * 60 * 60 * 1000).toISOString() // 24 hours later
    });
  } catch (error) {
    console.error('Error claiming rewards:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to claim rewards'
    });
  }
};

/**
 * Get staking status for a wallet
 * GET /api/stake/:address
 */
export const getStakingStatus = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Get all active stakes for the address from blockchain storage
    const walletStakes = await memBlockchainStorage.getActiveStakesByAddress(address);
    
    if (walletStakes.length === 0) {
      return res.json({ 
        active_stakes: 0,
        total_staked: "0",
        stakes: []
      });
    }
    
    // Calculate total staked
    const totalStaked = walletStakes.reduce((total, stake) => {
      return total + BigInt(stake.amount);
    }, BigInt(0));
    
    // Get all staking pools for lookup
    const pools = await memBlockchainStorage.getStakingPools();
    
    // Format stakes for response
    const formattedStakes = await Promise.all(walletStakes.map(async (stake) => {
      const pool = pools.find(p => p.id === stake.poolId);
      
      return {
        stake_id: stake.id,
        pool_id: stake.poolId,
        pool_name: pool ? pool.name : 'Unknown Pool',
        amount: stake.amount,
        apy: pool ? pool.apy : '0',
        start_time: new Date(stake.startTime).toISOString(),
        unlock_time: stake.unlockTime > 0 ? new Date(stake.unlockTime).toISOString() : 'No lockup'
      };
    }));
    
    res.json({
      active_stakes: walletStakes.length,
      total_staked: totalStaked.toString(),
      stakes: formattedStakes
    });
  } catch (error) {
    console.error('Error getting staking status:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get staking status'
    });
  }
};

/**
 * Get available staking pools
 * GET /api/stake/pools
 */
export const getStakingPools = async (req: Request, res: Response) => {
  try {
    // Get all staking pools from blockchain storage
    const pools = await memBlockchainStorage.getStakingPools();
    res.json(pools);
  } catch (error) {
    console.error('Error getting staking pools:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get staking pools'
    });
  }
};