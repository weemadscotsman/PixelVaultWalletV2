import { eq } from 'drizzle-orm';
import { db } from './index';
import { wallets } from './schema';
import { Wallet } from '../mem-blockchain';

/**
 * Data access object for wallets
 */
export class WalletDao {
  /**
   * Create a new wallet
   * @param wallet Wallet to create
   * @returns Created wallet
   */
  async createWallet(wallet: Wallet): Promise<Wallet> {
    try {
      // Convert wallet to database format with snake_case field names to match DB schema
      const dbWallet = {
        address: wallet.address,
        public_key: wallet.publicKey,
        balance: wallet.balance,
        created_at: wallet.createdAt,
        last_updated: wallet.lastSynced, // Map lastSynced to last_updated
        passphrase_salt: wallet.passphraseSalt,
        passphrase_hash: wallet.passphraseHash,
      };

      // Insert wallet
      await db.insert(wallets).values(dbWallet);
      
      // Return original wallet
      return wallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Get wallet by address
   * @param address Wallet address
   * @returns Wallet or undefined if not found
   */
  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    try {
      const result = await db.select()
        .from(wallets)
        .where(eq(wallets.address, address))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to Wallet with snake_case to camelCase mapping
      const dbWallet = result[0];
      return {
        address: dbWallet.address,
        publicKey: dbWallet.public_key,
        balance: dbWallet.balance,
        createdAt: dbWallet.created_at,
        lastSynced: dbWallet.last_synced,
        passphraseSalt: dbWallet.passphrase_salt || undefined,
        passphraseHash: dbWallet.passphrase_hash || undefined,
      };
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      throw new Error('Failed to get wallet');
    }
  }

  /**
   * Update wallet
   * @param wallet Wallet to update
   * @returns Updated wallet
   */
  async updateWallet(wallet: Wallet): Promise<Wallet> {
    try {
      // Check if wallet exists
      const existingWallet = await this.getWalletByAddress(wallet.address);
      if (!existingWallet) {
        return this.createWallet(wallet);
      }
      
      // Convert wallet to database format with snake_case field names
      const dbWallet = {
        balance: wallet.balance,
        last_synced: wallet.lastSynced,
        passphrase_salt: wallet.passphraseSalt,
        passphrase_hash: wallet.passphraseHash,
      };

      // Update wallet
      await db.update(wallets)
        .set(dbWallet)
        .where(eq(wallets.address, wallet.address));
      
      // Return updated wallet
      return wallet;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw new Error('Failed to update wallet');
    }
  }

  /**
   * Get all wallets
   * @returns Array of wallets
   */
  async getAllWallets(): Promise<Wallet[]> {
    try {
      const result = await db.select().from(wallets);
      
      // Convert database format to Wallet[] with snake_case to camelCase mapping
      return result.map(dbWallet => ({
        address: dbWallet.address,
        publicKey: dbWallet.public_key,
        balance: dbWallet.balance,
        createdAt: dbWallet.created_at,
        lastSynced: dbWallet.last_synced,
        passphraseSalt: dbWallet.passphrase_salt || undefined,
        passphraseHash: dbWallet.passphrase_hash || undefined,
      }));
    } catch (error) {
      console.error('Error getting all wallets:', error);
      throw new Error('Failed to get wallets');
    }
  }

  /**
   * Update wallet balance
   * @param address Wallet address
   * @param balance New balance
   * @returns Updated wallet
   */
  async updateWalletBalance(address: string, balance: string): Promise<Wallet | undefined> {
    try {
      // Check if wallet exists
      const existingWallet = await this.getWalletByAddress(address);
      if (!existingWallet) {
        return undefined;
      }
      
      // Update wallet
      await db.update(wallets)
        .set({ 
          balance, 
          last_synced: new Date() 
        })
        .where(eq(wallets.address, address));
      
      // Return updated wallet
      return {
        ...existingWallet,
        balance,
        lastSynced: new Date()
      };
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw new Error('Failed to update wallet balance');
    }
  }

  /**
   * Delete wallet
   * @param address Wallet address
   * @returns Success status
   */
  async deleteWallet(address: string): Promise<boolean> {
    try {
      await db.delete(wallets)
        .where(eq(wallets.address, address));
      
      return true;
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw new Error('Failed to delete wallet');
    }
  }
}

// Create a singleton instance
export const walletDao = new WalletDao();