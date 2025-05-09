import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from './index';
import { transactions } from './schema';
import { Transaction, TransactionType } from '@shared/types';

/**
 * Data access object for transactions
 */
export class TransactionDao {
  /**
   * Create a new transaction
   * @param transaction Transaction to create
   * @returns Created transaction
   */
  async createTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      // Convert transaction to database format with camelCase field names to match DB schema
      const dbTransaction = {
        hash: transaction.hash,
        type: transaction.type,
        fromAddress: transaction.from,
        toAddress: transaction.to,
        amount: BigInt(transaction.amount),
        timestamp: BigInt(transaction.timestamp),
        nonce: BigInt(transaction.nonce),
        signature: transaction.signature,
        status: transaction.status,
        blockHeight: transaction.blockHeight,
        fee: transaction.fee ? BigInt(transaction.fee) : null,
        metadata: transaction.metadata ? transaction.metadata : null,
      };

      // Insert transaction
      await db.insert(transactions).values(dbTransaction);
      
      // Return original transaction
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Get transaction by hash
   * @param hash Transaction hash
   * @returns Transaction or null if not found
   */
  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.hash, hash))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      // Convert database format to Transaction with camelCase mapping
      const dbTx = result[0];
      return {
        hash: dbTx.hash,
        type: dbTx.type as TransactionType,
        from: dbTx.fromAddress,
        to: dbTx.toAddress,
        amount: Number(dbTx.amount),
        timestamp: Number(dbTx.timestamp),
        nonce: Number(dbTx.nonce),
        signature: dbTx.signature,
        status: dbTx.status as 'pending' | 'confirmed' | 'failed',
        blockHeight: dbTx.blockHeight || undefined,
        fee: dbTx.fee ? Number(dbTx.fee) : undefined,
        metadata: dbTx.metadata || undefined,
      };
    } catch (error) {
      console.error('Error getting transaction by hash:', error);
      throw new Error('Failed to get transaction');
    }
  }

  /**
   * Get transactions by address (sent or received)
   * @param address Wallet address
   * @param limit Maximum number of transactions to return
   * @param offset Offset for pagination
   * @returns Array of transactions
   */
  async getTransactionsByAddress(address: string, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(
          sql`${transactions.fromAddress} = ${address} OR ${transactions.toAddress} = ${address}`
        )
        .orderBy(desc(transactions.timestamp))
        .limit(limit)
        .offset(offset);
      
      // Convert database format to Transaction[] with snake_case to camelCase mapping
      return result.map(dbTx => ({
        hash: dbTx.hash,
        type: dbTx.type as TransactionType,
        from: dbTx.fromAddress,
        to: dbTx.toAddress,
        amount: Number(dbTx.amount),
        timestamp: Number(dbTx.timestamp),
        nonce: Number(dbTx.nonce),
        signature: dbTx.signature,
        status: dbTx.status as 'pending' | 'confirmed' | 'failed',
        blockHeight: dbTx.blockHeight || undefined,
        fee: dbTx.fee ? Number(dbTx.fee) : undefined,
        metadata: dbTx.metadata || undefined,
      }));
    } catch (error) {
      console.error('Error getting transactions by address:', error);
      throw new Error('Failed to get transactions');
    }
  }

  /**
   * Get transactions by block height
   * @param blockHeight Block height
   * @returns Array of transactions
   */
  async getTransactionsByBlockHeight(blockHeight: number): Promise<Transaction[]> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.blockHeight, blockHeight))
        .orderBy(desc(transactions.timestamp));
      
      // Convert database format to Transaction[] with snake_case to camelCase mapping
      return result.map(dbTx => ({
        hash: dbTx.hash,
        type: dbTx.type as TransactionType,
        from: dbTx.fromAddress,
        to: dbTx.toAddress,
        amount: Number(dbTx.amount),
        timestamp: Number(dbTx.timestamp),
        nonce: Number(dbTx.nonce),
        signature: dbTx.signature,
        status: dbTx.status as 'pending' | 'confirmed' | 'failed',
        blockHeight: dbTx.blockHeight || undefined,
        fee: dbTx.fee ? Number(dbTx.fee) : undefined,
        metadata: dbTx.metadata || undefined,
      }));
    } catch (error) {
      console.error('Error getting transactions by block height:', error);
      throw new Error('Failed to get transactions');
    }
  }

  /**
   * Update transaction status
   * @param hash Transaction hash
   * @param status New status
   * @param blockHeight Optional block height for confirmed transactions
   * @returns Updated transaction
   */
  async updateTransactionStatus(hash: string, status: 'pending' | 'confirmed' | 'failed', blockHeight?: number): Promise<Transaction | null> {
    try {
      const updateData: any = { status };
      if (blockHeight !== undefined) {
        updateData.blockHeight = blockHeight;
      }
      
      await db.update(transactions)
        .set(updateData)
        .where(eq(transactions.hash, hash));
      
      // Return updated transaction
      return this.getTransactionByHash(hash);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw new Error('Failed to update transaction');
    }
  }

  /**
   * Get recent transactions
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions
   */
  async getRecentTransactions(limit: number = 20): Promise<Transaction[]> {
    try {
      const result = await db.select()
        .from(transactions)
        .orderBy(desc(transactions.timestamp))
        .limit(limit);
      
      // Convert database format to Transaction[] with camelCase mapping
      return result.map(dbTx => ({
        hash: dbTx.hash,
        type: dbTx.type as TransactionType,
        from: dbTx.fromAddress,
        to: dbTx.toAddress,
        amount: Number(dbTx.amount),
        timestamp: Number(dbTx.timestamp),
        nonce: Number(dbTx.nonce),
        signature: dbTx.signature,
        status: dbTx.status as 'pending' | 'confirmed' | 'failed',
        blockHeight: dbTx.blockHeight || undefined,
        fee: dbTx.fee ? Number(dbTx.fee) : undefined,
        metadata: dbTx.metadata || undefined,
      }));
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw new Error('Failed to get transactions');
    }
  }

  /**
   * Get transaction count by type in time range
   * @param type Transaction type
   * @param startTime Start timestamp
   * @param endTime End timestamp
   * @returns Transaction count
   */
  async getTransactionCountByType(type: TransactionType, startTime: number, endTime: number): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, type),
            sql`${transactions.timestamp} >= ${BigInt(startTime)}`,
            sql`${transactions.timestamp} <= ${BigInt(endTime)}`
          )
        );
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting transaction count by type:', error);
      throw new Error('Failed to get transaction count');
    }
  }

  /**
   * Get total transaction count
   * @returns Total transaction count
   */
  async getTotalTransactionCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` })
        .from(transactions);
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting total transaction count:', error);
      throw new Error('Failed to get transaction count');
    }
  }

  /**
   * Get pending transactions
   * @returns Array of pending transactions
   */
  async getPendingTransactions(): Promise<Transaction[]> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.status, 'pending'))
        .orderBy(desc(transactions.timestamp));
      
      // Convert database format to Transaction[] with camelCase mapping
      return result.map(dbTx => ({
        hash: dbTx.hash,
        type: dbTx.type as TransactionType,
        from: dbTx.fromAddress,
        to: dbTx.toAddress,
        amount: Number(dbTx.amount),
        timestamp: Number(dbTx.timestamp),
        nonce: Number(dbTx.nonce),
        signature: dbTx.signature,
        status: 'pending',
        blockHeight: dbTx.blockHeight || undefined,
        fee: dbTx.fee ? Number(dbTx.fee) : undefined,
        metadata: dbTx.metadata || undefined,
      }));
    } catch (error) {
      console.error('Error getting pending transactions:', error);
      throw new Error('Failed to get pending transactions');
    }
  }
}

// Create a singleton instance
export const transactionDao = new TransactionDao();