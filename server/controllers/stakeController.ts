import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import * as cryptoUtils from '../utils/crypto';
import { TransactionType } from '@shared/types';

// Simulate staking pools
const stakingPools = [
  {
    id: 'pool1',
    name: 'Genesis Pool',
    apy: '8.5',
    totalStaked: '1500000000',
    minStake: '10000',
    lockupPeriod: 0 // No lockup
  },
  {
    id: 'pool2',
    name: 'Hodler Pool',
    apy: '12.0',
    totalStaked: '750000000',
    minStake: '100000',
    lockupPeriod: 7 // 7 days
  },
  {
    id: 'pool3',
    name: 'Validator Pool',
    apy: '15.0',
    totalStaked: '350000000',
    minStake: '1000000',
    lockupPeriod: 30 // 30 days
  }
];

// In-memory staking records
const stakingRecords = new Map();

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
    const pool = stakingPools.find(p => p.id === poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Staking pool not found' });
    }
    
    // Check minimum stake
    if (BigInt(amount) < BigInt(pool.minStake)) {
      return res.status(400).json({ 
        error: `Minimum stake for this pool is ${pool.minStake} μPVX` 
      });
    }
    
    // Create staking record
    const stakeId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const stake = {
      id: stakeId,
      address,
      poolId,
      amount,
      startTime: now,
      unlockTime: pool.lockupPeriod > 0 ? now + (pool.lockupPeriod * 24 * 60 * 60 * 1000) : 0,
      lastRewardTime: now,
      isActive: true
    };
    
    stakingRecords.set(stakeId, stake);
    
    // Update wallet balance (remove staked amount)
    const newBalance = BigInt(wallet.balance) - BigInt(amount);
    wallet.balance = newBalance.toString();
    await memBlockchainStorage.updateWallet(wallet);
    
    // Create stake transaction
    const txHash = crypto.createHash('sha256')
      .update(address + amount + poolId + now.toString())
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.STAKE,
      from: address,
      to: `STAKE_POOL_${poolId}`,
      amount,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed'
    };
    
    await memBlockchainStorage.createTransaction(transaction);
    
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
    const stake = stakingRecords.get(stakeId);
    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }
    
    // Verify stake belongs to wallet
    if (stake.address !== address) {
      return res.status(401).json({ error: 'Unauthorized: stake belongs to another wallet' });
    }
    
    // Check if stake is still locked
    const now = Date.now();
    if (stake.unlockTime > 0 && now < stake.unlockTime) {
      return res.status(400).json({ 
        error: `Stake is still locked until ${new Date(stake.unlockTime).toISOString()}` 
      });
    }
    
    // Calculate rewards
    const pool = stakingPools.find(p => p.id === stake.poolId);
    if (!pool) {
      return res.status(500).json({ error: 'Staking pool not found' });
    }
    
    const stakeDuration = now - stake.startTime;
    const daysStaked = stakeDuration / (24 * 60 * 60 * 1000);
    const apyDecimal = parseFloat(pool.apy) / 100;
    const reward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysStaked / 365));
    
    // Update wallet balance (return staked amount + reward)
    const totalReturn = BigInt(stake.amount) + BigInt(reward);
    const newBalance = BigInt(wallet.balance) + totalReturn;
    wallet.balance = newBalance.toString();
    await memBlockchainStorage.updateWallet(wallet);
    
    // Mark stake as inactive
    stake.isActive = false;
    stakingRecords.set(stakeId, stake);
    
    // Create unstake transaction
    const txHash = crypto.createHash('sha256')
      .update(address + stake.amount + stake.poolId + now.toString())
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.UNSTAKE,
      from: `STAKE_POOL_${stake.poolId}`,
      to: address,
      amount: stake.amount,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed'
    };
    
    await memBlockchainStorage.createTransaction(transaction);
    
    // Create reward transaction if there is a reward
    if (reward > 0) {
      const rewardTxHash = crypto.createHash('sha256')
        .update(address + reward.toString() + stake.poolId + now.toString())
        .digest('hex');
      
      const rewardTransaction = {
        hash: rewardTxHash,
        type: TransactionType.REWARD,
        from: `STAKE_POOL_${stake.poolId}`,
        to: address,
        amount: reward.toString(),
        timestamp: now + 1, // Add 1ms to ensure different timestamp
        nonce: Math.floor(Math.random() * 100000),
        signature: cryptoUtils.generateRandomHash(),
        status: 'confirmed'
      };
      
      await memBlockchainStorage.createTransaction(rewardTransaction);
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
    const stake = stakingRecords.get(stakeId);
    if (!stake) {
      return res.status(404).json({ error: 'Stake not found' });
    }
    
    // Verify stake belongs to wallet
    if (stake.address !== address) {
      return res.status(401).json({ error: 'Unauthorized: stake belongs to another wallet' });
    }
    
    // Check if stake is active
    if (!stake.isActive) {
      return res.status(400).json({ error: 'Stake is not active' });
    }
    
    // Calculate rewards
    const pool = stakingPools.find(p => p.id === stake.poolId);
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
    stakingRecords.set(stakeId, stake);
    
    // Create reward transaction
    const txHash = crypto.createHash('sha256')
      .update(address + reward.toString() + stake.poolId + now.toString())
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.REWARD,
      from: `STAKE_POOL_${stake.poolId}`,
      to: address,
      amount: reward.toString(),
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'confirmed'
    };
    
    await memBlockchainStorage.createTransaction(transaction);
    
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
    
    // Get all stakes for the address
    const walletStakes = Array.from(stakingRecords.values())
      .filter(stake => stake.address === address && stake.isActive);
    
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
    
    // Format stakes for response
    const formattedStakes = walletStakes.map(stake => {
      const pool = stakingPools.find(p => p.id === stake.poolId);
      
      return {
        stake_id: stake.id,
        pool_id: stake.poolId,
        pool_name: pool ? pool.name : 'Unknown Pool',
        amount: stake.amount,
        apy: pool ? pool.apy : '0',
        start_time: new Date(stake.startTime).toISOString(),
        unlock_time: stake.unlockTime > 0 ? new Date(stake.unlockTime).toISOString() : 'No lockup'
      };
    });
    
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
    res.json(stakingPools);
  } catch (error) {
    console.error('Error getting staking pools:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get staking pools'
    });
  }
};