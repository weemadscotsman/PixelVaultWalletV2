import { IStorage } from "../storage";
import { Transaction, TransactionType } from "@shared/types";
import { verifySignature } from "../utils/crypto";
import { generateZkProof, verifyZkProof } from "../utils/zkproof";

export class WalletService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Create a new wallet
   */
  async createWallet(address: string, initialBalance: number = 0): Promise<any> {
    // Check if wallet already exists
    const existingWallet = await this.storage.getWalletByAddress(address);
    if (existingWallet) {
      return existingWallet;
    }
    
    // Create the wallet with initial balance
    return this.storage.createWallet(address, initialBalance);
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string): Promise<number> {
    return this.storage.getWalletBalance(address);
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(address: string): Promise<Transaction[]> {
    return this.storage.getTransactionsByAddress(address);
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    note?: string,
    type: TransactionType = TransactionType.TRANSFER
  ): Promise<Transaction> {
    // Verify sender has sufficient balance
    if (type === TransactionType.TRANSFER) {
      const balance = await this.storage.getWalletBalance(fromAddress);
      if (balance < amount) {
        throw new Error("Insufficient balance for transaction");
      }
    }
    
    // Create transaction
    const transaction: Omit<Transaction, 'id'> = {
      type,
      fromAddress,
      toAddress,
      amount,
      timestamp: new Date(),
      note: note || '',
      hash: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    };
    
    // In a real implementation, we would:
    // 1. Verify the transaction signature
    // 2. Generate and verify zkSNARK proofs for privacy
    // 3. Execute the transaction on the blockchain
    
    return this.storage.createTransaction(transaction);
  }

  /**
   * Verify a transaction's signature and zkSNARK proof
   */
  async verifyTransaction(
    transaction: Omit<Transaction, 'id'>,
    signature: string,
    zkProof: string
  ): Promise<boolean> {
    // Verify signature
    const isSignatureValid = verifySignature(
      JSON.stringify(transaction),
      signature,
      transaction.fromAddress
    );
    
    if (!isSignatureValid) {
      return false;
    }
    
    // Verify zkSNARK proof
    const isProofValid = verifyZkProof(
      zkProof,
      {
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount
      }
    );
    
    return isProofValid;
  }
}
