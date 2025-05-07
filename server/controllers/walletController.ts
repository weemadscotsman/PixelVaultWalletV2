import { Request, Response } from 'express';
import crypto from 'crypto';
import * as cryptoUtils from '../utils/crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { TransactionType } from '@shared/types';

/**
 * Create a new wallet
 * POST /api/wallet/create
 */
export const createWallet = async (req: Request, res: Response) => {
  try {
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
    // Generate wallet using cryptoUtils
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256')
      .update(passphrase + salt)
      .digest('hex');
    
    // Generate address from hash
    const address = 'PVX_' + hash.substring(0, 32);
    
    // Generate public key (simplified for demo)
    const publicKey = crypto.createHash('sha256')
      .update(address)
      .digest('hex');
    
    // Create wallet in storage
    await memBlockchainStorage.createWallet({
      address,
      publicKey,
      balance: "1000000", // 1 PVX initial balance for testing
      createdAt: new Date(),
      lastSynced: new Date(),
      passphraseSalt: salt,
      passphraseHash: hash
    });
    
    res.status(201).json({
      address,
      pubkey: publicKey,
      mnemonic: null // Not implemented yet
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create wallet'
    });
  }
};

/**
 * Import an existing wallet
 * POST /api/wallet/import
 */
export const importWallet = async (req: Request, res: Response) => {
  try {
    const { privateKey, passphrase } = req.body;
    
    if (!privateKey || !passphrase) {
      return res.status(400).json({ error: 'Private key and passphrase are required' });
    }
    
    // In a real implementation, we would derive the public key and address from the private key
    // For now, simulate by using a hash of the private key
    const hash = crypto.createHash('sha256')
      .update(privateKey)
      .digest('hex');
    
    const address = 'PVX_' + hash.substring(0, 32);
    const publicKey = crypto.createHash('sha256')
      .update(address)
      .digest('hex');
    
    // Generate salt and passphrase hash
    const salt = crypto.randomBytes(16).toString('hex');
    const passphraseHash = crypto.createHash('sha256')
      .update(passphrase + salt)
      .digest('hex');
    
    // Check if wallet already exists
    const existingWallet = await memBlockchainStorage.getWalletByAddress(address);
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet already exists' });
    }
    
    // Create wallet in storage
    await memBlockchainStorage.createWallet({
      address,
      publicKey,
      balance: "1000000", // 1 PVX initial balance for testing
      createdAt: new Date(),
      lastSynced: new Date(),
      passphraseSalt: salt,
      passphraseHash
    });
    
    res.status(201).json({
      address,
      pubkey: publicKey
    });
  } catch (error) {
    console.error('Error importing wallet:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import wallet'
    });
  }
};

/**
 * Get wallet info
 * GET /api/wallet/:address
 */
export const getWallet = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    res.json({
      address: wallet.address,
      publicKey: wallet.publicKey,
      balance: wallet.balance,
      createdAt: wallet.createdAt
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get wallet'
    });
  }
};

/**
 * Get wallet balance
 * GET /api/wallet/:address/balance
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get active stakes for this wallet
    const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(address);
    
    // Calculate total staked
    const totalStaked = activeStakes.reduce((total, stake) => {
      return total + BigInt(stake.amount);
    }, BigInt(0));
    
    // Calculate pending rewards
    let pendingRewards = BigInt(0);
    const now = Date.now();
    
    for (const stake of activeStakes) {
      const pool = await memBlockchainStorage.getStakingPoolById(stake.poolId);
      if (pool) {
        const timeSinceLastReward = now - stake.lastRewardTime;
        const daysSinceLastReward = timeSinceLastReward / (24 * 60 * 60 * 1000);
        const apyDecimal = parseFloat(pool.apy) / 100;
        const reward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysSinceLastReward / 365));
        pendingRewards += BigInt(reward);
      }
    }
    
    // Get reward transactions
    const transactions = await memBlockchainStorage.getTransactionsByAddress(address);
    const rewardTxs = transactions.filter(tx => 
      tx.type === TransactionType.REWARD && tx.to === address
    );
    
    // Calculate claimed rewards
    const claimedRewards = rewardTxs.reduce((total, tx) => {
      return total + BigInt(tx.amount);
    }, BigInt(0));
    
    res.json({
      balance: wallet.balance,
      staked: totalStaked.toString(),
      pending_rewards: pendingRewards.toString(),
      claimed_rewards: claimedRewards.toString(),
      active_stakes: activeStakes.length
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get wallet balance'
    });
  }
};

/**
 * Export wallet keys
 * POST /api/wallet/:address/export
 */
export const exportWalletKeys = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
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
    
    // In a real implementation, we would decrypt the private key
    // For now, simulate by generating a deterministic private key
    const privateKey = crypto.createHash('sha256')
      .update(wallet.address + wallet.passphraseHash)
      .digest('hex');
    
    res.json({
      publicKey: wallet.publicKey,
      privateKey
    });
  } catch (error) {
    console.error('Error exporting wallet keys:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to export wallet keys'
    });
  }
};

/**
 * Get all wallets
 * GET /api/wallet/all
 */
export const getAllWallets = async (req: Request, res: Response) => {
  try {
    // Get wallets from storage
    const wallets = Array.from(memBlockchainStorage.wallets.values());
    
    // Map to response format
    const walletsResponse = wallets.map(wallet => ({
      address: wallet.address,
      publicKey: wallet.publicKey,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      lastSynced: wallet.lastSynced
    }));
    
    res.json(walletsResponse);
  } catch (error) {
    console.error('Error getting all wallets:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get wallets'
    });
  }
};

/**
 * Get transaction history for a wallet
 * GET /api/wallet/history/:address
 */
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get transactions involving this wallet
    const transactions = await memBlockchainStorage.getTransactionsByAddress(address);
    
    // Format transaction history
    const txHistory = transactions.map(tx => ({
      hash: tx.hash,
      type: tx.type,
      amount: tx.amount,
      timestamp: new Date(tx.timestamp).toISOString(),
      from: tx.from,
      to: tx.to,
      fee: tx.fee,
      note: tx.note,
      status: tx.status
    }));
    
    // Sort by timestamp (newest first)
    txHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json(txHistory);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transaction history'
    });
  }
};

/**
 * Get staking information for a wallet
 * GET /api/wallet/:address/staking
 */
export const getStakingInfo = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const wallet = await memBlockchainStorage.getWalletByAddress(address);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get active stakes for this wallet
    const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(address);
    
    // Get all pools for reference
    const pools = await memBlockchainStorage.getStakingPools();
    
    // Calculate total staked and format stake information
    const totalStaked = activeStakes.reduce((total, stake) => {
      return total + BigInt(stake.amount);
    }, BigInt(0));
    
    // Format detailed stake information
    const stakesInfo = await Promise.all(activeStakes.map(async (stake) => {
      const pool = pools.find(p => p.id === stake.poolId);
      
      // Calculate pending rewards for this stake
      const now = Date.now();
      const timeSinceLastReward = now - stake.lastRewardTime;
      const daysSinceLastReward = timeSinceLastReward / (24 * 60 * 60 * 1000);
      const apyDecimal = parseFloat(pool?.apy || "0") / 100;
      const pendingReward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysSinceLastReward / 365));
      
      return {
        stake_id: stake.id,
        pool_id: stake.poolId,
        pool_name: pool?.name || 'Unknown Pool',
        amount: stake.amount,
        apy: pool?.apy || '0',
        start_time: new Date(stake.startTime).toISOString(),
        unlock_time: stake.unlockTime > 0 ? new Date(stake.unlockTime).toISOString() : 'No lockup',
        pending_reward: pendingReward.toString(),
        last_reward_time: new Date(stake.lastRewardTime).toISOString()
      };
    }));
    
    // Get reward transactions
    const transactions = await memBlockchainStorage.getTransactionsByAddress(address);
    const stakesTxs = transactions.filter(tx => 
      [TransactionType.STAKE, TransactionType.UNSTAKE, TransactionType.REWARD].includes(tx.type) && 
      (tx.to === address || tx.from === address)
    );
    
    // Format transaction history
    const txHistory = stakesTxs.map(tx => ({
      tx_hash: tx.hash,
      type: tx.type,
      amount: tx.amount,
      timestamp: new Date(tx.timestamp).toISOString(),
      from: tx.from,
      to: tx.to
    }));
    
    res.json({
      address: wallet.address,
      total_staked: totalStaked.toString(),
      active_stakes: stakesInfo,
      transaction_history: txHistory
    });
  } catch (error) {
    console.error('Error getting staking info:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get staking information'
    });
  }
};