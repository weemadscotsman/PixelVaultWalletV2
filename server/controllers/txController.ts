import { Request, Response } from 'express';
import crypto from 'crypto';
import { transactionDao } from '../database/transactionDao';
import { walletDao } from '../database/walletDao';
import * as cryptoUtils from '../utils/crypto'; // Will be used for hash generation if kept here
import * as passphraseUtils from '../utils/passphrase';
import { TransactionType, Transaction } from '../types'; // Assuming Transaction type is from shared types
import { transactionEngine } from '../transaction-engine';
import { checkTransactionBadges } from './badgeController';
import { broadcastTransaction } from '../utils/websocket';

/**
 * Send transaction
 * POST /api/tx/send
 */
export const sendTransaction = async (req: Request, res: Response) => {
  try {
    // Updated to expect nonce and signature from client
    const { from, to, amount, passphrase, memo, nonce, signature } = req.body;
    
    if (!from || !to || !amount || !passphrase || nonce === undefined || !signature) {
      return res.status(400).json({ 
        error: 'From address, to address, amount, passphrase, nonce, and signature are required'
      });
    }
    
    // Verify sender wallet exists using walletDao
    const wallet = await walletDao.getWalletByAddress(from);
    if (!wallet) {
      return res.status(404).json({ error: 'Sender wallet not found' });
    }
    
    // Use centralized passphrase verification utility
    const isPassphraseValid = passphraseUtils.verifyPassphrase(
      passphrase,
      wallet.passphraseSalt,
      wallet.passphraseHash
    );
    
    // Log verification outcome
    console.log('Transaction send passphrase verification:', {
      address: from,
      valid: isPassphraseValid
    });
    
    // For test wallets, allow bypass in development
    if (!isPassphraseValid) {
      if (process.env.NODE_ENV !== 'production' && passphraseUtils.isKnownTestWallet(from)) {
        console.log('DEV MODE: Bypassing passphrase check for known wallet address in transaction:', from);
      } else {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
    }
    
    // Check balance (important to do this before calling the engine,
    // though engine might also do a check if not trusting upstream)
    if (BigInt(wallet.balance) < BigInt(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Construct transaction object for the engine
    // The hash can be generated here or by the engine. Let's generate it here for now.
    const timestamp = Date.now();
    const txHash = crypto.createHash('sha256')
      .update(from + to + amount.toString() + timestamp.toString() + nonce.toString())
      .digest('hex');

    const transactionToProcess: any = { // Use 'any' for now if Transaction type is strict
      hash: txHash,
      type: 'TRANSFER' as TransactionType,
      fromAddress: from, // transactionEngine expects fromAddress
      toAddress: to,     // transactionEngine expects toAddress
      amount: String(amount), // Ensure amount is a string or number as expected by engine
      timestamp,
      nonce: Number(nonce), // Ensure nonce is a number
      signature,
      status: 'pending', // Engine will manage status changes
      metadata: { memo: memo || '' }
    };

    // Process transaction using the transaction engine
    const processedTx = await transactionEngine.processTransaction(transactionToProcess);
    
    // Broadcast processed transaction via WebSocket for real-time updates
    try {
      broadcastTransaction(processedTx);
    } catch (err) {
      console.error('Error broadcasting transaction via WebSocket:', err);
      // Continue even if WebSocket broadcast fails
    }
    
    // Check for transaction-related achievements
    try {
      // Get transaction count for this sender from the database
      const senderTxs = await transactionDao.getTransactionsByAddress(from);
      // Check and award badges
      // Note: checkTransactionBadges might need processedTx.amount if it's a number
      await checkTransactionBadges(from, String(processedTx.amount), senderTxs.length);
    } catch (err) {
      console.error('Error checking transaction badges:', err);
      // Continue even if badge check fails
    }
    
    res.status(201).json({ 
      tx_hash: processedTx.hash,
      status: processedTx.status
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
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    
    // Check if wallet exists
    const wallet = await walletDao.getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // Get transactions from database for address
    const transactions = await transactionDao.getTransactionsByAddress(address, limit, offset);
    
    // Format for response with consistent property names
    const formattedTxs = transactions.map(tx => ({
      tx_type: tx.type,
      amount: tx.amount,
      to: tx.to,
      from: tx.from,
      timestamp: tx.timestamp,
      hash: tx.hash,
      nonce: tx.nonce,
      status: tx.status,
      fee: tx.fee || 0,
      block_height: tx.blockHeight
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
    
    // Get transaction by hash from the database
    const transaction = await transactionDao.getTransactionByHash(hash);
    
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
      signature: transaction.signature,
      status: transaction.status,
      block_height: transaction.blockHeight,
      fee: transaction.fee || 0,
      metadata: transaction.metadata
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
    
    // Get recent transactions from database
    const transactions = await transactionDao.getRecentTransactions(limit);
    
    // Format for response
    const formattedTxs = transactions.map(tx => ({
      tx_type: tx.type,
      amount: tx.amount,
      to: tx.to,
      from: tx.from,
      timestamp: tx.timestamp,
      hash: tx.hash,
      nonce: tx.nonce,
      status: tx.status,
      fee: tx.fee || 0,
      block_height: tx.blockHeight
    }));
    
    res.json(formattedTxs);
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get recent transactions'
    });
  }
};