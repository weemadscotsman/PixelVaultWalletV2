import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { 
  BlockchainStatus,
  MiningStats,
  Block,
  Transaction,
  BlockchainTrends,
  Thringlet,
  ThringletEmotionState,
  TransactionHash,
  TransactionType
} from '@shared/types';
import { checkMiningBadges } from '../controllers/badgeController';
import { broadcastBlock, broadcastStatusUpdate, broadcastTransaction } from '../utils/websocket';

import { walletDao } from '../database/walletDao';
import { transactionDao } from '../database/transactionDao';
import { blockDao } from '../database/blockDao';
import { stakeDao } from '../database/stakeDao';
import { minerDao } from '../database/minerDao';
import * as passphraseUtils from '../utils/passphrase';
import * as cryptoUtils from '../utils/crypto'; // For encryptAES256GCM
import * as tokenomics from '../tokenomics/const'; // Import tokenomics constants

// Constants for PVX blockchain
const PVX_GENESIS_BLOCK_TIMESTAMP = 1714637462000; // May 1, 2024
const PVX_GENESIS_ADDRESS = "PVX_GENESIS_ADDR_00000000000000"; // Used for reward 'from'
const PVX_INITIAL_SUPPLY = "6009420000000"; // In μPVX (6,009,420 PVX) - Note: This is different from tokenomics.MAX_SUPPLY_PVX
const PVX_MIN_DIFFICULTY = 0.5;
const PVX_MAX_DIFFICULTY = 5.0;
// const PVX_BLOCK_REWARD = "5000000"; // 5 PVX - Will be replaced by tokenomics constant
const PVX_BLOCK_TIME = 60; // 1 minute
const PVX_TARGET_BLOCK_TIME_MS = 60000; // 1 minute
const PVX_MAX_TRANSACTIONS_PER_BLOCK = 50;
const PVX_MINING_INTERVAL_MS = 10000; // Check every 10 seconds

// In-memory state
let blockchainStatus: BlockchainStatus = {
  connected: false,
  synced: false,
  latestBlock: { height: 0, hash: '', timestamp: 0 },
  difficulty: PVX_MIN_DIFFICULTY,
  error: null
};

// Backend state (not persisted)
let pendingTransactions: Transaction[] = [];
let latestBlock: Block | null = null;
let miningTimeout: NodeJS.Timeout | null = null;
let stakingTimeout: NodeJS.Timeout | null = null;
let thringlets: Map<string, Thringlet> = new Map();

/**
 * Generate a random hash for simulating blockchain operations
 */
function generateRandomHash(): string {
  return crypto.createHash('sha256')
    .update(Math.random().toString() + Date.now().toString())
    .digest('hex');
}

/**
 * Initialize and connect to the blockchain
 */
export async function connectToBlockchain(): Promise<BlockchainStatus> {
  try {
    // Create genesis block if it doesn't exist
    let currentLatestBlock = await blockDao.getLatestBlock();
    
    if (!currentLatestBlock) {
      console.log('No blocks found, creating genesis block...');
      
      const genesisBlockData: Block = {
        height: 1,
        hash: generateRandomHash(), // Consider making this deterministic for genesis
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: PVX_GENESIS_BLOCK_TIMESTAMP,
        transactions: [], // Genesis block has no transactions
        miner: PVX_GENESIS_ADDRESS,
        nonce: '0', // Or a specific genesis nonce
        difficulty: PVX_MIN_DIFFICULTY,
        reward: '0', // No reward for genesis block
        // Optional fields if your Block type requires them and DAO handles them
        merkleRoot: crypto.createHash('sha256').update('').digest('hex'), // Empty merkle root
        totalTransactions: 0,
        size: 0 // Approximate size
      };
      
      currentLatestBlock = await blockDao.createBlock(genesisBlockData);
      console.log('Genesis block created and saved to DB.');
    }
    latestBlock = currentLatestBlock; // Update service-scoped latestBlock
    
    // Update status
    blockchainStatus = {
      connected: true,
      synced: true,
      latestBlock: {
        height: latestBlock.height,
        hash: latestBlock.hash,
        timestamp: latestBlock.timestamp
      },
      difficulty: latestBlock.difficulty,
      peers: 5 + Math.floor(Math.random() * 20) // Simulate 5-25 peers
    };
    
    // REMOVED initializeBlockchain() call to fix infinite recursion
    
    return blockchainStatus;
  } catch (error) {
    console.error('Error connecting to blockchain:', error);
    blockchainStatus = {
      connected: false,
      synced: false,
      latestBlock: { height: 0, hash: '', timestamp: 0 },
      difficulty: PVX_MIN_DIFFICULTY,
      error: error instanceof Error ? error.message : 'Unknown error connecting to blockchain'
    };
    
    return blockchainStatus;
  }
}

/**
 * Get current blockchain status
 */
export function getBlockchainStatus(): BlockchainStatus {
  return blockchainStatus;
}

/**
 * Get block by hash
 */
export async function getBlockByHash(hash: string): Promise<Block | null> {
  return await blockDao.getBlockByHash(hash);
}

/**
 * Get block by height
 */
export async function getBlockByHeight(height: number): Promise<Block | null> {
  return await blockDao.getBlockByHeight(height);
}

/**
 * Create a new wallet
 * Returns address, publicKey, and encrypted private key components.
 * The raw private key is NOT returned by this service function.
 */
export async function createWallet(passphrase: string): Promise<{
  address: string,
  publicKey: string,
  iv: string,
  encryptedPrivateKey: string,
  authTag: string
}> {
  // 1. Generate a new private key (ensure it's cryptographically strong for real use)
  const rawPrivateKey = crypto.randomBytes(32).toString('hex');

  // 2. Generate public key (simplified for demo, typically derived from private key via ECC)
  // For this example, we'll keep the existing public key generation for simplicity,
  // but acknowledge it's not a proper ECC public key.
  const publicKey = crypto.createHash('sha256')
    .update(rawPrivateKey) // Derive from the actual private key
    .digest('hex');
  
  const address = 'PVX_' + publicKey.substring(0, 32); // Address derivation can remain
  
  // 3. Generate salt and hash the passphrase using PBKDF2 (from passphrase.ts)
  const salt = passphraseUtils.generateSalt();
  const passphraseHash = passphraseUtils.hashPassphrase(passphrase, salt); // This is PBKDF2-SHA256, 64-byte hex

  // 4. Derive AES encryption key from the PBKDF2 hash
  const pbkdf2Buffer = Buffer.from(passphraseHash, 'hex');
  if (pbkdf2Buffer.length < 32) {
    // This should not happen if passphraseHash is 64 bytes hex (128 chars)
    throw new Error('PBKDF2 hash is too short to derive a 32-byte AES key.');
  }
  const aesKey = pbkdf2Buffer.subarray(0, 32); // Take the first 32 bytes for AES-256 key

  // 5. Encrypt the raw private key
  const { iv, ciphertext, authTag } = cryptoUtils.encryptAES256GCM(rawPrivateKey, aesKey);
  
  // 6. Store wallet data (WITHOUT private key) in the database
  await walletDao.createWallet({
    address,
    publicKey, // Store the conceptual public key
    balance: "100000", // Initial balance for testing
    createdAt: new Date(),
    lastUpdated: new Date(),
    passphraseSalt: salt, // Store salt for verifying passphrase
    passphraseHash: passphraseHash // Store PBKDF2 hash of passphrase
    // DO NOT STORE rawPrivateKey or encryptedPrivateKey or aesKey here
  });
  
  // 7. Return address, publicKey, and encrypted components for paper wallet/client backup
  return {
    address,
    publicKey,
    iv,
    encryptedPrivateKey: ciphertext,
    authTag
  };
}

/**
 * Get wallet by address
 */
export async function getWallet(address: string) {
  return await walletDao.getWalletByAddress(address);
}

/**
 * Export wallet keys by address and passphrase
 */
export async function exportWalletKeys(address: string, passphrase: string) {
  const wallet = await walletDao.getWalletByAddress(address);
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Verify passphrase
  const hash = crypto.createHash('sha256')
    .update(passphrase + wallet.passphraseSalt)
    .digest('hex');
  
  if (hash !== wallet.passphraseHash) {
    throw new Error('Invalid passphrase');
  }
  
  // In a real implementation, we would decrypt the private key here
  // For the demo, we'll just return a mock private key
  return {
    address: wallet.address,
    publicKey: wallet.publicKey,
    privateKey: 'bf' + crypto.createHash('sha256').update(wallet.address).digest('hex').substring(2)
  };
}

/**
 * Import wallet using private key
 */
export async function importWallet(privateKey: string, passphrase: string): Promise<string> {
  // In a real implementation, we would validate the private key
  // For demo, we'll derive the public key and address from the private key
  
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(passphrase + salt)
    .digest('hex');
  
  // Derive address from private key
  const address = 'PVX_' + crypto.createHash('sha256')
    .update(privateKey)
    .digest('hex').substring(0, 32);
  
  // Generate public key (simplified for demo)
  const publicKey = crypto.createHash('sha256')
    .update(privateKey)
    .digest('hex');
  
  // Check if wallet already exists
  const existingWallet = await walletDao.getWalletByAddress(address);
  
  if (existingWallet) {
    // Update existing wallet passphrase
    existingWallet.passphraseSalt = salt;
    existingWallet.passphraseHash = hash;
    existingWallet.lastUpdated = new Date(); // Changed from lastSynced to match database schema
    await walletDao.updateWallet(existingWallet);
  } else {
    // Create new wallet
    await walletDao.createWallet({
      address,
      publicKey,
      balance: "0",
      createdAt: new Date(),
      lastUpdated: new Date(), // Changed from lastSynced to match database schema
      passphraseSalt: salt,
      passphraseHash: hash
    });
  }
  
  return address;
}

/**
 * Send transaction
 */
export async function sendTransaction(
  fromAddress: string,
  toAddress: string,
  amount: string,
  passphrase: string
): Promise<string> {
  // Validate wallet
  const wallet = await walletDao.getWalletByAddress(fromAddress);
  
  if (!wallet) {
    throw new Error('Sender wallet not found');
  }
  
  // Verify passphrase
  const hash = crypto.createHash('sha256')
    .update(passphrase + wallet.passphraseSalt)
    .digest('hex');
  
  if (hash !== wallet.passphraseHash) {
    throw new Error('Invalid passphrase');
  }
  
  // Verify balance
  if (BigInt(wallet.balance) < BigInt(amount)) {
    throw new Error('Insufficient balance');
  }
  
  // Create transaction
  const timestamp = Date.now();
  const txHash = crypto.createHash('sha256')
    .update(fromAddress + toAddress + amount + timestamp.toString())
    .digest('hex');
  
  const transaction: Transaction = {
    hash: txHash,
    type: 'TRANSFER' as TransactionType,
    from: fromAddress,
    to: toAddress,
    amount,
    timestamp,
    nonce: Math.floor(Math.random() * 100000),
    signature: generateRandomHash(),
    status: 'pending'
  };
  
  // Update balances
  const senderBalance = BigInt(wallet.balance) - BigInt(amount);
  wallet.balance = senderBalance.toString();
  await walletDao.updateWallet(wallet);
  
  // Add to or create receiver wallet
  let receiverWallet = await walletDao.getWalletByAddress(toAddress);
  if (receiverWallet) {
    const receiverBalance = BigInt(receiverWallet.balance) + BigInt(amount);
    receiverWallet.balance = receiverBalance.toString();
    await walletDao.updateWallet(receiverWallet);
  } else {
    // Create receiver wallet if it doesn't exist
    receiverWallet = {
      address: toAddress,
      publicKey: generateRandomHash(),
      balance: amount,
      createdAt: new Date(),
      lastUpdated: new Date(), // Changed from lastSynced to match database schema
      passphraseSalt: '', // Consider how to handle this for new wallets created this way
      passphraseHash: ''  // Consider how to handle this for new wallets created this way
    };
    await walletDao.createWallet(receiverWallet);
  }
  
  // Store transaction
  await transactionDao.createTransaction(transaction);
  
  // Add to pending transactions
  pendingTransactions.push(transaction);
  
  return txHash;
}

/**
 * Start mining with address and hardware type
 */
export async function startMining(address: string, hardwareType: string = 'cpu'): Promise<MiningStats> {
  // Validate wallet
  const wallet = await walletDao.getWalletByAddress(address); // Use walletDao
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Check if already mining
  let existingMinerStats = await minerDao.getMinerStatsByAddress(address);
  
  if (existingMinerStats && existingMinerStats.isCurrentlyMining) {
    throw new Error('Already mining');
  }
  
  // Generate hashrate based on hardware type
  let numericHashRate: number;
  let hardwareNameDb: 'CPU' | 'GPU' | 'ASIC'; // For DB
  
  switch (hardwareType.toLowerCase()) {
    case 'cpu':
      numericHashRate = parseFloat((Math.random() * 90 + 10).toFixed(2));
      hardwareNameDb = 'CPU';
      break;
    case 'gpu':
      numericHashRate = parseFloat((Math.random() * 400 + 100).toFixed(2));
      hardwareNameDb = 'GPU';
      break;
    case 'asic':
      numericHashRate = parseFloat((Math.random() * 1500 + 500).toFixed(2));
      hardwareNameDb = 'ASIC';
      break;
    default:
      numericHashRate = parseFloat((Math.random() * 90 + 10).toFixed(2));
      hardwareNameDb = 'CPU';
  }

  const now = Date.now();
  let savedStatsDb: MiningStats;

  if (existingMinerStats) {
    const statsToUpdate: MiningStats = {
      ...existingMinerStats,
      isCurrentlyMining: true,
      currentHashRate: numericHashRate, // This will be a number for the DAO
      hardwareType: hardwareNameDb, // This maps to 'hardware' in DAO
      // lastBlockMined remains from existingMinerStats
      // blocksMined and totalRewards remain
      joinedAt: existingMinerStats.joinedAt || new Date(now), // Keep original join date
    };
    // Map for DAO
    const daoInput = {
        address: statsToUpdate.address,
        blocksMined: statsToUpdate.blocksMined,
        totalRewards: statsToUpdate.totalRewards,
        lastBlockMined: statsToUpdate.lastBlockMined ? Number(statsToUpdate.lastBlockMined) : undefined,
        isCurrentlyMining: statsToUpdate.isCurrentlyMining,
        hardware: hardwareNameDb, // Use the DB enum type
        joinedAt: statsToUpdate.joinedAt,
        currentHashRate: numericHashRate
    };
    savedStatsDb = await minerDao.updateMinerStats(daoInput);
  } else {
    const statsToCreate: MiningStats = {
      address,
      blocksMined: 0,
      totalRewards: "0",
      isCurrentlyMining: true,
      currentHashRate: numericHashRate, // Numeric for DAO
      hardwareType: hardwareNameDb, // Map to 'hardware' for DAO
      lastBlockMined: undefined,
      joinedAt: new Date(now)
    };
     // Map for DAO
    const daoInput = {
        address: statsToCreate.address,
        blocksMined: statsToCreate.blocksMined,
        totalRewards: statsToCreate.totalRewards,
        lastBlockMined: undefined,
        isCurrentlyMining: statsToCreate.isCurrentlyMining,
        hardware: hardwareNameDb,
        joinedAt: statsToCreate.joinedAt,
        currentHashRate: numericHashRate
    };
    savedStatsDb = await minerDao.createMinerStats(daoInput);
  }
  
  // Schedule mock block mining (for demo purposes) - this might need adjustment if it relies on memStorage
  simulateBlockMining(address); // Keep for now, assuming it can work or will be refactored separately

  // Return MiningStats conforming to shared type
  return {
    ...savedStatsDb,
    currentHashRate: `${savedStatsDb.currentHashRate} MH/s`, // Format back to string with unit
    hardwareType: savedStatsDb.hardware, // Map back from 'hardware'
  };
}

/**
 * Stop mining with address
 */
export async function stopMining(address: string): Promise<MiningStats> {
  // Validate wallet
  const wallet = await walletDao.getWalletByAddress(address); // Use walletDao
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Check if mining
  const minerStatsDb = await minerDao.getMinerStatsByAddress(address);
  
  if (!minerStatsDb || !minerStatsDb.isCurrentlyMining) {
    throw new Error('Not mining or miner stats not found');
  }
  
  // Update miner status
  const updatedStatsDb = await minerDao.updateMinerStatus(address, false);
  if (!updatedStatsDb) {
      throw new Error('Failed to update miner status in DB');
  }

  // Return MiningStats conforming to shared type
  return {
    ...updatedStatsDb,
    currentHashRate: `${updatedStatsDb.currentHashRate} MH/s`,
    hardwareType: updatedStatsDb.hardware,
  };
}

/**
 * Get mining stats
 */
export async function getMiningStats(address: string): Promise<MiningStats> {
  const minerStatsDb = await minerDao.getMinerStatsByAddress(address);
  
  if (!minerStatsDb) {
    // Return default structure conforming to shared MiningStats type
    return {
      address,
      blocksMined: 0,
      totalRewards: "0",
      isCurrentlyMining: false,
      currentHashRate: "0 MH/s", // String with unit
      hardwareType: 'CPU', // Default or undefined
      lastBlockMined: undefined,
      joinedAt: undefined,
    };
  }
  
  // Convert DB format to shared MiningStats type
  return {
    ...minerStatsDb,
    currentHashRate: `${minerStatsDb.currentHashRate} MH/s`, // Format to string with unit
    hardwareType: minerStatsDb.hardware, // Map field name
  };
}

/**
 * Get mining rewards for an address
 */
export async function getMiningRewards(address: string): Promise<any[]> {
  // Get transactions related to mining (type: MINE or REWARD) for this address
  const transactions = await getTransactionsByAddress(address);
  
  // Filter for mining rewards
  const miningRewards = transactions
    .filter(tx => 
      tx.type === 'MINING_REWARD' as TransactionType || 
      (tx.type === 'STAKING_REWARD' as TransactionType && tx.from === 'PVX_COINBASE')
    )
    .map((tx, index) => ({
      id: `reward_${index}_${tx.hash.substring(0, 8)}`,
      blockHeight: tx.nonce || 0, // Use nonce field for block height
      amount: tx.amount,
      timestamp: tx.timestamp,
      address: address,
      txHash: tx.hash
    }));
  
  return miningRewards;
}

/**
 * Get network hashrate and active miner count
 */
export async function getNetworkHashrate(): Promise<{ totalHashrate: number; activeMinersCount: number }> {
  // Sum up all active miners' hashrates from DAO
  const activeMinersList = await minerDao.getAllActiveMiners(); // Use minerDao
  
  if (!activeMinersList || activeMinersList.length === 0) {
    return { totalHashrate: 0, activeMinersCount: 0 };
  }
  
  // minerDao returns currentHashRate as a number (assumed to be in MH/s from DB schema)
  const totalHashrateSumMHs = activeMinersList.reduce((sum: number, miner: MiningStats) => {
    // currentHashRate from DAO is already a number (MH/s)
    return sum + (Number(miner.currentHashRate) || 0);
  }, 0);
  
  // Convert MH/s to TH/s for the totalHashrate
  return {
    totalHashrate: totalHashrateSumMHs / 1000000, // MH/s to TH/s
    activeMinersCount: activeMinersList.length
  };
}

/**
 * Force mine a block (for testing)
 */
export async function forceMineBlock(minerAddress: string): Promise<Block | null> {
  try {
    // Get miner stats to check if registered as a miner
    let minerStatsDb = await minerDao.getMinerStatsByAddress(minerAddress);
    
    // Create miner stats if not exists
    if (!minerStatsDb) {
      const numericHashRate = parseFloat((Math.random() * 200 + 50).toFixed(2));
      const hardwareNameDb: 'CPU' | 'GPU' | 'ASIC' = 'CPU'; // Default for forced mine
      const statsToCreate = {
        address: minerAddress,
        blocksMined: 0,
        totalRewards: "0",
        isCurrentlyMining: true, // Forcing a mine implies it's mining now
        currentHashRate: numericHashRate, // Numeric for DAO
        hardware: hardwareNameDb,
        lastBlockMined: undefined,
        joinedAt: new Date()
      };
      minerStatsDb = await minerDao.createMinerStats(statsToCreate);
    }
    
    // Get latest block
    const currentLatestBlock = await getLatestBlock();
    
    if (!currentLatestBlock) {
      return null;
    }
    
    // TODO: Implement halving logic for block rewards
    // TODO: Check against MAX_SUPPLY before creating rewards
    const currentBlockRewardUPVX = tokenomics.INITIAL_BLOCK_REWARD_UPVX; // This is a number
    const minerActualRewardUPVX = Math.floor(currentBlockRewardUPVX * tokenomics.MINER_REWARD_PERCENTAGE);
    const founderRewardUPVX = currentBlockRewardUPVX - minerActualRewardUPVX; // Remainder to founder

    // Create new block
    const newBlock: Block = {
      height: currentLatestBlock.height + 1,
      hash: generateRandomHash(),
      previousHash: currentLatestBlock.hash,
      timestamp: Date.now(),
      transactions: pendingTransactions.slice(0, 10).map(tx => tx.hash),
      miner: minerAddress,
      nonce: Math.floor(Math.random() * 1000000).toString(),
      difficulty: adjustDifficulty(currentLatestBlock),
      reward: minerActualRewardUPVX.toString() // Miner's actual reward
    };
    
    // Store new block
    const savedBlock = await blockDao.createBlock(newBlock);
    latestBlock = savedBlock; // Update service-scoped latestBlock
    
    // Update miner stats
    const updatedMinerStatsData = {
        ...minerStatsDb,
        blocksMined: minerStatsDb.blocksMined + 1,
        lastBlockMined: newBlock.timestamp,
        totalRewards: (BigInt(minerStatsDb.totalRewards) + BigInt(minerActualRewardUPVX)).toString(),
        currentHashRate: Number(minerStatsDb.currentHashRate) || 0,
        hardware: minerStatsDb.hardwareType || minerStatsDb.hardware,
    };
    await minerDao.updateMinerStats(updatedMinerStatsData);
    
    // Update miner's wallet balance
    const wallet = await walletDao.getWalletByAddress(minerAddress);
    if (wallet) {
      wallet.balance = (BigInt(wallet.balance) + BigInt(minerActualRewardUPVX)).toString();
      await walletDao.updateWallet(wallet);
    }

    // Create and store founder reward transaction if founderReward is greater than 0
    if (founderRewardUPVX > 0) {
      const founderRewardTx: Transaction = {
        hash: crypto.createHash('sha256').update(`founder_reward_fm_${newBlock.hash}_${newBlock.timestamp}`).digest('hex'),
        type: 'FOUNDER_REWARD' as TransactionType, // Ensure 'FOUNDER_REWARD' is a valid TransactionType
        from: PVX_GENESIS_ADDRESS,
        to: tokenomics.FOUNDER_RESERVE_ADDRESS,
        amount: founderRewardUPVX.toString(),
        timestamp: newBlock.timestamp + 1,
        nonce: 0,
        signature: generateRandomHash(),
        status: 'confirmed'
      };
      await transactionDao.createTransaction(founderRewardTx);
      // Optionally broadcast this transaction if needed for real-time updates
      // broadcastTransaction(founderRewardTx);
    }
    
    // Check and award mining-related badges
    try {
      await checkMiningBadges(minerAddress, minerStats.blocksMined);
    } catch (err) {
      console.error('Error checking mining badges:', err);
      // Continue even if badge check fails
    }
    
    // Update blockchain status
    blockchainStatus = {
      ...blockchainStatus,
      connected: true,
      latestBlock: {
        height: newBlock.height,
        hash: newBlock.hash,
        timestamp: newBlock.timestamp
      },
      difficulty: newBlock.difficulty
    };
    
    // Broadcast new block and status via WebSocket for real-time updates
    try {
      broadcastBlock(newBlock);
      broadcastStatusUpdate(blockchainStatus);
      console.log(`New block broadcasted: ${newBlock.height} by miner ${minerAddress}`);
    } catch (err) {
      console.error('Error broadcasting block via WebSocket:', err);
      // Continue even if WebSocket broadcast fails
    }
    
    // Clear processed transactions from pending
    const processed = pendingTransactions.slice(0, 10).map(tx => tx.hash);
    pendingTransactions = pendingTransactions.filter(tx => !processed.includes(tx.hash));
    
    return newBlock;
  } catch (error) {
    console.error('Error in forced block mining:', error);
    return null;
  }
}

/**
 * Simulate block mining (for demo)
 */
async function simulateBlockMining(minerAddress: string) {
  // Wait for a random time between 30-120 seconds
  const waitTime = Math.floor(Math.random() * 90000) + 30000;
  
  setTimeout(async () => {
    try {
      // Get miner stats to check if still mining
      const minerStats = await minerDao.getMinerStatsByAddress(minerAddress); // Use DAO
      
      if (!minerStats || !minerStats.isCurrentlyMining) {
        return; // Stopped mining
      }
      
      // Mine a block using the force mine function
      const newBlock = await forceMineBlock(minerAddress);
      
      if (newBlock) {
        // Schedule next block
        simulateBlockMining(minerAddress);
      }
    } catch (error) {
      console.error('Error in block mining simulation:', error);
    }
  }, waitTime);
}

/**
 * Adjust difficulty based on previous block
 */
function adjustDifficulty(previousBlock: Block): number {
  // Simple difficulty adjustment algorithm
  const timeSinceLastBlock = Date.now() - previousBlock.timestamp;
  const targetBlockTime = PVX_BLOCK_TIME * 1000; // convert to ms
  
  // If blocks are coming too fast, increase difficulty
  if (timeSinceLastBlock < targetBlockTime * 0.8) {
    return Math.min(previousBlock.difficulty * 1.1, PVX_MAX_DIFFICULTY);
  }
  
  // If blocks are coming too slow, decrease difficulty
  if (timeSinceLastBlock > targetBlockTime * 1.2) {
    return Math.max(previousBlock.difficulty * 0.9, PVX_MIN_DIFFICULTY);
  }
  
  // Otherwise keep same difficulty
  return previousBlock.difficulty;
}

/**
 * Get latest block
 */
export async function getLatestBlock(): Promise<Block | null> {
  return await blockDao.getLatestBlock();
}

/**
 * Get transaction by hash
 */
export async function getTransactionByHash(hash: string): Promise<Transaction | null> {
  return await transactionDao.getTransactionByHash(hash);
}

/**
 * Create a transaction
 */
export async function createTransaction(transaction: Transaction): Promise<Transaction> {
  return await transactionDao.createTransaction(transaction);
}

/**
 * Get wallet by address
 */
export async function getWalletByAddress(address: string) {
  return await walletDao.getWalletByAddress(address);
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(address: string, newBalance: string) {
  const wallet = await walletDao.getWalletByAddress(address);
  if (wallet) {
    wallet.balance = newBalance;
    wallet.lastUpdated = new Date();
    return await walletDao.updateWallet(wallet); // or use walletDao.updateWalletBalance if preferred
  }
  return null;
}

/**
 * Get transactions by address
 */
export async function getTransactionsByAddress(address: string): Promise<Transaction[]> {
  // Consider pagination if needed, transactionDao.getTransactionsByAddress supports it
  return await transactionDao.getTransactionsByAddress(address);
}

/**
 * Get all wallets
 */
export async function getAllWallets() {
  return await walletDao.getAllWallets();
}

/**
 * Get blockchain trends data for visualization
 */
export async function getRecentBlocks(limit: number = 10): Promise<Block[]> {
  return await blockDao.getRecentBlocks(limit);
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  return await transactionDao.getRecentTransactions(limit);
}

export function getBlockchainTrends(): any {
  // Generate realistic trend data
  return {
    metrics: [
      {
        id: "mining",
        label: "Mining Activity",
        color: "#4caf50",
        data: {
          "hashrate": {
            value: Math.random() * 10 + 2, // 2-12 TH/s
            maxValue: 20,
            unit: "TH/s"
          },
          "difficulty": {
            value: latestBlock?.difficulty || 1,
            maxValue: 5,
            unit: ""
          },
          "blockTime": {
            value: Math.random() * 20 + 50, // 50-70 seconds
            maxValue: 120,
            unit: "s"
          }
        }
      },
      {
        id: "network",
        label: "Network Health",
        color: "#2196f3",
        data: {
          "peerCount": {
            value: Math.floor(Math.random() * 100) + 50, // 50-150 peers
            maxValue: 200,
            unit: "peers"
          },
          "txPoolSize": {
            value: pendingTransactions.length,
            maxValue: 100,
            unit: "txs"
          },
          "uptime": {
            value: 99.9,
            maxValue: 100,
            unit: "%"
          }
        }
      },
      {
        id: "governance",
        label: "Governance",
        color: "#ff9800",
        data: {
          "proposals": {
            value: Math.floor(Math.random() * 5) + 1, // 1-5 proposals
            maxValue: 10,
            unit: ""
          },
          "votingPower": {
            value: Math.random() * 30 + 20, // 20-50% staked
            maxValue: 100,
            unit: "%"
          },
          "consensus": {
            value: Math.random() * 30 + 70, // 70-100% consensus
            maxValue: 100,
            unit: "%"
          }
        }
      },
      {
        id: "economy",
        label: "Token Economy",
        color: "#e91e63",
        data: {
          "price": {
            value: Math.random() * 10 + 5, // $5-15
            maxValue: 50,
            unit: "USD"
          },
          "marketCap": {
            value: Math.random() * 5 + 1, // $1M-$6M
            maxValue: 10,
            unit: "M USD"
          },
          "volume": {
            value: Math.random() * 500000 + 50000, // 50K-550K
            maxValue: 1000000,
            unit: "USD"
          }
        }
      },
      {
        id: "security",
        label: "Security",
        color: "#673ab7",
        data: {
          "zkProofs": {
            value: Math.floor(Math.random() * 100) + 900, // 900-1000 proofs
            maxValue: 1000,
            unit: "proofs"
          },
          "decentralization": {
            value: Math.random() * 20 + 80, // 80-100% decentralized
            maxValue: 100,
            unit: "%"
          },
          "threatLevel": {
            value: Math.random() * 20, // 0-20% threat
            maxValue: 100,
            unit: "%"
          }
        }
      }
    ]
  };
}

/**
 * Simulate Thringlet emotional state changes based on interactions
 */
export function simulateThringletInteraction(
  thringlet: Thringlet, 
  interactionType: string
): Thringlet {
  // Update interaction count
  thringlet.interactionCount = (thringlet.interactionCount || 0) + 1;
  
  // Initialize stateHistory if it doesn't exist
  if (!thringlet.stateHistory) {
    thringlet.stateHistory = [];
  }
  
  // Record previous state
  const previousState = thringlet.emotionState;
  
  // Update last interaction time
  thringlet.lastInteraction = Date.now();
  
  // Determine new emotional state based on interaction type
  let newState: ThringletEmotionState;
  
  switch (interactionType.toLowerCase()) {
    case 'pet':
    case 'praise':
    case 'feed':
      newState = Math.random() > 0.8 
        ? 'excited' as ThringletEmotionState 
        : 'happy' as ThringletEmotionState;
      break;
    case 'ignore':
    case 'neglect':
      newState = Math.random() > 0.7 
        ? 'sad' as ThringletEmotionState 
        : 'neutral' as ThringletEmotionState;
      break;
    case 'scold':
    case 'threaten':
      newState = Math.random() > 0.6 
        ? 'angry' as ThringletEmotionState 
        : 'sad' as ThringletEmotionState;
      break;
    case 'question':
      newState = 'curious' as ThringletEmotionState;
      break;
    case 'challenge':
      newState = 'excited' as ThringletEmotionState;
      break;
    default:
      newState = 'neutral' as ThringletEmotionState;
  }
  
  // Set new state
  thringlet.emotionState = newState;
  
  // Record the state change in history
  thringlet.stateHistory.push({
    state: newState,
    timestamp: Date.now(),
    trigger: interactionType
  });
  
  // Limit history size
  if (thringlet.stateHistory.length > 20) {
    thringlet.stateHistory = thringlet.stateHistory.slice(-20);
  }
  
  // Cache updated thringlet
  thringlets.set(thringlet.id, thringlet);
  
  return thringlet;
}

/**
 * Real mining function that generates a new block with transactions
 */
async function mineNewBlock() {
  try {
    // If no active miners, skip
    const activeMinersList = await minerDao.getAllActiveMiners(); // Use DAO
    if (!activeMinersList || activeMinersList.length === 0) {
      return;
    }
    
    // Get latest block
    const latest = await getLatestBlock();
    if (!latest) {
      return;
    }
    
    // Pick a random miner based on hash power
    // currentHashRate from DAO is already a number (MH/s)
    const totalHashrateSumMHs = activeMinersList.reduce((sum, miner) => {
      return sum + (Number(miner.currentHashRate) || 0);
    }, 0);

    if (totalHashrateSumMHs === 0) { // Avoid division by zero if all have 0 hashrate
        console.warn("No active miners with hashrate > 0. Skipping block mining.");
        return;
    }
    
    // Weighted random selection based on hashrate
    const selectedMinerIndex = weightedRandomSelection(
      activeMinersList.map(miner => (Number(miner.currentHashRate) || 0) / totalHashrateSumMHs)
    );
    
    if (selectedMinerIndex < 0) { // Should not happen if totalHashrateSumMHs > 0
      return;
    }
    
    const selectedMiner = activeMinersList[selectedMinerIndex];
    
    // Create block parameters
    const newHeight = latest.height + 1;
    const newDifficulty = adjustDifficulty(latest);
    const newTimestamp = Date.now();
    const newHash = crypto.createHash('sha256')
      .update(latest.hash + newHeight.toString() + newTimestamp.toString() + Math.random().toString())
      .digest('hex');
    
    // Get pending transactions (max 10)
    const blockTransactions = pendingTransactions.slice(0, 10).map(tx => tx.hash);
    
    // TODO: Implement halving logic for block rewards
    // TODO: Check against MAX_SUPPLY before creating rewards
    const currentBlockRewardUPVX = tokenomics.INITIAL_BLOCK_REWARD_UPVX; // This is a number
    const minerActualRewardUPVX = Math.floor(currentBlockRewardUPVX * tokenomics.MINER_REWARD_PERCENTAGE);
    const founderRewardUPVX = currentBlockRewardUPVX - minerActualRewardUPVX;

    // Create new block
    const newBlock: Block = {
      height: newHeight,
      hash: newHash,
      previousHash: latest.hash,
      timestamp: newTimestamp,
      transactions: blockTransactions,
      miner: selectedMiner.address,
      nonce: Math.floor(Math.random() * 1000000).toString(),
      difficulty: newDifficulty,
      reward: minerActualRewardUPVX.toString() // Miner's actual share in µPVX
    };
    
    // Store block
    const savedBlock = await blockDao.createBlock(newBlock);
    latestBlock = savedBlock; // Update service-scoped latestBlock
    
    // Create a reward transaction for the miner (their share)
    const minerRewardTx: Transaction = {
      hash: crypto.createHash('sha256')
        .update('miner_reward_' + selectedMiner.address + newTimestamp.toString())
        .digest('hex'),
      type: 'MINING_REWARD' as TransactionType,
      from: PVX_GENESIS_ADDRESS,
      to: selectedMiner.address,
      amount: minerActualRewardUPVX.toString(), // Miner's share in µPVX
      timestamp: newTimestamp,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed'
    };
    await transactionDao.createTransaction(minerRewardTx);
    
    // Create and store founder reward transaction if founderReward is greater than 0
    if (founderRewardUPVX > 0) {
      const founderRewardTx: Transaction = {
        hash: crypto.createHash('sha256').update(`founder_reward_mb_${newBlock.hash}_${newBlock.timestamp + 1}`).digest('hex'),
        type: 'FOUNDER_REWARD' as TransactionType, // Ensure 'FOUNDER_REWARD' is a valid TransactionType
        from: PVX_GENESIS_ADDRESS,
        to: tokenomics.FOUNDER_RESERVE_ADDRESS,
        amount: founderRewardUPVX.toString(),
        timestamp: newTimestamp + 1,
        nonce: 0,
        signature: generateRandomHash(),
        status: 'confirmed'
      };
      await transactionDao.createTransaction(founderRewardTx);
      broadcastTransaction(founderRewardTx); // Broadcast founder reward transaction
    }
    
    // Update miner stats in DB (totalRewards should reflect only the miner's portion)
    const updatedMinerStatsData = {
        ...selectedMiner,
        blocksMined: selectedMiner.blocksMined + 1,
        lastBlockMined: newTimestamp,
        totalRewards: (BigInt(selectedMiner.totalRewards) + BigInt(minerActualRewardUPVX)).toString(),
    };
    await minerDao.updateMinerStats(updatedMinerStatsData);
    
    // Update miner wallet balance with their share
    const minerWallet = await walletDao.getWalletByAddress(selectedMiner.address);
    if (minerWallet) {
      const currentBalance = BigInt(minerWallet.balance);
      const newBalance = currentBalance + BigInt(minerActualRewardUPVX);
      minerWallet.balance = newBalance.toString();
      minerWallet.lastUpdated = new Date();
      await walletDao.updateWallet(minerWallet);
    }
    
    // Check for mining badges
    try {
      await checkMiningBadges(selectedMiner.address, selectedMiner.blocksMined);
    } catch (err) {
      console.error('Error checking mining badges:', err);
    }
    
    // Update blockchain status
    blockchainStatus = {
      ...blockchainStatus,
      connected: true,
      latestBlock: {
        height: newBlock.height,
        hash: newBlock.hash,
        timestamp: newBlock.timestamp
      },
      difficulty: newBlock.difficulty
    };
    
    // Broadcast new block and miner's reward transaction via WebSocket
    try {
      broadcastBlock(newBlock);
      broadcastTransaction(minerRewardTx); // Broadcast miner's reward
      broadcastStatusUpdate(blockchainStatus);
    } catch (err) {
      console.error('Error broadcasting via WebSocket:', err);
    }
    
    // Clear processed transactions from pending
    const processed = blockTransactions;
    pendingTransactions = pendingTransactions.filter(tx => !processed.includes(tx.hash));
    
    console.log(`New block mined: ${newBlock.height} by ${selectedMiner.address.substring(0, 10)}...`);
  } catch (error) {
    console.error('Error mining new block:', error);
  }
}

/**
 * Helper function for weighted random selection
 */
function weightedRandomSelection(weights: number[]): number {
  if (!weights.length) return -1;
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const randomValue = Math.random() * totalWeight;
  
  let weightSum = 0;
  for (let i = 0; i < weights.length; i++) {
    weightSum += weights[i];
    if (randomValue <= weightSum) {
      return i;
    }
  }
  
  return weights.length - 1;
}

/**
 * Calculate staking rewards for all active stakes
 */
async function distributeStakingRewards() {
  try {
    // Get all active stakes
    const now = Date.now();
    // Fetch Staking Pools from DB
    const stakingPools = await stakeDao.getStakingPools();
    
    for (const pool of stakingPools) {
      // Get all active stakes for this pool from DB
      const activeStakes = await stakeDao.getActiveStakesByPoolId(pool.id);
      
      // Skip if no active stakes
      if (!activeStakes || activeStakes.length === 0) {
        continue;
      }
      
      // Process each stake
      for (const stake of activeStakes) {
        // Skip if already rewarded recently (within last day)
        if (stake.lastRewardTime && (now - stake.lastRewardTime) < 24 * 60 * 60 * 1000) {
          continue;
        }
        
        // Calculate reward based on pool APY and stake amount
        // APY is in percentage, convert to daily rate
        const dailyRate = pool.apy / 365 / 100;
        const reward = Math.floor(BigInt(stake.amount) * BigInt(Math.floor(dailyRate * 10000)) / BigInt(10000)).toString();
        
        if (BigInt(reward) <= BigInt(0)) {
          continue;
        }
        
        // Update stake record in DB
        const updatedStakeRecord = {
          ...stake,
          lastRewardTime: now,
          rewards: (BigInt(stake.rewards || '0') + BigInt(reward)).toString()
        };
        await stakeDao.updateStakeRecord(updatedStakeRecord);
        
        // Create reward transaction
        const rewardTx: Transaction = {
            hash: crypto.createHash('sha256')
              .update('stake_reward_' + stake.walletAddress + now.toString())
              .digest('hex'),
            type: 'STAKING_REWARD' as TransactionType, 
            from: 'PVX_COINBASE',
            to: stake.walletAddress,
            amount: reward,
            timestamp: now,
            nonce: Math.floor(Math.random() * 100000),
            signature: generateRandomHash(),
            status: 'confirmed'
        };
        
        // Persist transaction to database
        // The transactionDao is already imported at the top of the file.
        // No need to dynamically import it here.
        const txForDb: Transaction = { // Ensure this object matches what transactionDao expects
          hash: rewardTx.hash,
          type: rewardTx.type as TransactionType,
          from: rewardTx.from,
          to: rewardTx.to,
          amount: rewardTx.amount, // transactionDao expects string or number based on its own conversion
          timestamp: rewardTx.timestamp,
          nonce: rewardTx.nonce,
          signature: rewardTx.signature,
          status: rewardTx.status as 'pending' | 'confirmed' | 'failed',
          blockHeight: rewardTx.blockHeight,
          fee: rewardTx.fee,
          metadata: {
            stakeId: stake.id,
            poolId: stake.poolId,
            poolApr: pool.apy || pool.apr, // Ensure pool.apy or pool.apr is defined
            rewardDate: now
          }
        };

        try {
          await transactionDao.createTransaction(txForDb);
          console.log(`Staking reward transaction [${rewardTx.hash}] persisted to database for ${stake.walletAddress}`);
        } catch (dbError) {
          console.error('Failed to persist staking reward to database:', dbError);
          // Decide if we should continue or throw, for now, it continues
        }
        
        // Update wallet balance
        const wallet = await walletDao.getWalletByAddress(stake.walletAddress);
        if (wallet) {
          wallet.balance = (BigInt(wallet.balance) + BigInt(reward)).toString();
          wallet.lastUpdated = new Date();
          await walletDao.updateWallet(wallet);
        }
        
        // Broadcast reward transaction
        try {
          broadcastTransaction(rewardTx);
        } catch (err) {
          console.error('Error broadcasting staking reward via WebSocket:', err);
        }
        
        console.log(`Staking reward: ${reward} μPVX sent to ${stake.walletAddress}`);
      }
    }
  } catch (error) {
    console.error('Error distributing staking rewards:', error);
  }
}

/**
 * Start the blockchain mining and staking processes
 */
function startBlockchainProcesses() {
  // Schedule block mining every minute
  if (miningTimeout) {
    clearInterval(miningTimeout);
  }
  
  miningTimeout = setInterval(async () => {
    await mineNewBlock();
  }, PVX_MINING_INTERVAL_MS);
  
  // Schedule staking rewards distribution (every 6 hours)
  if (stakingTimeout) {
    clearInterval(stakingTimeout);
  }
  
  stakingTimeout = setInterval(async () => {
    await distributeStakingRewards();
  }, 6 * 60 * 60 * 1000);
}

/**
 * Initialize the blockchain
 * This should be called at server startup
 */
// Make this function exportable to match the import in server/index.ts
export async function initializeBlockchain() {
  try {
    await connectToBlockchain();
    startBlockchainProcesses();
    console.log('Blockchain initialized and running');
    return blockchainStatus;
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    return blockchainStatus;
  }
}

/**
 * Get paginated addresses for explorer
 */
export async function getPaginatedAddresses(page: number = 1, limit: number = 10): Promise<{
  addresses: any[],
  total: number
}> {
  const allWallets = await getAllWallets();
  const total = allWallets.length;
  
  // Sort by balance (descending)
  allWallets.sort((a, b) => {
    return Number(BigInt(b.balance) - BigInt(a.balance));
  });
  
  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedWallets = allWallets.slice(start, end);
  
  // Format response
  const addresses = paginatedWallets.map(wallet => ({
    address: wallet.address,
    balance: wallet.balance,
    shortAddress: shortenAddress(wallet.address),
    transactions: Math.floor(Math.random() * 50), // Mocked for demo
    firstSeen: wallet.createdAt
  }));
  
  return {
    addresses,
    total
  };
}

/**
 * Get a mock thringlet for the given NFT ID
 */
export function getThringletById(id: string): Thringlet {
  // Generate a mockthringlet
  return {
    id,
    name: `Thringlet #${id.substring(0, 4)}`,
    description: "A digital companion with a mind of its own.",
    owner: `PVX_${generateRandomHash().substring(0, 16)}`,
    metadata: {
      imageUrl: `https://placekitten.com/200/200?id=${id}`,
      attributes: {
        rarity: "rare",
        intelligence: Math.floor(Math.random() * 100),
        mutations: Math.floor(Math.random() * 10),
      }
    },
    createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
    zk_verified: true,
    emotionState: 'neutral' as ThringletEmotionState,
    lastInteraction: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
    interactionCount: Math.floor(Math.random() * 100),
    stateHistory: [],
    abilities: [
      "Adaptive Learning",
      "Quantum Tunneling",
      "Emotional Resonance",
      "Stealth Mode"
    ]
  };
}

/**
 * Helper function to shorten addresses for display
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Export blockchain service object for unified access
 */
export const blockchainService = {
  // Core blockchain functions
  initializeBlockchain,
  connectToBlockchain,
  getBlockchainStatus,
  getLatestBlock,
  getBlockByHash,
  getBlockByHeight,
  getRecentBlocks,
  getRecentTransactions,
  getBlockchainTrends,
  
  // Mining functions
  startMining,
  stopMining,
  getMiningStats,
  getMiningRewards,
  
  // Transaction functions
  getTransactionsByAddress,
  getTransactionByHash,
  createTransaction,
  
  // Wallet functions
  createWallet,
  getWalletByAddress,
  updateWalletBalance,
  getAllWallets,
  getPaginatedAddresses,
  
  // Utility functions
  shortenAddress,
  generateRandomHash,
  
  // Thringlet functions
  getThringletById,
  simulateThringletInteraction,
  
  // Internal blockchain instance
  blockchain: {
    memBlockchainStorage,
    blockchainStatus,
    latestBlock
  }
};

/**
 * Get aggregated blockchain information details.
 */
export async function getBlockchainInfoDetails() {
  try {
    const latestDbBlock = await blockDao.getLatestBlock();
    const totalTransactions = await transactionDao.getTotalTransactionCount();
    const { totalHashrate: currentNetworkHashrateTHs } = await getNetworkHashrate();

    return {
      version: '1.0.0', // Hardcoded as per instruction
      network: 'PVX-MAINNET', // Hardcoded
      currentBlock: latestDbBlock?.height || 0,
      difficulty: latestDbBlock?.difficulty || PVX_MIN_DIFFICULTY,
      hashRate: `${currentNetworkHashrateTHs.toFixed(2)} TH/s`,
      totalSupply: PVX_INITIAL_SUPPLY,
      circulatingSupply: PVX_INITIAL_SUPPLY, // Mock: same as total supply for now
      consensus: 'Hybrid PoW+PoS+zkSNARK', // Hardcoded
      totalTransactions: totalTransactions,
      activeValidators: 50, // Mock placeholder
      lastBlockTimestamp: latestDbBlock?.timestamp || 0,
      averageBlockTime: PVX_BLOCK_TIME, // Constant
    };
  } catch (error) {
    console.error('Error in getBlockchainInfoDetails:', error);
    throw new Error('Failed to get blockchain info details');
  }
}

/**
 * Get live blockchain metrics for the /api/blockchain/metrics endpoint.
 */
export async function getLiveBlockchainMetrics() {
  try {
    const latestDbBlock = await blockDao.getLatestBlock();
    const { totalHashrate, activeMinersCount } = await getNetworkHashrate();
    const totalDbTransactions = await transactionDao.getTotalTransactionCount();

    return {
      latestBlockHeight: latestDbBlock?.height || 0,
      difficulty: latestDbBlock?.difficulty || PVX_MIN_DIFFICULTY,
      networkHashRate: `${totalHashrate.toFixed(2)} TH/s`, // TH/s
      lastBlockTime: latestDbBlock?.timestamp || 0,
      activeMiners: activeMinersCount,
      pendingTransactionsCount: pendingTransactions.length, // from service-scoped array
      totalTransactionsCount: totalDbTransactions,
    };
  } catch (error) {
    console.error('Error in getLiveBlockchainMetrics:', error);
    throw new Error('Failed to get live blockchain metrics');
  }
}