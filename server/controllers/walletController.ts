import { Request, Response } from 'express';
import crypto from 'crypto';
import * as cryptoUtils from '../utils/crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { walletDao } from '../database/walletDao';
import { transactionDao } from '../database/transactionDao';

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
    
    // Check if wallet already exists in database
    const existingWallet = await walletDao.getWalletByAddress(address);
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet with this address already exists' });
    }
    
    // Wallet data to insert
    const walletData = {
      address,
      publicKey,
      balance: "1000000", // 1 PVX initial balance for testing
      createdAt: new Date(),
      lastUpdated: new Date(),
      passphraseSalt: salt,
      passphraseHash: hash
    };
    
    // Create wallet in database
    const wallet = await walletDao.createWallet(walletData);
    
    // Also create in memory storage for backup
    await memBlockchainStorage.createWallet(walletData);
    
    console.log('Created new wallet:', address);
    
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
    
    // Check if wallet already exists in database
    const existingWallet = await walletDao.getWalletByAddress(address);
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet already exists' });
    }
    
    // Create wallet in database
    await walletDao.createWallet({
      address,
      publicKey,
      balance: "1000000", // 1 PVX initial balance for testing
      createdAt: new Date(),
      lastUpdated: new Date(),
      passphraseSalt: salt,
      passphraseHash
    });
    
    console.log('Imported wallet:', address);
    
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
    
    // Try to get the wallet from DB first
    let wallet = await walletDao.getWalletByAddress(address);
    
    // If not found in DB, try memory storage
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(address);
    }
    
    // If still not found, return 404
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    res.json({
      address: wallet.address,
      publicKey: wallet.publicKey,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      lastUpdated: wallet.lastUpdated
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
    
    // Try to get the wallet from DB first
    let wallet = await walletDao.getWalletByAddress(address);
    
    // If not found in DB, try memory storage
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(address);
    }
    
    // If still not found, return 404
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
      if (pool && pool.apy) {
        const lastRewardTime = stake.lastRewardTime || stake.lastRewardClaim || stake.startTime || Date.now();
        const timeSinceLastReward = now - lastRewardTime;
        const daysSinceLastReward = timeSinceLastReward / (24 * 60 * 60 * 1000);
        const apyDecimal = parseFloat(pool.apy) / 100;
        const reward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysSinceLastReward / 365));
        pendingRewards += BigInt(reward);
      }
    }
    
    // Get reward transactions
    const transactions = await memBlockchainStorage.getTransactionsByAddress(address);
    const rewardTxs = transactions.filter(tx => 
      tx.type === 'STAKING_REWARD' && tx.to === address
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
    
    // Try to get the wallet from DB first
    let wallet = await walletDao.getWalletByAddress(address);
    
    // If not found in DB, try memory storage
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(address);
    }
    
    // If still not found, return 404
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
      lastSynced: wallet.lastUpdated || new Date() // Use lastUpdated instead of lastSynced
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
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    
    // Try to get the wallet from DB first
    let wallet = await walletDao.getWalletByAddress(address);
    
    // If not found in DB, try memory storage
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(address);
    }
    
    // If still not found, return 404
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get transactions involving this wallet from database first
    let transactions = await transactionDao.getTransactionsByAddress(address, limit, offset);
    
    // If no transactions in DB, try memory storage
    if (!transactions || transactions.length === 0) {
      const memTransactions = await memBlockchainStorage.getTransactionsByAddress(address);
      if (memTransactions && memTransactions.length > 0) {
        transactions = memTransactions.slice(offset, offset + limit);
      }
    }
    
    // Format transaction history with consistent property names
    const txHistory = transactions.map(tx => ({
      hash: tx.hash,
      type: tx.type,
      amount: tx.amount,
      timestamp: new Date(tx.timestamp).toISOString(),
      from: tx.from,
      to: tx.to,
      fee: tx.fee || 0,
      nonce: tx.nonce,
      signature: tx.signature,
      status: tx.status,
      block_height: tx.blockHeight,
      metadata: tx.metadata
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
/**
 * Send a transaction
 * POST /api/wallet/send
 */
export const sendTransaction = async (req: Request, res: Response) => {
  try {
    const { from, to, amount, passphrase, note, signature, nonce } = req.body;
    
    // Basic field validation
    if (!from || !to || !amount || !passphrase) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Transaction must include from, to, amount, and passphrase'
      });
    }
    
    // Get sender wallet - try DB first, then memory storage
    let sender = await walletDao.getWalletByAddress(from);
    if (!sender) {
      sender = await memBlockchainStorage.getWalletByAddress(from);
    }
    if (!sender) {
      return res.status(404).json({ error: 'Sender wallet not found' });
    }
    
    // Get recipient wallet - try DB first, then memory storage
    let recipient = await walletDao.getWalletByAddress(to);
    if (!recipient) {
      recipient = await memBlockchainStorage.getWalletByAddress(to);
    }
    
    // Verify passphrase
    const hash = crypto.createHash('sha256')
      .update(passphrase + sender.passphraseSalt)
      .digest('hex');
    
    if (hash !== sender.passphraseHash) {
      return res.status(401).json({ error: 'Invalid passphrase' });
    }
    
    // Verify sufficient balance
    const amountBigInt = BigInt(amount);
    const balanceBigInt = BigInt(sender.balance);
    
    if (amountBigInt > balanceBigInt) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Generate a transaction hash
    const txHash = crypto.createHash('sha256')
      .update(`${from}${to}${amount}${Date.now()}`)
      .digest('hex');
    
    // Current nonce or 0 if not set
    const currentNonce = sender.nonce || 0;
    
    // Create transaction with proper signature and nonce
    const tx: any = {
      hash: txHash,
      from,
      to,
      amount: Number(amount),
      fee: 10, // Fixed fee
      timestamp: Date.now(),
      type: 'TRANSFER',
      status: 'pending',
      blockHeight: null,
      nonce: currentNonce + 1, // Increment nonce
      signature: signature || hash, // Use provided signature or hash
      metadata: { note: note || '' }
    };
    
    try {
      // Import transaction engine
      const { commitTransaction } = require('../transaction-engine');
      
      // This will validate signature, nonce, and commit transaction
      await commitTransaction(tx);
      
      // If commit succeeded, update balances
      sender.balance = (balanceBigInt - amountBigInt).toString();
      sender.nonce = currentNonce + 1;
      await walletDao.updateWallet(sender);
      
      if (recipient) {
        const recipientBalanceBigInt = BigInt(recipient.balance);
        recipient.balance = (recipientBalanceBigInt + amountBigInt).toString();
        await walletDao.updateWallet(recipient);
        await memBlockchainStorage.updateWallet(recipient);
      }
      
      // Update transaction status to confirmed
      tx.status = 'confirmed';
      if (tx.metadata) {
        tx.metadata.confirmations = 1;
      } else {
        tx.metadata = { confirmations: 1 };
      }
      await memBlockchainStorage.updateTransaction(tx);
      
      res.status(201).json({
        hash: tx.hash,
        from,
        to,
        amount,
        timestamp: tx.timestamp,
        status: tx.status,
        nonce: tx.nonce
      });
    } catch (error) {
      console.error('Transaction validation failed:', error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Transaction validation failed',
        txHash
      });
    }
  } catch (error) {
    console.error('Error sending transaction:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send transaction'
    });
  }
};

export const getStakingInfo = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Try to get the wallet from DB first
    let wallet = await walletDao.getWalletByAddress(address);
    
    // If not found in DB, try memory storage
    if (!wallet) {
      wallet = await memBlockchainStorage.getWalletByAddress(address);
    }
    
    // If still not found, return 404
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
      const lastRewardTime = stake.lastRewardTime || stake.lastRewardClaim || stake.startTime || Date.now();
      const timeSinceLastReward = now - lastRewardTime;
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
        unlock_time: stake.unlockTime && stake.unlockTime > 0 ? new Date(stake.unlockTime).toISOString() : 'No lockup',
        pending_reward: pendingReward.toString(),
        last_reward_time: lastRewardTime ? new Date(lastRewardTime).toISOString() : new Date(stake.startTime).toISOString()
      };
    }));
    
    // Get reward transactions
    const transactions = await memBlockchainStorage.getTransactionsByAddress(address);
    const stakesTxs = transactions.filter(tx => 
      ['STAKE', 'UNSTAKE', 'STAKING_REWARD'].includes(tx.type) && 
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