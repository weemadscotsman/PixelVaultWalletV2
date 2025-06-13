import crypto from 'crypto';
import { Transaction } from './types';
import { memBlockchainStorage } from './mem-blockchain';
import { transactionDao } from './database/transactionDao';
import { walletDao } from './database/walletDao';

/**
 * Transaction Engine - Handles transaction validation, nonce verification,
 * and signature verification for blockchain transactions
 */
export class TransactionEngine {
  /**
   * Verifies a transaction's signature and nonce
   */
  async verifyTransaction(transaction: Transaction): Promise<boolean> {
    // Get the sender's wallet
    let wallet = await walletDao.getWalletByAddress(transaction.fromAddress);
    
    if (!wallet) {
      console.error(`Wallet not found for address: ${transaction.fromAddress}`);
      return false;
    }
    
    // Verify the nonce
    if (!this.verifyNonce(transaction, wallet.nonce)) {
      console.error(`Invalid nonce for transaction from ${transaction.fromAddress}. Expected: ${wallet.nonce}, Got: ${transaction.nonce}`);
      return false;
    }
    
    // Verify the signature
    return await this.verifySignature(transaction); // Add await as verifySignature becomes async
  }
  
  /**
   * Process a transaction and store it in the database
   */
  async processTransaction(transaction: any): Promise<Transaction> {
    // Verify the transaction
    const isValid = await this.verifyTransaction(transaction);
    
    if (!isValid) {
      throw new Error('Transaction validation failed');
    }
    
    // Create the transaction with a proper hash and status
    const tx = {
      hash: transaction.hash,
      type: transaction.type,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      nonce: transaction.nonce,
      signature: transaction.signature,
      status: transaction.status || 'pending',
      blockHeight: transaction.blockHeight || undefined,
      fee: transaction.fee || null,
      metadata: transaction.metadata || {}
    };
    
    try {
      // Store in database
      const dbTx = await transactionDao.createTransaction(tx);

      // Increment the nonce for the sender's wallet in the database
      // This should only happen if the transaction is successfully saved to the DB
      let wallet = await walletDao.getWalletByAddress(transaction.fromAddress);
      if (wallet) {
        // Ensure nonce is treated as a number
        const currentNonce = typeof wallet.nonce === 'number' ? wallet.nonce : 0;
        await walletDao.updateWallet({
          ...wallet,
          nonce: currentNonce + 1
        });
      } else {
        // This case should ideally not be reached if verifyTransaction passed
        // and didn't find a wallet in the DB.
        // If it does, it indicates an inconsistency or a race condition.
        console.error(`CRITICAL: Wallet ${transaction.fromAddress} not found in DB after transaction save, but was present for verification.`);
        // Depending on desired behavior, could throw an error here or try to create/update.
        // For now, log critical error.
      }
      return dbTx;
    } catch (err) {
      console.error('Error saving transaction to database or updating wallet nonce:', err);
      // If database save or nonce update fails, throw an error.
      // Do not fall back to a memory-only transaction.
      throw new Error('Failed to process transaction due to database error.');
    }
  }
  
  /**
   * Verify the nonce value is valid for the transaction
   */
  private verifyNonce(transaction: Transaction, expectedNonce?: number): boolean {
    if (expectedNonce === undefined) return true; // Skip nonce check if not tracking nonces yet
    
    // Convert to number for comparison (if stored as string or bigint)
    const txNonce = Number(transaction.nonce);
    
    // Nonce should be exactly equal to the wallet's current nonce to prevent
    // replay attacks and ensure transaction ordering
    return txNonce === expectedNonce;
  }
  
  /**
   * Verify digital signature of a transaction
   */
  private async verifySignature(transaction: Transaction): Promise<boolean> { // Make async
    try {
      const wallet = await walletDao.getWalletByAddress(transaction.fromAddress);
      if (!wallet || !wallet.publicKey) {
        console.error(`Public key not found for address: ${transaction.fromAddress} during signature verification.`);
        return false;
      }
      const publicKey = wallet.publicKey;

      // Recreate the transaction data that was signed
      const txData = {
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        nonce: transaction.nonce,
        timestamp: transaction.timestamp
      };
      
      // Convert data to string for verification
      const dataString = JSON.stringify(txData);
      
      // Create the verification instance
      const verify = crypto.createVerify('SHA256');
      verify.update(dataString);
      
      // Verify signature (base64 encoded)
      return verify.verify(
        publicKey, 
        Buffer.from(transaction.signature, 'base64')
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Generate a transaction hash
   */
  generateTransactionHash(transaction: Partial<Transaction>): string {
    const txData = {
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      nonce: transaction.nonce,
      timestamp: transaction.timestamp
    };
    
    const dataString = JSON.stringify(txData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
}

// Create a singleton instance
export const transactionEngine = new TransactionEngine();