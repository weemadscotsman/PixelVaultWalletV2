import { storage } from '../storage';
import crypto from 'crypto';

// Configuration for the PVX blockchain
const PVX_NODE_URL = process.env.PVX_NODE_URL || 'http://localhost:4200';
const PVX_API_KEY = process.env.PVX_API_KEY || '';

// Interface for blockchain connection status
export interface BlockchainStatus {
  connected: boolean;
  latestBlock?: {
    height: number;
    hash: string;
    timestamp: Date;
  };
  networkHashRate?: number;
  peers?: number;
  error?: string;
}

/**
 * Service for interacting with the PVX blockchain
 */
export class BlockchainService {
  private status: BlockchainStatus = {
    connected: false,
    error: 'Not initialized'
  };

  /**
   * Initializes the connection to the blockchain
   * @returns Promise resolving to the connection status
   */
  async initialize(): Promise<BlockchainStatus> {
    try {
      const response = await fetch(`${PVX_NODE_URL}/api/status`, {
        headers: {
          'Authorization': `Bearer ${PVX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to blockchain: ${response.statusText}`);
      }

      const data = await response.json();
      this.status = {
        connected: true,
        latestBlock: {
          height: data.latestBlock.height,
          hash: data.latestBlock.hash,
          timestamp: new Date(data.latestBlock.timestamp)
        },
        networkHashRate: data.networkHashRate,
        peers: data.peers
      };

      return this.status;
    } catch (error: any) {
      this.status = {
        connected: false,
        error: error.message || 'Failed to connect to blockchain'
      };
      return this.status;
    }
  }

  /**
   * Gets the current connection status
   */
  getStatus(): BlockchainStatus {
    return this.status;
  }

  /**
   * Creates a new wallet in the PVX blockchain
   * @param passphrase - The passphrase for the wallet
   * @returns The created wallet details
   */
  async createWallet(passphrase: string): Promise<any> {
    try {
      // Hash the passphrase for secure storage
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(passphrase, salt, 1000, 64, 'sha512').toString('hex');
      
      // Generate a new wallet address
      // Note: In a real implementation, this would interact with the PVX node API
      const walletAddress = `PVX${crypto.randomBytes(20).toString('hex')}`;
      
      // Create the wallet in our storage
      const wallet = await storage.createWallet({
        address: walletAddress,
        publicKey: crypto.randomBytes(32).toString('hex'),
        balance: '0.000000', // Zero initially, in μPVX (6 decimals)
        createdAt: new Date(),
        lastSynced: new Date(),
        passphraseSalt: salt,
        passphraseHash: hash
      });
      
      return {
        address: wallet.address,
        balance: wallet.balance,
        createdAt: wallet.createdAt
      };
    } catch (error: any) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  /**
   * Gets wallet details for a specific address
   * @param address - The wallet address
   * @returns Wallet details
   */
  async getWallet(address: string): Promise<any> {
    try {
      // In a real implementation, this would verify the wallet exists on the blockchain
      // and get the latest balance
      const wallet = await storage.getWalletByAddress(address);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      // Sync the wallet with the blockchain (simulated)
      const updatedWallet = await this.syncWallet(wallet);
      
      return {
        address: updatedWallet.address,
        balance: updatedWallet.balance,
        createdAt: updatedWallet.createdAt,
        lastSynced: updatedWallet.lastSynced
      };
    } catch (error: any) {
      throw new Error(`Failed to get wallet: ${error.message}`);
    }
  }

  /**
   * Syncs a wallet with the blockchain to get the latest balance
   * @param wallet - The wallet to sync
   * @returns The updated wallet
   */
  private async syncWallet(wallet: any): Promise<any> {
    try {
      // In a real implementation, this would call the blockchain API
      // to get the latest balance and transaction history
      const lastSynced = new Date();
      
      // Update the wallet in our storage
      const updatedWallet = await storage.updateWallet(wallet.id, {
        ...wallet,
        lastSynced
      });
      
      return updatedWallet;
    } catch (error: any) {
      throw new Error(`Failed to sync wallet: ${error.message}`);
    }
  }

  /**
   * Transfers PVX tokens from one wallet to another
   * @param fromAddress - Sender wallet address
   * @param toAddress - Recipient wallet address
   * @param amount - Amount in PVX (will be converted to μPVX)
   * @param passphrase - Passphrase to authorize the transaction
   * @returns Transaction details
   */
  async transfer(fromAddress: string, toAddress: string, amount: string, passphrase: string): Promise<any> {
    try {
      // Verify sender wallet exists and passphrase is correct
      const senderWallet = await storage.getWalletByAddress(fromAddress);
      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }
      
      // Verify passphrase
      const hash = crypto.pbkdf2Sync(
        passphrase,
        senderWallet.passphraseSalt,
        1000,
        64,
        'sha512'
      ).toString('hex');
      
      if (hash !== senderWallet.passphraseHash) {
        throw new Error('Invalid passphrase');
      }
      
      // Verify recipient wallet exists
      const recipientWallet = await storage.getWalletByAddress(toAddress);
      if (!recipientWallet) {
        throw new Error('Recipient wallet not found');
      }
      
      // Convert amount to μPVX (6 decimal places)
      const amountInMicroPVX = parseFloat(amount) * 1000000;
      
      // Verify sufficient balance
      const balanceInMicroPVX = parseFloat(senderWallet.balance) * 1000000;
      if (balanceInMicroPVX < amountInMicroPVX) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction hash (in a real implementation, this would be cryptographically secure)
      const txHash = `PVX_TX_${crypto.randomBytes(32).toString('hex')}`;
      
      // Update sender and recipient balances
      const newSenderBalance = ((balanceInMicroPVX - amountInMicroPVX) / 1000000).toFixed(6);
      const newRecipientBalance = ((parseFloat(recipientWallet.balance) * 1000000 + amountInMicroPVX) / 1000000).toFixed(6);
      
      await storage.updateWallet(senderWallet.id, {
        ...senderWallet,
        balance: newSenderBalance
      });
      
      await storage.updateWallet(recipientWallet.id, {
        ...recipientWallet,
        balance: newRecipientBalance
      });
      
      // Record the transaction
      const transaction = await storage.createTransaction({
        hash: txHash,
        type: 'transfer',
        from_address: fromAddress,
        to_address: toAddress,
        amount: amount,
        timestamp: new Date(),
        block_height: null, // Will be updated when transaction is mined
        note: null
      });
      
      return {
        hash: transaction.hash,
        fromAddress: transaction.from_address,
        toAddress: transaction.to_address,
        amount: transaction.amount,
        timestamp: transaction.timestamp
      };
    } catch (error: any) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  /**
   * Gets transaction history for a wallet
   * @param address - The wallet address
   * @returns Array of transactions
   */
  async getTransactionHistory(address: string): Promise<any[]> {
    try {
      const transactions = await storage.getTransactionsByAddress(address);
      
      return transactions.map(tx => ({
        hash: tx.hash,
        type: tx.type,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        amount: tx.amount,
        timestamp: tx.timestamp,
        blockHeight: tx.block_height,
        note: tx.note
      }));
    } catch (error: any) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Starts mining on the PVX blockchain
   * @param minerAddress - The wallet address that will receive mining rewards
   * @returns Mining status
   */
  async startMining(minerAddress: string): Promise<any> {
    try {
      // Verify wallet exists
      const wallet = await storage.getWalletByAddress(minerAddress);
      if (!wallet) {
        throw new Error('Miner wallet not found');
      }
      
      // Check if already mining
      const existingMiner = await storage.getMinerByAddress(minerAddress);
      if (existingMiner && existingMiner.is_currently_mining) {
        return {
          address: existingMiner.address,
          isCurrentlyMining: true,
          currentHashRate: existingMiner.current_hash_rate,
          message: 'Already mining'
        };
      }
      
      // Calculate simulated hash rate based on timestamp to add variability
      const hashRateBase = 100 + (Date.now() % 50);
      const currentHashRate = `${hashRateBase}.${Date.now() % 100}`;
      
      // Create or update miner record
      let miner;
      if (existingMiner) {
        miner = await storage.updateMiner(existingMiner.id, {
          ...existingMiner,
          is_currently_mining: true,
          current_hash_rate: currentHashRate
        });
      } else {
        miner = await storage.createMiner({
          address: minerAddress,
          blocks_mined: 0,
          total_rewards: '0.000000',
          is_currently_mining: true,
          current_hash_rate: currentHashRate,
          last_block_mined: null
        });
      }
      
      return {
        address: miner.address,
        isCurrentlyMining: miner.is_currently_mining,
        currentHashRate: miner.current_hash_rate,
        message: 'Mining started successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to start mining: ${error.message}`);
    }
  }

  /**
   * Stops mining on the PVX blockchain
   * @param minerAddress - The wallet address of the miner
   * @returns Mining status
   */
  async stopMining(minerAddress: string): Promise<any> {
    try {
      // Get miner record
      const miner = await storage.getMinerByAddress(minerAddress);
      if (!miner) {
        throw new Error('Miner not found');
      }
      
      if (!miner.is_currently_mining) {
        return {
          address: miner.address,
          isCurrentlyMining: false,
          message: 'Not currently mining'
        };
      }
      
      // Update miner record
      const updatedMiner = await storage.updateMiner(miner.id, {
        ...miner,
        is_currently_mining: false,
        current_hash_rate: '0'
      });
      
      return {
        address: updatedMiner.address,
        isCurrentlyMining: updatedMiner.is_currently_mining,
        message: 'Mining stopped successfully'
      };
    } catch (error: any) {
      throw new Error(`Failed to stop mining: ${error.message}`);
    }
  }

  /**
   * Simulates mining a block and distributes rewards
   * This is called by a scheduled task to simulate block mining
   */
  async simulateBlockMining(): Promise<any> {
    try {
      // Get all active miners
      const miners = await storage.getAllActiveMiners();
      if (miners.length === 0) {
        return { message: 'No active miners' };
      }
      
      // Get latest block
      const latestBlock = await storage.getLatestBlock();
      const blockHeight = latestBlock ? latestBlock.height + 1 : 1;
      
      // Calculate total hash rate
      const totalHashRate = miners.reduce((sum, miner) => sum + parseFloat(miner.current_hash_rate), 0);
      
      // Select a miner based on hash rate (weighted random selection)
      let selectedMiner = miners[0]; // Default to first miner
      if (miners.length > 1) {
        let randomPoint = Math.random() * totalHashRate;
        let cumulativeRate = 0;
        
        for (const miner of miners) {
          cumulativeRate += parseFloat(miner.current_hash_rate);
          if (randomPoint <= cumulativeRate) {
            selectedMiner = miner;
            break;
          }
        }
      }
      
      // Block reward (in PVX)
      const blockReward = '6.250000';
      
      // Create the new block
      const previousHash = latestBlock ? latestBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date();
      const nonce = crypto.randomBytes(4).toString('hex');
      const blockData = `${blockHeight}|${previousHash}|${timestamp.toISOString()}|${selectedMiner.address}|${nonce}`;
      const hash = crypto.createHash('sha256').update(blockData).digest('hex');
      
      const block = await storage.createBlock({
        height: blockHeight,
        hash,
        previous_hash: previousHash,
        timestamp,
        nonce,
        difficulty: 100 + (blockHeight % 15), // Simulated difficulty
        miner: selectedMiner.address,
        reward: blockReward
      });
      
      // Update miner stats
      const updatedMiner = await storage.updateMiner(selectedMiner.id, {
        blocks_mined: selectedMiner.blocks_mined + 1,
        total_rewards: (parseFloat(selectedMiner.total_rewards) + parseFloat(blockReward)).toFixed(6),
        last_block_mined: timestamp
      });
      
      // Add the reward to the miner's wallet
      const minerWallet = await storage.getWalletByAddress(selectedMiner.address);
      if (minerWallet) {
        const newBalance = (parseFloat(minerWallet.balance) + parseFloat(blockReward)).toFixed(6);
        await storage.updateWallet(minerWallet.id, {
          ...minerWallet,
          balance: newBalance
        });
        
        // Record the mining reward transaction
        await storage.createTransaction({
          hash: `MINING_${hash}`,
          type: 'mining_reward',
          from_address: 'COINBASE',
          to_address: selectedMiner.address,
          amount: blockReward,
          timestamp,
          block_height: blockHeight,
          note: 'Mining reward'
        });
      }
      
      return {
        block,
        minerAddress: selectedMiner.address,
        reward: blockReward
      };
    } catch (error: any) {
      throw new Error(`Failed to simulate block mining: ${error.message}`);
    }
  }
}

// Create a singleton instance
export const blockchainService = new BlockchainService();