import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import * as cryptoUtils from '../utils/crypto';
import { TransactionType } from '@shared/types';

/**
 * Send transaction
 * POST /api/tx/send
 */
export const sendTransaction = async (req: Request, res: Response) => {
  try {
    const { from, to, amount, passphrase, memo } = req.body;
    
    if (!from || !to || !amount || !passphrase) {
      return res.status(400).json({ 
        error: 'From address, to address, amount, and passphrase are required' 
      });
    }
    
    // Verify sender wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(from);
    if (!wallet) {
      return res.status(404).json({ error: 'Sender wallet not found' });
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
    
    // Create transaction
    const timestamp = Date.now();
    const txHash = crypto.createHash('sha256')
      .update(from + to + amount + timestamp.toString())
      .digest('hex');
    
    const transaction: Transaction = {
      hash: txHash,
      type: TransactionType.TRANSFER,
      from,
      to,
      amount,
      timestamp,
      nonce: Math.floor(Math.random() * 100000),
      signature: cryptoUtils.generateRandomHash(),
      status: 'pending'
    };
    
    // Update sender wallet balance
    const senderBalance = BigInt(wallet.balance) - BigInt(amount);
    wallet.balance = senderBalance.toString();
    await memBlockchainStorage.updateWallet(wallet);
    
    // Add to or create receiver wallet
    const receiverWallet = await memBlockchainStorage.getWalletByAddress(to);
    if (receiverWallet) {
      const receiverBalance = BigInt(receiverWallet.balance) + BigInt(amount);
      receiverWallet.balance = receiverBalance.toString();
      await memBlockchainStorage.updateWallet(receiverWallet);
    } else {
      // Create receiver wallet if it doesn't exist
      await memBlockchainStorage.createWallet({
        address: to,
        publicKey: cryptoUtils.generateRandomHash(),
        balance: amount,
        createdAt: new Date(),
        lastSynced: new Date(),
        passphraseSalt: '',
        passphraseHash: ''
      });
    }
    
    // Store transaction
    await memBlockchainStorage.createTransaction(transaction);
    
    res.status(201).json({ 
      tx_hash: txHash, 
      status: 'success' 
    });
  } catch (error) {
    console.error('Error sending transaction:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send transaction'
    });
  }
};

/**
 * Get transaction history for wallet
 * GET /api/tx/history/:address
 */
export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    // Get transactions for address
    const transactions = await memBlockchainStorage.getTransactionsByAddress(address);
    
    // Format for response
    const formattedTxs = transactions.map(tx => ({
      tx_type: tx.type,
      amount: tx.amount,
      to: tx.to,
      from: tx.from,
      timestamp: tx.timestamp,
      hash: tx.hash
    }));
    
    res.json(formattedTxs);
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transaction history'
    });
  }
};

/**
 * Get transaction details
 * GET /api/tx/:hash
 */
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    
    // Get transaction by hash
    const transaction = await memBlockchainStorage.getTransactionByHash(hash);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      hash: transaction.hash,
      type: transaction.type,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      nonce: transaction.nonce,
      status: transaction.status
    });
  } catch (error) {
    console.error('Error getting transaction details:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transaction details'
    });
  }
};

/**
 * Get recent transactions
 * GET /api/tx/recent
 */
export const getRecentTransactions = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    
    // Get recent transactions
    const transactions = await memBlockchainStorage.getRecentTransactions(limit);
    
    // Format for response
    const formattedTxs = transactions.map(tx => ({
      tx_type: tx.type,
      amount: tx.amount,
      to: tx.to,
      from: tx.from,
      timestamp: tx.timestamp,
      hash: tx.hash
    }));
    
    res.json(formattedTxs);
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get recent transactions'
    });
  }
};