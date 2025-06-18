// Use queryClient from './index' (server/database/index.ts) for standard PostgreSQL connection
import { queryClient } from './index'; // Corrected import

interface WalletRecord {
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
  salt: string;
}

export async function createWallet({
  address,
  publicKey,
  encryptedPrivateKey,
  salt
}: WalletRecord): Promise<void> {
  console.log('[walletDao] Attempting to save wallet:', { address, publicKeyOmitted: '...', salt });
  try {
    // Using sql tagged template from postgres.js
    const result = await queryClient`
      INSERT INTO wallets (address, public_key, encrypted_private_key, salt, created_at)
      VALUES (${address}, ${publicKey}, ${encryptedPrivateKey}, ${salt}, NOW())
      RETURNING address`;
    if (result.count > 0) {
      console.log('[walletDao] Wallet saved successfully, address:', result[0].address);
    } else {
      // This case should ideally not happen if RETURNING is used and insert is successful
      console.warn('[walletDao] Wallet insert did not return an address.');
    }
  } catch (error) {
    console.error('[walletDao] Error saving wallet:', error);
    throw error;
  }
}

export async function getWalletByAddress(address: string): Promise<WalletRecord | null> {
  console.log('[walletDao] Attempting to get wallet by address:', address);
  try {
    const result = await queryClient`
      SELECT address, public_key, encrypted_private_key, salt
      FROM wallets
      WHERE address = ${address}`;

    if (result.count === 0) {
      console.log('[walletDao] Wallet not found for address:', address);
      return null;
    }
    console.log('[walletDao] Wallet found for address:', address);
    // postgres.js returns objects directly matching column names
    return {
        address: result[0].address,
        publicKey: result[0].public_key,
        encryptedPrivateKey: result[0].encrypted_private_key,
        salt: result[0].salt,
    };
  } catch (error) {
    console.error('[walletDao] Error getting wallet by address:', address, error);
    throw error;
  }
}
