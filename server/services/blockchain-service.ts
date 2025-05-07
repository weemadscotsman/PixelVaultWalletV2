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
  ThringletEmotionalState,
  TransactionHash
} from '@shared/types';

// Constants for PVX blockchain
const PVX_GENESIS_BLOCK_TIMESTAMP = 1714637462000; // May 1, 2024
const PVX_GENESIS_ADDRESS = "PVX_GENESIS_ADDR_00000000000000";
const PVX_INITIAL_SUPPLY = "6009420000000"; // In μPVX (6,009,420 PVX)
const PVX_MIN_DIFFICULTY = 0.5;
const PVX_MAX_DIFFICULTY = 5.0;
const PVX_BLOCK_REWARD = "5000000"; // 5 PVX
const PVX_BLOCK_TIME = 60; // 1 minute

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
 * Start mining with address
 */
export async function startMining(address: string): Promise<MiningStats> {
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
  
  // Generate random hashrate between 10 and 200 MH/s
  const hashRate = (Math.random() * 190 + 10).toFixed(2);
  
  const stats: MiningStats = {
    address,
    blocksMined: minerStats ? minerStats.blocksMined : 0,
    totalRewards: minerStats ? minerStats.totalRewards : "0",
    isCurrentlyMining: true,
    currentHashRate: hashRate + " MH/s",
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
      
      // Get latest block
      const currentLatestBlock = await getLatestBlock();
      
      if (!currentLatestBlock) {
        return;
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
      
      // Schedule next block
      simulateBlockMining(minerAddress);
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
 * Get blockchain trends data for visualization
 */
export function getBlockchainTrends(): BlockchainTrends {
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
  thringlet.interactionCount += 1;
  
  // Record previous state
  const previousState = thringlet.emotionalState;
  
  // Update last interaction time
  thringlet.lastInteraction = Date.now();
  
  // Determine new emotional state based on interaction type
  let newState: ThringletEmotionalState;
  
  switch (interactionType.toLowerCase()) {
    case 'pet':
    case 'praise':
    case 'feed':
      newState = Math.random() > 0.8 
        ? ThringletEmotionalState.EXCITED 
        : ThringletEmotionalState.HAPPY;
      break;
    case 'ignore':
      newState = Math.random() > 0.7 
        ? ThringletEmotionalState.SAD 
        : ThringletEmotionalState.NEUTRAL;
      break;
    case 'scold':
      newState = Math.random() > 0.6 
        ? ThringletEmotionalState.ANGRY 
        : ThringletEmotionalState.SAD;
      break;
    case 'scare':
      newState = ThringletEmotionalState.SCARED;
      break;
    case 'gift':
      newState = ThringletEmotionalState.LOVE;
      break;
    default:
      newState = ThringletEmotionalState.NEUTRAL;
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

/**
 * Initialize the blockchain
 * This should be called at server startup
 */
export async function initializeBlockchain() {
  try {
    await connectToBlockchain();
    return blockchainStatus;
  } catch (error) {
    console.error('Failed to initialize blockchain:', error);
    return blockchainStatus;
  }
}

// Helper functions to retrieve blockchain data

/**
 * Get recent blocks (last n blocks)
 */
export async function getRecentBlocks(limit: number = 10): Promise<Block[]> {
  return await memBlockchainStorage.getRecentBlocks(limit);
}

/**
 * Get recent transactions (last n transactions)
 */
export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  return await memBlockchainStorage.getRecentTransactions(limit);
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
    emotionalState: ThringletEmotionalState.NEUTRAL,
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