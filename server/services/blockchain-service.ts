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

// Constants for PVX blockchain
const PVX_GENESIS_BLOCK_TIMESTAMP = 1714637462000; // May 1, 2024
const PVX_GENESIS_ADDRESS = "PVX_GENESIS_ADDR_00000000000000";
const PVX_INITIAL_SUPPLY = "6009420000000"; // In μPVX (6,009,420 PVX)
const PVX_MIN_DIFFICULTY = 0.5;
const PVX_MAX_DIFFICULTY = 5.0;
const PVX_BLOCK_REWARD = "5000000"; // 5 PVX
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
    const existingLatestBlock = await memBlockchainStorage.getLatestBlock();
    
    if (!existingLatestBlock) {
      console.log('No blocks found, creating genesis block...');
      
      const genesisBlock: Block = {
        height: 1,
        hash: generateRandomHash(),
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: PVX_GENESIS_BLOCK_TIMESTAMP,
        transactions: [],
        miner: PVX_GENESIS_ADDRESS,
        nonce: '0',
        difficulty: PVX_MIN_DIFFICULTY,
        reward: '0'
      };
      
      await memBlockchainStorage.createBlock(genesisBlock);
      latestBlock = genesisBlock;
    } else {
      latestBlock = existingLatestBlock;
    }
    
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
 * Create a new wallet
 */
export async function createWallet(passphrase: string): Promise<string> {
  // Generate a new wallet address and keys
  const privateKey = crypto.randomBytes(32).toString('hex');
  const publicKey = crypto.createHash('sha256')
    .update(privateKey)
    .digest('hex');
  
  const address = 'PVX_' + publicKey.substring(0, 32);
  
  // Hash the passphrase
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(passphrase + salt)
    .digest('hex');
  
  // Store the wallet in memory with initial PVX
  await memBlockchainStorage.createWallet({
    address,
    publicKey,
    balance: "100000", // 0.1 PVX as starting balance for testing
    createdAt: new Date(),
    lastUpdated: new Date(), // Changed from lastSynced to match database schema
    passphraseSalt: salt,
    passphraseHash: hash
  });
  
  return address;
}

/**
 * Get wallet by address
 */
export async function getWallet(address: string) {
  return await memBlockchainStorage.getWalletByAddress(address);
}

/**
 * Export wallet keys by address and passphrase
 */
export async function exportWalletKeys(address: string, passphrase: string) {
  const wallet = await memBlockchainStorage.getWalletByAddress(address);
  
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
  const existingWallet = await memBlockchainStorage.getWalletByAddress(address);
  
  if (existingWallet) {
    // Update existing wallet passphrase
    existingWallet.passphraseSalt = salt;
    existingWallet.passphraseHash = hash;
    existingWallet.lastUpdated = new Date(); // Changed from lastSynced to match database schema
    await memBlockchainStorage.updateWallet(existingWallet);
  } else {
    // Create new wallet
    await memBlockchainStorage.createWallet({
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
  const wallet = await memBlockchainStorage.getWalletByAddress(fromAddress);
  
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
  await memBlockchainStorage.updateWallet(wallet);
  
  // Add to or create receiver wallet
  const receiverWallet = await memBlockchainStorage.getWalletByAddress(toAddress);
  if (receiverWallet) {
    const receiverBalance = BigInt(receiverWallet.balance) + BigInt(amount);
    receiverWallet.balance = receiverBalance.toString();
    await memBlockchainStorage.updateWallet(receiverWallet);
  } else {
    // Create receiver wallet if it doesn't exist
    await memBlockchainStorage.createWallet({
      address: toAddress,
      publicKey: generateRandomHash(),
      balance: amount,
      createdAt: new Date(),
      lastUpdated: new Date(), // Changed from lastSynced to match database schema
      passphraseSalt: '',
      passphraseHash: ''
    });
  }
  
  // Store transaction
  await memBlockchainStorage.createTransaction(transaction);
  
  // Add to pending transactions
  pendingTransactions.push(transaction);
  
  return txHash;
}

/**
 * Start mining with address and hardware type
 */
export async function startMining(address: string, hardwareType: string = 'cpu'): Promise<MiningStats> {
  // Validate wallet
  const wallet = await memBlockchainStorage.getWalletByAddress(address);
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Check if already mining
  let minerStats = await memBlockchainStorage.getMinerByAddress(address);
  
  if (minerStats && minerStats.isCurrentlyMining) {
    throw new Error('Already mining');
  }
  
  // Generate hashrate based on hardware type
  let hashRate: string;
  let hardwareName: string;
  
  switch (hardwareType.toLowerCase()) {
    case 'cpu':
      // CPU: 10-100 MH/s
      hashRate = (Math.random() * 90 + 10).toFixed(2);
      hardwareName = 'CPU';
      break;
    case 'gpu':
      // GPU: 100-500 MH/s
      hashRate = (Math.random() * 400 + 100).toFixed(2);
      hardwareName = 'GPU';
      break;
    case 'asic':
      // ASIC: 500-2000 MH/s
      hashRate = (Math.random() * 1500 + 500).toFixed(2);
      hardwareName = 'ASIC';
      break;
    default:
      // Default to CPU if invalid type
      hashRate = (Math.random() * 90 + 10).toFixed(2);
      hardwareName = 'CPU';
  }
  
  const stats: MiningStats = {
    address,
    blocksMined: minerStats ? minerStats.blocksMined : 0,
    totalRewards: minerStats ? minerStats.totalRewards : "0",
    isCurrentlyMining: true,
    currentHashRate: hashRate + " MH/s",
    hardwareType: hardwareName,
    lastBlockMined: minerStats ? minerStats.lastBlockMined : undefined
  };
  
  // Update or create miner stats
  if (minerStats) {
    await memBlockchainStorage.updateMiner(stats);
  } else {
    await memBlockchainStorage.createMiner(stats);
  }
  
  // Schedule mock block mining (for demo purposes)
  simulateBlockMining(address);
  
  return stats;
}

/**
 * Stop mining with address
 */
export async function stopMining(address: string): Promise<MiningStats> {
  // Validate wallet
  const wallet = await memBlockchainStorage.getWalletByAddress(address);
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // Check if mining
  const minerStats = await memBlockchainStorage.getMinerByAddress(address);
  
  if (!minerStats || !minerStats.isCurrentlyMining) {
    throw new Error('Not mining');
  }
  
  // Update miner stats
  minerStats.isCurrentlyMining = false;
  await memBlockchainStorage.updateMiner(minerStats);
  
  return minerStats;
}

/**
 * Get mining stats
 */
export async function getMiningStats(address: string): Promise<MiningStats> {
  const minerStats = await memBlockchainStorage.getMinerByAddress(address);
  
  if (!minerStats) {
    return {
      address,
      blocksMined: 0,
      totalRewards: "0",
      isCurrentlyMining: false,
      currentHashRate: "0 MH/s"
    };
  }
  
  return minerStats;
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
 * Get network hashrate
 */
export async function getNetworkHashrate(): Promise<number> {
  // Sum up all active miners' hashrates
  const activeMiners = await memBlockchainStorage.getAllActiveMiners();
  
  if (!activeMiners || activeMiners.length === 0) {
    return 0;
  }
  
  const totalHashrate = activeMiners.reduce((sum: number, miner: MiningStats) => {
    const hashrate = parseFloat(miner.hashRate || '0');
    return sum + hashrate;
  }, 0);
  
  // Convert to TH/s
  return totalHashrate / 1000;
}

/**
 * Force mine a block (for testing)
 */
export async function forceMineBlock(minerAddress: string): Promise<Block | null> {
  try {
    // Get miner stats to check if registered as a miner
    let minerStats = await memBlockchainStorage.getMinerByAddress(minerAddress);
    
    // Create miner stats if not exists
    if (!minerStats) {
      minerStats = {
        address: minerAddress,
        blocksMined: 0,
        totalRewards: "0",
        isCurrentlyMining: true,
        currentHashRate: `${(Math.random() * 200 + 50).toFixed(2)} MH/s`
      };
      await memBlockchainStorage.createMiner(minerStats);
    }
    
    // Get latest block
    const currentLatestBlock = await getLatestBlock();
    
    if (!currentLatestBlock) {
      return null;
    }
    
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
      reward: PVX_BLOCK_REWARD
    };
    
    // Store new block
    await memBlockchainStorage.createBlock(newBlock);
    latestBlock = newBlock;
    
    // Update miner stats
    minerStats.blocksMined += 1;
    minerStats.lastBlockMined = newBlock.timestamp;
    minerStats.totalRewards = (BigInt(minerStats.totalRewards) + BigInt(PVX_BLOCK_REWARD)).toString();
    await memBlockchainStorage.updateMiner(minerStats);
    
    // Update wallet balance
    const wallet = await memBlockchainStorage.getWalletByAddress(minerAddress);
    if (wallet) {
      wallet.balance = (BigInt(wallet.balance) + BigInt(PVX_BLOCK_REWARD)).toString();
      await memBlockchainStorage.updateWallet(wallet);
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
      const minerStats = await memBlockchainStorage.getMinerByAddress(minerAddress);
      
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
  return await memBlockchainStorage.getLatestBlock();
}

/**
 * Get block by height
 */
export async function getBlockByHeight(height: number): Promise<Block | null> {
  return await memBlockchainStorage.getBlockByHeight(height);
}

/**
 * Get transaction by hash
 */
export async function getTransactionByHash(hash: string): Promise<Transaction | null> {
  return await memBlockchainStorage.getTransactionByHash(hash);
}

/**
 * Get transactions by address
 */
export async function getTransactionsByAddress(address: string): Promise<Transaction[]> {
  return await memBlockchainStorage.getTransactionsByAddress(address);
}

/**
 * Get all wallets
 */
export async function getAllWallets() {
  const allWallets = [];
  
  // Get all wallets from storage with memory implementation 
  // Based on the in-memory map in MemBlockchainStorage
  const walletEntries = Array.from(memBlockchainStorage.wallets.entries());
  
  for (const [_, wallet] of walletEntries) {
    allWallets.push(wallet);
  }
  
  return allWallets;
}

/**
 * Get blockchain trends data for visualization
 */
export async function getRecentBlocks(limit: number = 10): Promise<Block[]> {
  return await memBlockchainStorage.getRecentBlocks(limit);
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  return await memBlockchainStorage.getRecentTransactions(limit);
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
    const activeMiners = await memBlockchainStorage.getAllActiveMiners();
    if (!activeMiners || activeMiners.length === 0) {
      return;
    }
    
    // Get latest block
    const latest = await getLatestBlock();
    if (!latest) {
      return;
    }
    
    // Pick a random miner based on hash power
    const totalHashrate = activeMiners.reduce((sum, miner) => {
      const hashrate = parseFloat(miner.hashRate || '0');
      return sum + hashrate;
    }, 0);
    
    // Weighted random selection based on hashrate
    const selectedMinerIndex = weightedRandomSelection(
      activeMiners.map(miner => parseFloat(miner.hashRate || '0') / totalHashrate)
    );
    
    if (selectedMinerIndex < 0) {
      return;
    }
    
    const selectedMiner = activeMiners[selectedMinerIndex];
    
    // Create block parameters
    const newHeight = latest.height + 1;
    const newDifficulty = adjustDifficulty(latest);
    const newTimestamp = Date.now();
    const newHash = crypto.createHash('sha256')
      .update(latest.hash + newHeight.toString() + newTimestamp.toString() + Math.random().toString())
      .digest('hex');
    
    // Get pending transactions (max 10)
    const blockTransactions = pendingTransactions.slice(0, 10).map(tx => tx.hash);
    
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
      reward: PVX_BLOCK_REWARD
    };
    
    // Store block
    await memBlockchainStorage.createBlock(newBlock);
    latestBlock = newBlock;
    
    // Create a reward transaction for the miner
    const rewardTx: Transaction = {
      hash: crypto.createHash('sha256')
        .update('reward_' + selectedMiner.address + newTimestamp.toString())
        .digest('hex'),
      type: 'MINING_REWARD' as TransactionType,
      from: PVX_GENESIS_ADDRESS,
      to: selectedMiner.address,
      amount: PVX_BLOCK_REWARD,
      timestamp: newTimestamp,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed'
    };
    
    // Store reward transaction
    await memBlockchainStorage.createTransaction(rewardTx);
    
    // Update miner stats
    selectedMiner.blocksMined++;
    selectedMiner.lastBlockMined = newTimestamp;
    selectedMiner.totalRewards = (BigInt(selectedMiner.totalRewards) + BigInt(PVX_BLOCK_REWARD)).toString();
    await memBlockchainStorage.updateMiner(selectedMiner);
    
    // Update miner wallet balance
    const minerWallet = await memBlockchainStorage.getWalletByAddress(selectedMiner.address);
    if (minerWallet) {
      minerWallet.balance = (BigInt(minerWallet.balance) + BigInt(PVX_BLOCK_REWARD)).toString();
      await memBlockchainStorage.updateWallet(minerWallet);
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
    
    // Broadcast new block and transaction via WebSocket
    try {
      broadcastBlock(newBlock);
      broadcastTransaction(rewardTx);
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
    const stakingPools = await memBlockchainStorage.getStakingPools();
    
    for (const pool of stakingPools) {
      // Get all active stakes for this pool
      const activeStakes = await memBlockchainStorage.getActiveStakesByPoolId(pool.id);
      
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
        
        // Update stake record
        stake.lastRewardTime = now;
        stake.rewards = (BigInt(stake.rewards || '0') + BigInt(reward)).toString();
        await memBlockchainStorage.updateStakeRecord(stake);
        
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
        
        // Store reward transaction in memory first
        await memBlockchainStorage.createTransaction(rewardTx);
        
        // Persist transaction to database
        try {
          const { transactionDao } = await import('../database/transactionDao');
          
          // In TransactionDao.createTransaction, it expects a Transaction object and does the DB mapping internally
          // So we'll just create a Transaction with the metadata we need
          const txForDb: Transaction = {
            hash: rewardTx.hash,
            type: rewardTx.type as TransactionType,
            from: rewardTx.from,
            to: rewardTx.to,
            amount: Number(rewardTx.amount),
            timestamp: Number(rewardTx.timestamp),
            nonce: rewardTx.nonce,
            signature: rewardTx.signature,
            status: rewardTx.status as 'pending' | 'confirmed' | 'failed',
            blockHeight: rewardTx.blockHeight,
            fee: rewardTx.fee,
            metadata: {
              stakeId: stake.id,
              poolId: stake.poolId,
              poolApr: pool.apy || pool.apr,
              rewardDate: now
            }
          };
          
          // Store in database - the DAO will handle the field name conversion
          await transactionDao.createTransaction(txForDb);
          console.log(`Staking reward transaction [${rewardTx.hash}] persisted to database for ${stake.walletAddress}`);
        } catch (dbError) {
          console.error('Failed to persist staking reward to database:', dbError);
          // Continue even if database persistence fails
        }
        
        // Update wallet balance
        const wallet = await memBlockchainStorage.getWalletByAddress(stake.walletAddress);
        if (wallet) {
          wallet.balance = (BigInt(wallet.balance) + BigInt(reward)).toString();
          await memBlockchainStorage.updateWallet(wallet);
          
          // Also update the wallet in the database if possible
          try {
            const { walletDao } = await import('../database/walletDao');
            await walletDao.updateWallet(wallet);
            console.log(`Wallet balance updated in database for ${stake.walletAddress}`);
          } catch (dbError) {
            console.error('Failed to update wallet balance in database:', dbError);
            // Continue even if database update fails
          }
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