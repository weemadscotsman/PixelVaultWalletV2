import { walletDao } from './database/walletDao';
import { transactionDao } from './database/transactionDao';
import { memBlockchainStorage } from './mem-blockchain';
import crypto from 'crypto';
import * as cryptoUtils from './utils/cryptoUtils';

export async function commitTransaction(tx: any): Promise<void> {
  // ① - Nonce check (replay-attack blocker)
  const sender = await walletDao.getWalletByAddress(tx.from);
  if (!sender) throw new Error('Unknown sender wallet');

  // Ensure tx.nonce is treated as a number
  const txNonce = typeof tx.nonce === 'string' ? parseInt(tx.nonce) : tx.nonce;
  const expectedNonce = (sender.nonce || 0) + 1;
  
  if (txNonce !== expectedNonce) {
    throw new Error(`Invalid nonce. Expected ${expectedNonce}`);
  }

  // ② - Signature check (authenticity)
  // Create a signature verification payload (without the signature field)
  const signaturePayload = {
    ...tx,
    signature: undefined
  };
  
  const ok = cryptoUtils.verifySignature(
    JSON.stringify(signaturePayload),
    tx.signature,
    sender.publicKey
  );
  
  if (!ok) {
    throw new Error('Invalid transaction signature');
  }

  // ③ - Record transaction and update sender's nonce in both DB and memory storage
  try {
    // Create transaction in DB
    await transactionDao.createTransaction({
      hash: tx.hash,
      type: tx.type,
      fromAddress: tx.from,
      toAddress: tx.to,
      amount: tx.amount,
      timestamp: tx.timestamp,
      nonce: txNonce,
      signature: tx.signature,
      status: tx.status || 'pending',
      blockHeight: tx.blockHeight,
      fee: tx.fee || 0,
      metadata: tx.metadata || {}
    });
    
    // Create transaction in memory storage
    await memBlockchainStorage.createTransaction(tx);
    
    // Update sender's nonce
    await walletDao.updateWallet({
      ...sender,
      nonce: txNonce,
      lastUpdated: new Date()
    });
    
    // Update sender in memory storage too
    const memSender = await memBlockchainStorage.getWalletByAddress(tx.from);
    if (memSender) {
      await memBlockchainStorage.updateWallet({
        ...memSender,
        nonce: txNonce,
        lastUpdated: new Date()
      });
    }
    
    // Update balances
    // This should be moved to a separate function that handles balance transfers
    
  } catch (error) {
    console.error('Transaction commit error:', error);
    throw new Error('Failed to commit transaction');
  }
}