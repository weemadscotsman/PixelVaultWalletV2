import { IStorage } from "../storage";
import { sha3VariantHash } from "../utils/crypto";

/**
 * Service for managing secret drops and Thringlets
 */
export class DropsService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Get all available secret drops
   */
  async getSecretDrops(): Promise<any[]> {
    try {
      return this.storage.getSecretDrops();
    } catch (error) {
      console.error("Error fetching secret drops:", error);
      throw new Error("Failed to fetch secret drops");
    }
  }

  /**
   * Get a secret drop by code
   */
  async getSecretDropByCode(code: string): Promise<any | undefined> {
    try {
      return this.storage.getSecretDropByCode(code);
    } catch (error) {
      console.error("Error fetching secret drop by code:", error);
      throw new Error("Failed to fetch secret drop");
    }
  }

  /**
   * Create a new secret drop
   */
  async createSecretDrop(
    name: string,
    description: string,
    tier: string,
    reward: number,
    expiresAt: Date,
    imageUrl?: string
  ): Promise<any> {
    try {
      // Generate a unique code for the drop
      const timestamp = Date.now().toString();
      const baseCode = `${name.substring(0, 4).toUpperCase()}${Math.floor(Math.random() * 10000)}`;
      const codeHash = sha3VariantHash(baseCode + timestamp).substring(0, 12).toUpperCase();
      
      // Create drop object
      const drop = {
        name,
        description,
        tier,
        reward, // in μPVX (micro-PVX)
        code: codeHash,
        claimable: true,
        expiresAt,
        imageUrl,
        claimedBy: []
      };
      
      return this.storage.createSecretDrop(drop);
    } catch (error) {
      console.error("Error creating secret drop:", error);
      throw new Error("Failed to create secret drop");
    }
  }

  /**
   * Claim a secret drop
   */
  async claimSecretDrop(code: string, address: string): Promise<any> {
    try {
      // Get the drop
      const drop = await this.storage.getSecretDropByCode(code);
      
      if (!drop) {
        throw new Error("Secret drop not found");
      }
      
      if (!drop.claimable) {
        throw new Error("Secret drop is not claimable");
      }
      
      if (drop.expiresAt < new Date()) {
        throw new Error("Secret drop has expired");
      }
      
      if (drop.claimedBy && drop.claimedBy.includes(address)) {
        throw new Error("You have already claimed this drop");
      }
      
      // Add address to claimed list
      drop.claimedBy = [...(drop.claimedBy || []), address];
      
      // If everyone has claimed, mark as not claimable
      if (drop.claimedBy.length >= (drop.maxClaims || Number.MAX_SAFE_INTEGER)) {
        drop.claimable = false;
      }
      
      // Update the drop
      await this.storage.updateSecretDrop(drop);
      
      // Add the reward to user's wallet
      const currentBalance = await this.storage.getWalletBalance(address);
      await this.storage.updateWalletBalance(address, currentBalance + drop.reward);
      
      // Create a transaction record
      const transaction = {
        hash: sha3VariantHash(`${address}-${drop.id}-${Date.now()}`),
        type: 'drop_reward',
        fromAddress: 'PVX-SYSTEM',
        toAddress: address,
        amount: drop.reward,
        timestamp: new Date(),
        note: `Reward from secret drop: ${drop.name}`
      };
      
      await this.storage.createTransaction(transaction);
      
      return { 
        success: true, 
        reward: drop.reward,
        drop: drop
      };
    } catch (error) {
      console.error("Error claiming secret drop:", error);
      throw error;
    }
  }

  /**
   * Get all Thringlets for an address
   */
  async getThringletsByOwner(ownerAddress: string): Promise<any[]> {
    try {
      return this.storage.getThringletsByOwner(ownerAddress);
    } catch (error) {
      console.error("Error fetching Thringlets:", error);
      throw new Error("Failed to fetch Thringlets");
    }
  }

  /**
   * Get a specific Thringlet
   */
  async getThringlet(id: string): Promise<any | undefined> {
    try {
      return this.storage.getThringlet(id);
    } catch (error) {
      console.error("Error fetching Thringlet:", error);
      throw new Error("Failed to fetch Thringlet");
    }
  }

  /**
   * Create a new Thringlet
   */
  async createThringlet(
    name: string,
    rarity: string,
    ownerAddress: string,
    properties: Record<string, any>,
    imageUrl?: string
  ): Promise<any> {
    try {
      // Create Thringlet object
      const thringlet = {
        name,
        rarity,
        ownerAddress,
        properties,
        imageUrl,
        createdAt: new Date(),
        mintTxHash: sha3VariantHash(`thringlet-${name}-${Date.now()}`)
      };
      
      return this.storage.createThringlet(thringlet);
    } catch (error) {
      console.error("Error creating Thringlet:", error);
      throw new Error("Failed to create Thringlet");
    }
  }

  /**
   * Transfer a Thringlet to another address
   */
  async transferThringlet(id: string, fromAddress: string, toAddress: string): Promise<boolean> {
    try {
      // Get the Thringlet
      const thringlet = await this.storage.getThringlet(id);
      
      if (!thringlet) {
        throw new Error("Thringlet not found");
      }
      
      if (thringlet.ownerAddress !== fromAddress) {
        throw new Error("You do not own this Thringlet");
      }
      
      // Update ownership
      thringlet.ownerAddress = toAddress;
      
      // Save changes
      await this.storage.updateThringlet(thringlet);
      
      // Create a transaction record
      const transaction = {
        hash: sha3VariantHash(`thringlet-transfer-${id}-${Date.now()}`),
        type: 'thringlet_transfer',
        fromAddress,
        toAddress,
        amount: 0, // Non-monetary transaction
        timestamp: new Date(),
        note: `Thringlet transfer: ${thringlet.name}`
      };
      
      await this.storage.createTransaction(transaction);
      
      return true;
    } catch (error) {
      console.error("Error transferring Thringlet:", error);
      throw error;
    }
  }
}