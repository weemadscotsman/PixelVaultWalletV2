import { eq, and, gt, desc } from 'drizzle-orm';
import { db } from './index';
import { drops, dropClaims } from './schema';
import { Drop, DropClaim } from '@shared/types';

/**
 * Data access object for drops and drop claims
 */
export class DropDao {
  /**
   * Create a new drop
   * @param drop Drop to create
   * @returns Created drop
   */
  async createDrop(drop: Drop): Promise<Drop> {
    try {
      // Convert drop to database format
      const dbDrop = {
        id: drop.id,
        name: drop.name,
        description: drop.description,
        type: drop.type,
        rarity: drop.rarity,
        imageUrl: drop.imageUrl,
        tokenAmount: drop.tokenAmount,
        createdAt: drop.createdAt,
        expiresAt: drop.expiresAt,
        claimLimit: drop.claimLimit,
        minWalletAge: drop.minWalletAge,
        minStakingAmount: drop.minStakingAmount,
        minMiningBlocks: drop.minMiningBlocks,
        securityScore: drop.securityScore
      };

      // Insert drop
      await db.insert(drops).values(dbDrop);
      
      // Return original drop
      return drop;
    } catch (error) {
      console.error('Error creating drop:', error);
      throw new Error('Failed to create drop');
    }
  }

  /**
   * Get drop by ID
   * @param id Drop ID
   * @returns Drop or undefined if not found
   */
  async getDropById(id: string): Promise<Drop | undefined> {
    try {
      const result = await db.select()
        .from(drops)
        .where(eq(drops.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to Drop
      const dbDrop = result[0];
      return {
        id: dbDrop.id,
        name: dbDrop.name,
        description: dbDrop.description,
        type: dbDrop.type,
        rarity: dbDrop.rarity,
        imageUrl: dbDrop.imageUrl,
        tokenAmount: dbDrop.tokenAmount ?? undefined,
        createdAt: dbDrop.createdAt,
        expiresAt: dbDrop.expiresAt,
        claimLimit: dbDrop.claimLimit,
        minWalletAge: dbDrop.minWalletAge,
        minStakingAmount: dbDrop.minStakingAmount,
        minMiningBlocks: dbDrop.minMiningBlocks,
        securityScore: dbDrop.securityScore
      };
    } catch (error) {
      console.error('Error getting drop by ID:', error);
      throw new Error('Failed to get drop');
    }
  }

  /**
   * Get all active drops
   * @returns Array of active drops
   */
  async getActiveDrops(): Promise<Drop[]> {
    try {
      const result = await db.select()
        .from(drops)
        .where(gt(drops.expiresAt, new Date()))
        .orderBy(desc(drops.createdAt));
      
      // Convert database format to Drop[]
      return result.map(dbDrop => ({
        id: dbDrop.id,
        name: dbDrop.name,
        description: dbDrop.description,
        type: dbDrop.type,
        rarity: dbDrop.rarity,
        imageUrl: dbDrop.imageUrl,
        tokenAmount: dbDrop.tokenAmount ?? undefined,
        createdAt: dbDrop.createdAt,
        expiresAt: dbDrop.expiresAt,
        claimLimit: dbDrop.claimLimit,
        minWalletAge: dbDrop.minWalletAge,
        minStakingAmount: dbDrop.minStakingAmount,
        minMiningBlocks: dbDrop.minMiningBlocks,
        securityScore: dbDrop.securityScore
      }));
    } catch (error) {
      console.error('Error getting active drops:', error);
      throw new Error('Failed to get active drops');
    }
  }

  /**
   * Check if a drop has been claimed by a wallet
   * @param dropId Drop ID
   * @param walletAddress Wallet address
   * @returns True if the drop has been claimed, false otherwise
   */
  async hasDropBeenClaimed(dropId: string, walletAddress: string): Promise<boolean> {
    try {
      const result = await db.select()
        .from(dropClaims)
        .where(
          and(
            eq(dropClaims.dropId, dropId),
            eq(dropClaims.walletAddress, walletAddress)
          )
        )
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking if drop has been claimed:', error);
      throw new Error('Failed to check if drop has been claimed');
    }
  }

  /**
   * Get the number of claims for a drop
   * @param dropId Drop ID
   * @returns Number of claims
   */
  async getDropClaimCount(dropId: string): Promise<number> {
    try {
      const result = await db.select({ count: db.fn.count() })
        .from(dropClaims)
        .where(eq(dropClaims.dropId, dropId));
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting drop claim count:', error);
      throw new Error('Failed to get drop claim count');
    }
  }

  /**
   * Claim a drop
   * @param dropId Drop ID
   * @param walletAddress Wallet address
   * @param transactionHash Optional transaction hash
   * @returns Created drop claim
   */
  async claimDrop(dropId: string, walletAddress: string, transactionHash?: string): Promise<DropClaim> {
    try {
      // Check if drop exists
      const drop = await this.getDropById(dropId);
      if (!drop) {
        throw new Error(`Drop not found: ${dropId}`);
      }
      
      // Check if drop has already been claimed
      const hasBeenClaimed = await this.hasDropBeenClaimed(dropId, walletAddress);
      if (hasBeenClaimed) {
        throw new Error('Drop has already been claimed by this wallet');
      }
      
      // Check if drop claim limit has been reached
      const claimCount = await this.getDropClaimCount(dropId);
      if (claimCount >= drop.claimLimit) {
        throw new Error('Drop claim limit has been reached');
      }
      
      // Check if drop has expired
      if (new Date() > drop.expiresAt) {
        throw new Error('Drop has expired');
      }
      
      // Create drop claim
      const dropClaim: DropClaim = {
        dropId,
        walletAddress,
        claimedAt: new Date(),
        transactionHash
      };
      
      // Convert drop claim to database format
      const dbDropClaim = {
        dropId: dropClaim.dropId,
        walletAddress: dropClaim.walletAddress,
        claimedAt: dropClaim.claimedAt,
        transactionHash: dropClaim.transactionHash
      };

      // Insert drop claim
      await db.insert(dropClaims).values(dbDropClaim);
      
      // Return drop claim
      return dropClaim;
    } catch (error) {
      console.error('Error claiming drop:', error);
      throw error;
    }
  }

  /**
   * Get drop claims by wallet address
   * @param walletAddress Wallet address
   * @returns Array of drop claims
   */
  async getDropClaimsByWallet(walletAddress: string): Promise<DropClaim[]> {
    try {
      const result = await db.select()
        .from(dropClaims)
        .where(eq(dropClaims.walletAddress, walletAddress))
        .orderBy(desc(dropClaims.claimedAt));
      
      // Convert database format to DropClaim[]
      return result.map(dbDropClaim => ({
        dropId: dbDropClaim.dropId,
        walletAddress: dbDropClaim.walletAddress,
        claimedAt: dbDropClaim.claimedAt,
        transactionHash: dbDropClaim.transactionHash ?? undefined
      }));
    } catch (error) {
      console.error('Error getting drop claims by wallet:', error);
      throw new Error('Failed to get drop claims');
    }
  }

  /**
   * Get drop claims by drop ID
   * @param dropId Drop ID
   * @returns Array of drop claims
   */
  async getDropClaimsByDropId(dropId: string): Promise<DropClaim[]> {
    try {
      const result = await db.select()
        .from(dropClaims)
        .where(eq(dropClaims.dropId, dropId))
        .orderBy(desc(dropClaims.claimedAt));
      
      // Convert database format to DropClaim[]
      return result.map(dbDropClaim => ({
        dropId: dbDropClaim.dropId,
        walletAddress: dbDropClaim.walletAddress,
        claimedAt: dbDropClaim.claimedAt,
        transactionHash: dbDropClaim.transactionHash ?? undefined
      }));
    } catch (error) {
      console.error('Error getting drop claims by drop ID:', error);
      throw new Error('Failed to get drop claims');
    }
  }

  /**
   * Update transaction hash for a drop claim
   * @param dropId Drop ID
   * @param walletAddress Wallet address
   * @param transactionHash Transaction hash
   * @returns Success status
   */
  async updateDropClaimTransactionHash(dropId: string, walletAddress: string, transactionHash: string): Promise<boolean> {
    try {
      await db.update(dropClaims)
        .set({ transactionHash })
        .where(
          and(
            eq(dropClaims.dropId, dropId),
            eq(dropClaims.walletAddress, walletAddress)
          )
        );
      
      return true;
    } catch (error) {
      console.error('Error updating drop claim transaction hash:', error);
      throw new Error('Failed to update drop claim transaction hash');
    }
  }
}

// Create a singleton instance
export const dropDao = new DropDao();