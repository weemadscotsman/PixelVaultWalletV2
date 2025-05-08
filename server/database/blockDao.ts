import { eq, desc, lte, gte, and } from 'drizzle-orm';
import { db } from './index';
import { blocks } from './schema';
import { Block } from '@shared/types';

/**
 * Data access object for blocks
 */
export class BlockDao {
  /**
   * Create a new block
   * @param block Block to create
   * @returns Created block
   */
  async createBlock(block: Block): Promise<Block> {
    try {
      // Convert block to database format
      const dbBlock = {
        height: block.height,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: BigInt(block.timestamp),
        nonce: BigInt(block.nonce),
        difficulty: block.difficulty,
        miner: block.miner,
        merkleRoot: block.merkleRoot,
        totalTransactions: block.totalTransactions,
        size: block.size,
      };

      // Insert block
      await db.insert(blocks).values(dbBlock);
      
      // Return original block
      return block;
    } catch (error) {
      console.error('Error creating block:', error);
      throw new Error('Failed to create block');
    }
  }

  /**
   * Get block by height
   * @param height Block height
   * @returns Block or null if not found
   */
  async getBlockByHeight(height: number): Promise<Block | null> {
    try {
      const result = await db.select()
        .from(blocks)
        .where(eq(blocks.height, height))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      // Convert database format to Block
      const dbBlock = result[0];
      return {
        height: dbBlock.height,
        hash: dbBlock.hash,
        previousHash: dbBlock.previousHash,
        timestamp: Number(dbBlock.timestamp),
        nonce: Number(dbBlock.nonce),
        difficulty: dbBlock.difficulty,
        miner: dbBlock.miner,
        merkleRoot: dbBlock.merkleRoot,
        totalTransactions: dbBlock.totalTransactions,
        size: dbBlock.size,
        transactions: [] // Transactions need to be loaded separately
      };
    } catch (error) {
      console.error('Error getting block by height:', error);
      throw new Error('Failed to get block');
    }
  }

  /**
   * Get block by hash
   * @param hash Block hash
   * @returns Block or null if not found
   */
  async getBlockByHash(hash: string): Promise<Block | null> {
    try {
      const result = await db.select()
        .from(blocks)
        .where(eq(blocks.hash, hash))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      // Convert database format to Block
      const dbBlock = result[0];
      return {
        height: dbBlock.height,
        hash: dbBlock.hash,
        previousHash: dbBlock.previousHash,
        timestamp: Number(dbBlock.timestamp),
        nonce: Number(dbBlock.nonce),
        difficulty: dbBlock.difficulty,
        miner: dbBlock.miner,
        merkleRoot: dbBlock.merkleRoot,
        totalTransactions: dbBlock.totalTransactions,
        size: dbBlock.size,
        transactions: [] // Transactions need to be loaded separately
      };
    } catch (error) {
      console.error('Error getting block by hash:', error);
      throw new Error('Failed to get block');
    }
  }

  /**
   * Get latest block
   * @returns Latest block or null if no blocks exist
   */
  async getLatestBlock(): Promise<Block | null> {
    try {
      const result = await db.select()
        .from(blocks)
        .orderBy(desc(blocks.height))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      // Convert database format to Block
      const dbBlock = result[0];
      return {
        height: dbBlock.height,
        hash: dbBlock.hash,
        previousHash: dbBlock.previousHash,
        timestamp: Number(dbBlock.timestamp),
        nonce: Number(dbBlock.nonce),
        difficulty: dbBlock.difficulty,
        miner: dbBlock.miner,
        merkleRoot: dbBlock.merkleRoot,
        totalTransactions: dbBlock.totalTransactions,
        size: dbBlock.size,
        transactions: [] // Transactions need to be loaded separately
      };
    } catch (error) {
      console.error('Error getting latest block:', error);
      throw new Error('Failed to get latest block');
    }
  }

  /**
   * Get recent blocks
   * @param limit Maximum number of blocks to return
   * @returns Array of blocks
   */
  async getRecentBlocks(limit: number = 10): Promise<Block[]> {
    try {
      const result = await db.select()
        .from(blocks)
        .orderBy(desc(blocks.height))
        .limit(limit);
      
      // Convert database format to Block[]
      return result.map(dbBlock => ({
        height: dbBlock.height,
        hash: dbBlock.hash,
        previousHash: dbBlock.previousHash,
        timestamp: Number(dbBlock.timestamp),
        nonce: Number(dbBlock.nonce),
        difficulty: dbBlock.difficulty,
        miner: dbBlock.miner,
        merkleRoot: dbBlock.merkleRoot,
        totalTransactions: dbBlock.totalTransactions,
        size: dbBlock.size,
        transactions: [] // Transactions need to be loaded separately
      }));
    } catch (error) {
      console.error('Error getting recent blocks:', error);
      throw new Error('Failed to get blocks');
    }
  }

  /**
   * Get blocks in height range
   * @param startHeight Start height (inclusive)
   * @param endHeight End height (inclusive)
   * @returns Array of blocks
   */
  async getBlocksByHeightRange(startHeight: number, endHeight: number): Promise<Block[]> {
    try {
      const result = await db.select()
        .from(blocks)
        .where(
          and(
            gte(blocks.height, startHeight),
            lte(blocks.height, endHeight)
          )
        )
        .orderBy(desc(blocks.height));
      
      // Convert database format to Block[]
      return result.map(dbBlock => ({
        height: dbBlock.height,
        hash: dbBlock.hash,
        previousHash: dbBlock.previousHash,
        timestamp: Number(dbBlock.timestamp),
        nonce: Number(dbBlock.nonce),
        difficulty: dbBlock.difficulty,
        miner: dbBlock.miner,
        merkleRoot: dbBlock.merkleRoot,
        totalTransactions: dbBlock.totalTransactions,
        size: dbBlock.size,
        transactions: [] // Transactions need to be loaded separately
      }));
    } catch (error) {
      console.error('Error getting blocks by height range:', error);
      throw new Error('Failed to get blocks');
    }
  }

  /**
   * Get blocks by miner
   * @param minerAddress Miner address
   * @param limit Maximum number of blocks to return
   * @returns Array of blocks
   */
  async getBlocksByMiner(minerAddress: string, limit: number = 10): Promise<Block[]> {
    try {
      const result = await db.select()
        .from(blocks)
        .where(eq(blocks.miner, minerAddress))
        .orderBy(desc(blocks.height))
        .limit(limit);
      
      // Convert database format to Block[]
      return result.map(dbBlock => ({
        height: dbBlock.height,
        hash: dbBlock.hash,
        previousHash: dbBlock.previousHash,
        timestamp: Number(dbBlock.timestamp),
        nonce: Number(dbBlock.nonce),
        difficulty: dbBlock.difficulty,
        miner: dbBlock.miner,
        merkleRoot: dbBlock.merkleRoot,
        totalTransactions: dbBlock.totalTransactions,
        size: dbBlock.size,
        transactions: [] // Transactions need to be loaded separately
      }));
    } catch (error) {
      console.error('Error getting blocks by miner:', error);
      throw new Error('Failed to get blocks');
    }
  }

  /**
   * Get total block count
   * @returns Total number of blocks
   */
  async getTotalBlockCount(): Promise<number> {
    try {
      const result = await db.select({
          count: db.fn.count(blocks.height)
        })
        .from(blocks);
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting total block count:', error);
      throw new Error('Failed to get total block count');
    }
  }
}

// Create a singleton instance
export const blockDao = new BlockDao();