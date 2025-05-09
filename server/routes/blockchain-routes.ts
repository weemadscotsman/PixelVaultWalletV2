import express from 'express';
import * as blockchainService from '../services/blockchain-service';
import { authenticateJWT, validateWalletOwnership } from '../middleware/auth';
import { standardLimiter, miningLimiter, transactionLimiter } from '../middleware/rate-limiters';

const router = express.Router();

// Apply rate limiting to all blockchain routes
router.use(standardLimiter);

/**
 * Get blockchain metrics - key data for dashboard display
 * GET /api/blockchain/metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const status = blockchainService.getBlockchainStatus();
    const stats = {
      latestBlockHeight: status.height || 0,
      difficulty: status.difficulty || 1,
      hashRate: status.networkHashRate || "0 H/s",
      lastBlockTime: status.lastBlockTime || Date.now(),
      activeMiners: status.activeMiners || 0,
      pendingTransactions: status.pendingTransactions || 0,
      totalTransactions: status.totalTransactions || 0
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get blockchain metrics'
    });
  }
});

/**
 * Connect to blockchain
 * GET /api/blockchain/connect
 */
router.get('/connect', async (req, res) => {
  try {
    const status = await blockchainService.connectToBlockchain();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to connect to blockchain'
    });
  }
});

/**
 * Get blockchain status
 * GET /api/blockchain/status
 */
router.get('/status', (req, res) => {
  try {
    const status = blockchainService.getBlockchainStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get blockchain status'
    });
  }
});

/**
 * Get blockchain trends data
 * GET /api/blockchain/trends
 */
router.get('/trends', (req, res) => {
  try {
    const trends = blockchainService.getBlockchainTrends();
    res.json(trends);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get blockchain trends'
    });
  }
});

/**
 * Get latest block
 * GET /api/blockchain/latest-block
 */
router.get('/latest-block', async (req, res) => {
  try {
    const block = await blockchainService.getLatestBlock();
    res.json(block);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get latest block'
    });
  }
});

/**
 * Get recent blocks
 * GET /api/blockchain/blocks?limit=10
 */
router.get('/blocks', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const blocks = await blockchainService.getRecentBlocks(limit);
    res.json(blocks);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get blocks'
    });
  }
});

/**
 * Get block by height
 * GET /api/blockchain/block/:height
 */
router.get('/block/:height', async (req, res) => {
  try {
    const height = parseInt(req.params.height);
    if (isNaN(height)) {
      return res.status(400).json({ error: 'Invalid block height' });
    }
    
    const block = await blockchainService.getBlockByHeight(height);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    res.json(block);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get block'
    });
  }
});

/**
 * Get recent transactions
 * GET /api/blockchain/transactions?limit=10
 */
router.get('/transactions', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const transactions = await blockchainService.getRecentTransactions(limit);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transactions'
    });
  }
});

/**
 * Get transaction by hash
 * GET /api/blockchain/transaction/:hash
 */
router.get('/transaction/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    const transaction = await blockchainService.getTransactionByHash(hash);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transaction'
    });
  }
});

/**
 * Get transactions by address
 * GET /api/blockchain/address/:address/transactions
 */
router.get('/address/:address/transactions', async (req, res) => {
  try {
    const address = req.params.address;
    const transactions = await blockchainService.getTransactionsByAddress(address);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transactions'
    });
  }
});

/**
 * Create wallet
 * POST /api/blockchain/wallet
 */
router.post('/wallet', async (req, res) => {
  try {
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
    const address = await blockchainService.createWallet(passphrase);
    const wallet = await blockchainService.getWallet(address);
    
    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create wallet'
    });
  }
});

/**
 * Get wallet by address
 * GET /api/blockchain/wallet/:address
 */
router.get('/wallet/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const wallet = await blockchainService.getWallet(address);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    res.json(wallet);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get wallet'
    });
  }
});

/**
 * Export wallet keys
 * POST /api/blockchain/wallet/:address/export
 */
router.post('/wallet/:address/export', async (req, res) => {
  try {
    const { address } = req.params;
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
    const keys = await blockchainService.exportWalletKeys(address, passphrase);
    res.json(keys);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to export wallet keys'
    });
  }
});

/**
 * Import wallet
 * POST /api/blockchain/wallet/import
 */
router.post('/wallet/import', async (req, res) => {
  try {
    const { privateKey, passphrase } = req.body;
    
    if (!privateKey || !passphrase) {
      return res.status(400).json({ error: 'Private key and passphrase are required' });
    }
    
    const address = await blockchainService.importWallet(privateKey, passphrase);
    const wallet = await blockchainService.getWallet(address);
    
    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import wallet'
    });
  }
});

/**
 * Send transaction
 * POST /api/blockchain/transaction
 */
router.post('/transaction', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, passphrase } = req.body;
    
    if (!fromAddress || !toAddress || !amount || !passphrase) {
      return res.status(400).json({ 
        error: 'fromAddress, toAddress, amount, and passphrase are required' 
      });
    }
    
    const txHash = await blockchainService.sendTransaction(
      fromAddress, 
      toAddress, 
      amount, 
      passphrase
    );
    
    res.status(201).json({ hash: txHash });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send transaction'
    });
  }
});

/**
 * Start mining
 * POST /api/blockchain/mining/start
 */
router.post('/mining/start', authenticateJWT, validateWalletOwnership, miningLimiter, async (req, res) => {
  try {
    const { address, hardwareType } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Default to CPU if hardware type not specified
    const hardware = hardwareType || 'cpu';
    
    const miningStats = await blockchainService.startMining(address, hardware);
    res.json(miningStats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start mining'
    });
  }
});

/**
 * Stop mining
 * POST /api/blockchain/mining/stop
 */
router.post('/mining/stop', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const miningStats = await blockchainService.stopMining(address);
    res.json(miningStats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to stop mining'
    });
  }
});

/**
 * Get mining stats
 * GET /api/blockchain/mining/stats/:address
 */
router.get('/mining/stats/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const miningStats = await blockchainService.getMiningStats(address);
    res.json(miningStats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get mining stats'
    });
  }
});

/**
 * Get mining rewards for an address
 * GET /api/blockchain/mining/rewards/:address
 */
router.get('/mining/rewards/:address', async (req, res) => {
  try {
    const address = req.params.address;
    // Check if the function exists in blockchainService
    if (typeof blockchainService.getMiningRewards === 'function') {
      const rewards = await blockchainService.getMiningRewards(address);
      res.json(rewards);
    } else {
      // If the function doesn't exist yet, return an empty array
      console.warn('getMiningRewards function not implemented yet in blockchainService');
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get mining rewards'
    });
  }
});

/**
 * Get thringlet by ID
 * GET /api/blockchain/thringlet/:id
 */
router.get('/thringlet/:id', (req, res) => {
  try {
    const id = req.params.id;
    const thringlet = blockchainService.getThringletById(id);
    res.json(thringlet);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get thringlet'
    });
  }
});

/**
 * Interact with thringlet
 * POST /api/blockchain/thringlet/:id/interact
 */
router.post('/thringlet/:id/interact', (req, res) => {
  try {
    const id = req.params.id;
    const { interactionType } = req.body;
    
    if (!interactionType) {
      return res.status(400).json({ error: 'Interaction type is required' });
    }
    
    // Get current thringlet state
    const thringlet = blockchainService.getThringletById(id);
    
    // Update state based on interaction
    const updatedThringlet = blockchainService.simulateThringletInteraction(
      thringlet, 
      interactionType
    );
    
    res.json(updatedThringlet);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to interact with thringlet'
    });
  }
});

/**
 * Explorer page data
 * GET /api/blockchain/explorer
 */
router.get('/explorer', async (req, res) => {
  try {
    const [latestBlock, recentBlocks, recentTxs] = await Promise.all([
      blockchainService.getLatestBlock(),
      blockchainService.getRecentBlocks(5),
      blockchainService.getRecentTransactions(10)
    ]);
    
    res.json({
      latestBlock,
      recentBlocks,
      recentTransactions: recentTxs,
      status: blockchainService.getBlockchainStatus()
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get explorer data'
    });
  }
});

/**
 * Get paginated addresses for explorer
 * GET /api/blockchain/addresses?page=1&limit=10
 */
router.get('/addresses', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const { addresses, totalCount } = await blockchainService.getPaginatedAddresses(page, limit);
    
    res.json({
      addresses,
      pageInfo: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get addresses'
    });
  }
});

/**
 * Test API endpoint
 * GET /api/blockchain/test
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
});

/**
 * Force mine a block (for testing purposes)
 * POST /api/blockchain/mining/force-mine
 */
router.post('/mining/force-mine', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const newBlock = await blockchainService.forceMineBlock(address);
    
    if (!newBlock) {
      return res.status(500).json({ error: 'Failed to mine block' });
    }
    
    // Get updated mining stats and wallet info
    const [miningStats, wallet] = await Promise.all([
      blockchainService.getMiningStats(address),
      blockchainService.getWallet(address)
    ]);
    
    res.json({
      success: true,
      block: newBlock,
      miningStats,
      wallet
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to force mine block'
    });
  }
});

export default router;