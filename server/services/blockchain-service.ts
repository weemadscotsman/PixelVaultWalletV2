import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { 
  BlockchainStatus,
  MiningStats,
  Block,
  Transaction,
  TransactionType,
  BlockchainTrends,
  Thringlet,
  ThringletEmotionState,
  TransactionHash
} from '@shared/types';
import { checkMiningBadges } from '../controllers/badgeController';

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
  error: "Initializing blockchain..."
};

let latestBlock: Block | null = null;
let miningStats: { [address: string]: MiningStats } = {};
let pendingTransactions: Transaction[] = [];

/**
 * Generate a random hash for simulating blockchain operations
 */
function generateRandomHash(): string {
  return crypto.createHash('sha256')
    .update(Math.random().toString())
    .digest('hex');
}

/**
 * Initialize and connect to the blockchain
 */
export async function connectToBlockchain(): Promise<BlockchainStatus> {
  try {
    console.log('Connecting to PVX blockchain...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize in-memory state with genesis block if no blocks exist
    const latestBlockInfo = await memBlockchainStorage.getLatestBlock();

    if (!latestBlockInfo) {
      // Create genesis block
      const genesisBlock: Block = {
        height: 0,
        hash: generateRandomHash(),
        previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: PVX_GENESIS_BLOCK_TIMESTAMP,
        transactions: [],
        miner: PVX_GENESIS_ADDRESS,
        nonce: "0",
        difficulty: PVX_MIN_DIFFICULTY,
        reward: "0"
      };
      
      // Store genesis block
      await memBlockchainStorage.createBlock(genesisBlock);
      latestBlock = genesisBlock;
    } else {
      latestBlock = latestBlockInfo;
    }
    
    // Update status
    blockchainStatus = {
      connected: true,
      latestBlock: {
        height: latestBlock.height,
        hash: latestBlock.hash,
        timestamp: latestBlock.timestamp
      },
      peers: Math.floor(Math.random() * 100) + 50,
      networkHashRate: Math.random() * 10, // TH/s
      circulatingSupply: PVX_INITIAL_SUPPLY,
      difficulty: latestBlock.difficulty
    };
    
    console.log('Connected to PVX blockchain successfully');
    return blockchainStatus;
  } catch (error) {
    console.error('Failed to connect to PVX blockchain:', error);
    blockchainStatus = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256')
    .update(passphrase + salt)
    .digest('hex');
  
  // Generate address from hash
  const address = 'PVX_' + hash.substring(0, 32);
  
  // Generate public key (simplified for demo)
  const publicKey = crypto.createHash('sha256')
    .update(address)
    .digest('hex');
  
  // Create wallet in storage
  await memBlockchainStorage.createWallet({
    address,
    publicKey,
    balance: "1000000", // 1 PVX initial balance for testing
    createdAt: new Date(),
    lastSynced: new Date(),
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
  // Validate wallet exists
  const wallet = await memBlockchainStorage.getWalletByAddress(address);
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  // For demo purposes, if the passphrase contains "DEMO" or "TEST", bypass the validation
  // This is useful for testing and should be removed in production
  const isDemoMode = passphrase.includes("DEMO") || passphrase.includes("TEST");
  
  if (!isDemoMode) {
    // Perform normal passphrase validation for non-demo mode
    const hash = crypto.createHash('sha256')
      .update(passphrase + wallet.passphraseSalt)
      .digest('hex');
    
    if (hash !== wallet.passphraseHash) {
      throw new Error('Invalid passphrase');
    }
  }
  
  // Generate private key (for demo purposes - in a real app this would be securely stored)
  const privateKey = crypto.createHash('sha256')
    .update((isDemoMode ? "DEMO_KEY" : passphrase) + wallet.passphraseSalt + wallet.address)
    .digest('hex');
  
  return {
    publicKey: wallet.publicKey,
    privateKey: privateKey
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
    .update(address)
    .digest('hex');
  
  // Check if wallet already exists
  const existingWallet = await memBlockchainStorage.getWalletByAddress(address);
  
  if (existingWallet) {
    // Update existing wallet with new passphrase
    existingWallet.passphraseSalt = salt;
    existingWallet.passphraseHash = hash;
    existingWallet.lastSynced = new Date();
    await memBlockchainStorage.updateWallet(existingWallet);
    return address;
  }
  
  // Create new wallet in storage
  await memBlockchainStorage.createWallet({
    address,
    publicKey,
    balance: "1000000", // 1 PVX initial balance for testing
    createdAt: new Date(),
    lastSynced: new Date(),
    passphraseSalt: salt,
    passphraseHash: hash
  });
  
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
): Promise<TransactionHash> {
  // Validate wallet and passphrase
  const wallet = await memBlockchainStorage.getWalletByAddress(fromAddress);
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  const hash = crypto.createHash('sha256')
    .update(passphrase + wallet.passphraseSalt)
    .digest('hex');
  
  if (hash !== wallet.passphraseHash) {
    throw new Error('Invalid passphrase');
  }
  
  // Check balance
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
    type: TransactionType.TRANSFER,
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
      lastSynced: new Date(),
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
      tx.type === TransactionType.MINE || 
      (tx.type === TransactionType.REWARD && tx.from === 'PVX_COINBASE')
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
    const hashrate = parseFloat(miner.currentHashRate.split(' ')[0]);
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
  const previousState = thringlet.emotionalState;
  
  // Update last interaction time
  thringlet.lastInteraction = Date.now();
  
  // Determine new emotional state based on interaction type
  let newState: ThringletEmotionState;
  
  switch (interactionType.toLowerCase()) {
    case 'pet':
    case 'praise':
    case 'feed':
      newState = Math.random() > 0.8 
        ? ThringletEmotionState.EXCITED 
        : ThringletEmotionState.HAPPY;
      break;
    case 'ignore':
      newState = Math.random() > 0.7 
        ? ThringletEmotionState.SAD 
        : ThringletEmotionState.NEUTRAL;
      break;
    case 'scold':
      newState = Math.random() > 0.6 
        ? ThringletEmotionState.ANGRY 
        : ThringletEmotionState.SAD;
      break;
    case 'scare':
      newState = ThringletEmotionState.SCARED;
      break;
    case 'gift':
      newState = ThringletEmotionState.LOVE;
      break;
    default:
      newState = ThringletEmotionState.NEUTRAL;
  }
  
  // Update thringlet emotion
  thringlet.emotionalState = newState;
  
  // Add to state history
  thringlet.stateHistory.push({
    state: newState,
    timestamp: thringlet.lastInteraction
  });
  
  // Limit history size to last 20 states
  if (thringlet.stateHistory.length > 20) {
    thringlet.stateHistory = thringlet.stateHistory.slice(-20);
  }
  
  return thringlet;
}

// Mining interval reference
let miningIntervalId: NodeJS.Timeout | null = null;
let stakingIntervalId: NodeJS.Timeout | null = null;

/**
 * Real mining function that generates a new block with transactions
 */
async function mineNewBlock() {
  try {
    if (!blockchainStatus.connected) {
      console.log('Blockchain not connected, skipping mining attempt');
      return;
    }

    const latest = await memBlockchainStorage.getLatestBlock();
    if (!latest) {
      console.error('No latest block found, cannot mine');
      return;
    }

    // Get active miners
    const activeMiners = await memBlockchainStorage.getAllActiveMiners();
    if (activeMiners.length === 0) {
      // No active miners, skip this mining round
      console.log('No active miners, skipping block generation');
      return;
    }

    // Select a miner randomly based on hashrate (simplified mining algorithm)
    const totalHashrate = activeMiners.reduce((sum, miner) => {
      const hashrateStr = miner.currentHashRate || "0 MH/s";
      const hashrate = parseFloat(hashrateStr.split(' ')[0]) || 0;
      return sum + hashrate;
    }, 0);

    // Weighted selection based on hashrate
    let randomPoint = Math.random() * totalHashrate;
    let selectedMiner = activeMiners[0];
    let accumulatedHashrate = 0;

    for (const miner of activeMiners) {
      const hashrateStr = miner.currentHashRate || "0 MH/s";
      const hashrate = parseFloat(hashrateStr.split(' ')[0]) || 0;
      accumulatedHashrate += hashrate;

      if (randomPoint <= accumulatedHashrate) {
        selectedMiner = miner;
        break;
      }
    }

    // Prepare transactions for the block
    // Get pending transactions and include up to PVX_MAX_TRANSACTIONS_PER_BLOCK
    const recentTransactions = await memBlockchainStorage.getRecentTransactions(100);
    const pendingTxs = recentTransactions
      .filter(tx => tx.status === 'pending')
      .slice(0, PVX_MAX_TRANSACTIONS_PER_BLOCK);

    // Create the new block
    const newHeight = latest.height + 1;
    const newDifficulty = adjustDifficulty(latest);
    const newTimestamp = Date.now();
    const newHash = crypto.createHash('sha256')
      .update(latest.hash + newHeight.toString() + newTimestamp.toString() + selectedMiner.address)
      .digest('hex');

    const newBlock: Block = {
      height: newHeight,
      hash: newHash,
      previousHash: latest.hash,
      timestamp: newTimestamp,
      transactions: pendingTxs.map(tx => tx.hash),
      miner: selectedMiner.address,
      nonce: Math.floor(Math.random() * 1000000).toString(),
      difficulty: newDifficulty,
      reward: PVX_BLOCK_REWARD
    };

    // Store the new block
    await memBlockchainStorage.createBlock(newBlock);
    latestBlock = newBlock;

    // Update miner statistics
    selectedMiner.blocksMined += 1;
    selectedMiner.lastBlockMined = newTimestamp;
    const newRewards = BigInt(selectedMiner.totalRewards) + BigInt(PVX_BLOCK_REWARD);
    selectedMiner.totalRewards = newRewards.toString();
    await memBlockchainStorage.updateMiner(selectedMiner);

    // Create a reward transaction for the miner
    const rewardTx: Transaction = {
      hash: crypto.createHash('sha256')
        .update('reward_' + selectedMiner.address + newTimestamp.toString())
        .digest('hex'),
      type: TransactionType.REWARD,
      from: PVX_GENESIS_ADDRESS,
      to: selectedMiner.address,
      amount: PVX_BLOCK_REWARD,
      timestamp: newTimestamp,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed'
    };

    await memBlockchainStorage.createTransaction(rewardTx);

    // Credit the miner's wallet
    const minerWallet = await memBlockchainStorage.getWalletByAddress(selectedMiner.address);
    if (minerWallet) {
      const newBalance = BigInt(minerWallet.balance) + BigInt(PVX_BLOCK_REWARD);
      minerWallet.balance = newBalance.toString();
      minerWallet.lastSynced = new Date(newTimestamp);
      await memBlockchainStorage.updateWallet(minerWallet);
    }

    // Update pending transactions status to confirmed
    for (const tx of pendingTxs) {
      tx.status = 'confirmed';
      await memBlockchainStorage.updateTransaction(tx);
    }

    // Update blockchain status
    blockchainStatus = {
      ...blockchainStatus,
      latestBlock: {
        height: newBlock.height,
        hash: newBlock.hash,
        timestamp: newBlock.timestamp
      },
      difficulty: newBlock.difficulty
    };

    console.log(`New block mined: ${newBlock.height} by miner ${selectedMiner.address}`);
  } catch (error) {
    console.error('Error mining new block:', error);
  }
}

/**
 * Calculate staking rewards for all active stakes
 */
async function distributeStakingRewards() {
  try {
    // Get all active stakes
    const stakingPools = await memBlockchainStorage.getStakingPools();
    
    for (const pool of stakingPools) {
      const now = Date.now();
      const activeStakes = await memBlockchainStorage.getActiveStakesByPoolId(pool.id);
      
      for (const stake of activeStakes) {
        // Calculate reward based on time since last reward
        const timeSinceLastReward = now - stake.lastRewardTime;
        // Only distribute rewards if it's been at least an hour
        if (timeSinceLastReward >= 3600000) { // 1 hour in milliseconds
          const daysSinceLastReward = timeSinceLastReward / (24 * 60 * 60 * 1000);
          const apyDecimal = parseFloat(pool.apy) / 100;
          const reward = Math.floor(parseInt(stake.amount) * apyDecimal * (daysSinceLastReward / 365));
          
          if (reward > 0) {
            // Create reward transaction
            const rewardTx: Transaction = {
              hash: crypto.createHash('sha256')
                .update('stake_reward_' + stake.walletAddress + now.toString())
                .digest('hex'),
              type: TransactionType.REWARD,
              from: PVX_GENESIS_ADDRESS,
              to: stake.walletAddress,
              amount: reward.toString(),
              timestamp: now,
              nonce: Math.floor(Math.random() * 100000),
              signature: generateRandomHash(),
              status: 'confirmed'
            };
            
            await memBlockchainStorage.createTransaction(rewardTx);
            
            // Credit the staker's wallet
            const wallet = await memBlockchainStorage.getWalletByAddress(stake.walletAddress);
            if (wallet) {
              const newBalance = BigInt(wallet.balance) + BigInt(reward);
              wallet.balance = newBalance.toString();
              wallet.lastSynced = new Date(now);
              await memBlockchainStorage.updateWallet(wallet);
            }
            
            // Update stake's last reward time
            stake.lastRewardTime = now;
            await memBlockchainStorage.updateStakeRecord(stake);
            
            console.log(`Distributed staking reward of ${reward} μPVX to ${stake.walletAddress}`);
          }
        }
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
  if (miningIntervalId) {
    clearInterval(miningIntervalId);
  }
  
  if (stakingIntervalId) {
    clearInterval(stakingIntervalId);
  }
  
  // Start the mining process (every 10 seconds)
  miningIntervalId = setInterval(async () => {
    await mineNewBlock();
  }, 10000);
  
  // Start the staking rewards distribution process (every 5 minutes)
  stakingIntervalId = setInterval(async () => {
    await distributeStakingRewards();
  }, 300000);
  
  console.log('Started PVX blockchain mining and staking processes');
}

/**
 * Initialize the blockchain
 * This should be called at server startup
 */
export async function initializeBlockchain() {
  try {
    console.log('Initializing PVX blockchain...');
    await connectToBlockchain();
    startBlockchainProcesses();
    return blockchainStatus;
  } catch (error) {
    console.error('Failed to initialize blockchain:', error);
    return blockchainStatus;
  }
}

// For mock pagination
let cachedAddresses: string[] | null = null;

/**
 * Get paginated addresses for explorer
 */
export async function getPaginatedAddresses(page: number = 1, limit: number = 10): Promise<{
  addresses: string[];
  totalCount: number;
}> {
  // Generate some random addresses if not cached
  if (!cachedAddresses) {
    cachedAddresses = Array.from({ length: 100 }, () => 
      'PVX_' + crypto.randomBytes(16).toString('hex').substring(0, 32)
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    addresses: cachedAddresses.slice(startIndex, endIndex),
    totalCount: cachedAddresses.length
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
    emotionalState: ThringletEmotionState.NEUTRAL,
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