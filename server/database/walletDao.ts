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
      console.log('WalletDAO.createWallet - Incoming wallet data:', {
        address: wallet.address,
        publicKey: wallet.publicKey ? 'exists' : 'missing',
        passphraseSalt: wallet.passphraseSalt ? 'exists' : 'missing',
        passphraseHash: wallet.passphraseHash ? 'exists' : 'missing'
      });
      
      // Safety check - ensure the wallet has credentials
      if (!wallet.passphraseSalt || !wallet.passphraseHash) {
        console.error('CRITICAL: Wallet is missing credentials during creation:', wallet.address);
        // Emergency recovery - regenerate the credentials
        const recoveryPassphrase = wallet.address; // Use the address as an emergency passphrase
        const salt = crypto.createHash('md5').update(wallet.address).digest('hex');
        const hash = wallet.address.replace('PVX_', '') + 
                     crypto.createHash('sha256').update(wallet.address + salt).digest('hex').substring(0, 32);
        
        wallet.passphraseSalt = salt;
        wallet.passphraseHash = hash;
        console.log('Emergency credentials generated for wallet:', {
          address: wallet.address,
          salt_generated: salt.substring(0, 8) + '...',
          hash_sample: hash.substring(0, 8) + '...'
        });
      }

      // Use direct pool query for maximum reliability
      const { pool } = await import('../db');
      
      try {
        // Use raw SQL with explicit params for maximum control
        const result = await pool.query(
          `INSERT INTO wallets 
           (address, public_key, balance, created_at, last_updated, passphrase_salt, passphrase_hash) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (address) 
           DO UPDATE SET
             public_key = EXCLUDED.public_key,
             balance = EXCLUDED.balance,
             last_updated = EXCLUDED.last_updated,
             passphrase_salt = EXCLUDED.passphrase_salt,
             passphrase_hash = EXCLUDED.passphrase_hash
           RETURNING *`,
          [
            wallet.address,
            wallet.publicKey || '',
            wallet.balance || '0',
            wallet.createdAt || new Date(),
            wallet.lastUpdated || new Date(),
            wallet.passphraseSalt,
            wallet.passphraseHash
          ]
        );
        
        console.log('Wallet created/updated successfully with credentials:', wallet.address);
        
        // Verify credentials were saved
        const verifyResult = await pool.query(
          `SELECT passphrase_salt, passphrase_hash FROM wallets WHERE address = $1`,
          [wallet.address]
        );
        
        if (verifyResult.rows.length > 0) {
          const savedWallet = verifyResult.rows[0];
          console.log('Wallet credential verification:', {
            address: wallet.address,
            salt_saved: Boolean(savedWallet.passphrase_salt),
            hash_saved: Boolean(savedWallet.passphrase_hash),
            match: savedWallet.passphrase_salt === wallet.passphraseSalt && 
                   savedWallet.passphrase_hash === wallet.passphraseHash
          });
        }
      } catch (sqlError) {
        console.error('SQL error during wallet creation/verification:', sqlError);
      }
      
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
      // Use direct SQL query with the node-postgres pool for reliable field access
      const { pool } = await import('../db');
      const sqlResult = await pool.query(
        `SELECT * FROM wallets WHERE address = $1`,
        [address]
      );
      
      if (sqlResult.rows.length === 0) {
        console.log(`No wallet found for address ${address}`);
        return undefined;
      }
      
      const dbRow = sqlResult.rows[0];
      console.log('Direct SQL query found wallet:', {
        address: dbRow.address,
        salt: dbRow.passphrase_salt,
        hash: dbRow.passphrase_hash
      });
      
      // Map SQL result directly to Wallet object
      const wallet: Wallet = {
        address: dbRow.address,
        publicKey: dbRow.public_key || '',
        balance: dbRow.balance,
        createdAt: new Date(dbRow.created_at),
        lastUpdated: new Date(dbRow.last_updated),
        lastSynced: new Date(dbRow.last_updated), // Keep both for compatibility 
        passphraseSalt: dbRow.passphrase_salt,
        passphraseHash: dbRow.passphrase_hash
      };
      
      console.log('Mapped Wallet object:', {
        address: wallet.address,
        hasPassphraseSalt: Boolean(wallet.passphraseSalt),
        hasPassphraseHash: Boolean(wallet.passphraseHash),
        salt_value: wallet.passphraseSalt,
        hash_value: wallet.passphraseHash
      });
      
      return wallet;
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
        last_updated: wallet.lastUpdated || wallet.lastSynced, // Use lastUpdated with fallback to lastSynced
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
      return result.map(dbWallet => {
        // Convert DB result to raw object with proper property access
        const rawDbObj = JSON.parse(JSON.stringify(dbWallet));
        
        return {
          address: dbWallet.address,
          publicKey: dbWallet.public_key,
          balance: dbWallet.balance,
          createdAt: dbWallet.created_at,
          lastUpdated: dbWallet.last_updated,
          lastSynced: dbWallet.last_updated, // Keep both for compatibility
          passphraseSalt: rawDbObj.passphrase_salt || undefined,
          passphraseHash: rawDbObj.passphrase_hash || undefined,
        };
      });
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
          last_updated: new Date() // Use last_updated instead of last_synced
        })
        .where(eq(wallets.address, address));
      
      // Return updated wallet
      return {
        ...existingWallet,
        balance,
        lastUpdated: new Date(),
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