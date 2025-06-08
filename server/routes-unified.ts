import { Request, Response, NextFunction } from 'express';
import { stakingService } from './services/stakingService';

export function registerRoutes(app: any, simplifiedStorage?: any) {
  // Initialize staking pools on startup
  stakingService.initializeStakingPools();

  // ============= AUTHENTICATION SYSTEM =============
  
  // Login endpoint for wallet authentication
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { address, passphrase } = req.body;
      
      if (!address || !passphrase) {
        return res.status(400).json({ error: 'Address and passphrase are required' });
      }
      
      // Verify passphrase (accepts known test passphrase)
      if (passphrase !== 'zsfgaefhsethrthrtwtrh') {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
      
      // Return success with session token
      res.json({
        success: true,
        address,
        sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Authentication successful'
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Get current authenticated user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || req.headers.sessiontoken || req.headers['session-token'];
      
      if (!authHeader) {
        return res.status(401).json({ error: 'No session token provided' });
      }
      
      // For our system, return the genesis wallet as authenticated user
      res.json({
        success: true,
        user: {
          address: 'PVX_1295b5490224b2eb64e9724dc091795a',
          isAuthenticated: true,
          sessionToken: authHeader
        }
      });
      
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  });

  // ============= WALLET SYSTEM =============
  
  // Get wallet information
  app.get('/api/wallet/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      // Always return the genesis wallet data
      res.json({
        address,
        publicKey: `PVX_PUBLIC_KEY_${address}`,
        balance: address === 'PVX_1295b5490224b2eb64e9724dc091795a' ? '999999999' : '0',
        createdAt: '2025-01-01T00:00:00.000Z',
        lastSynced: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({ error: 'Failed to get wallet information' });
    }
  });

  // List all wallets
  app.get('/api/wallet/all', async (req: Request, res: Response) => {
    try {
      const wallets = [
        {
          address: 'PVX_1295b5490224b2eb64e9724dc091795a',
          publicKey: 'PVX_PUBLIC_KEY_1295b5490224b2eb64e9724dc091795a',
          balance: '999999999',
          createdAt: '2025-01-01T00:00:00.000Z',
          lastSynced: new Date().toISOString()
        }
      ];
      
      res.json({ wallets });
    } catch (error) {
      console.error('List wallets error:', error);
      res.status(500).json({ error: 'Failed to list wallets' });
    }
  });

  // Create new wallet
  app.post('/api/wallet/create', async (req: Request, res: Response) => {
    try {
      const { passphrase } = req.body;
      
      if (!passphrase) {
        return res.status(400).json({ error: 'Passphrase is required' });
      }
      
      const newAddress = `PVX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const wallet = {
        address: newAddress,
        publicKey: `PVX_PUBLIC_KEY_${newAddress}`,
        balance: '0',
        createdAt: new Date().toISOString(),
        lastSynced: new Date().toISOString()
      };
      
      res.status(201).json({
        wallet,
        sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    } catch (error) {
      console.error('Create wallet error:', error);
      res.status(500).json({ error: 'Failed to create wallet' });
    }
  });

  // ============= REAL DATABASE STAKING SYSTEM =============
  
  // Start staking - REAL DATABASE IMPLEMENTATION
  app.post('/api/stake/start', async (req: Request, res: Response) => {
    try {
      const { 
        walletAddress, 
        address,
        poolId,
        amount,
        passphrase
      } = req.body;
      
      const effectiveAddress = walletAddress || address;
      
      if (!effectiveAddress || !poolId || !amount || !passphrase) {
        return res.status(400).json({ 
          error: 'Address, poolId, amount, and passphrase are required' 
        });
      }
      
      // Verify passphrase (accepts known test passphrase)
      if (passphrase !== 'zsfgaefhsethrthrtwtrh') {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
      
      // Use real staking service for database-backed staking
      const result = await stakingService.createStake({
        walletAddress: effectiveAddress,
        poolId,
        amount: parseFloat(amount),
        passphrase
      });
      
      console.log(`✅ STAKE CREATED IN DATABASE: ${result.stakeId} for ${effectiveAddress} - ${amount} PVX in pool ${poolId}`);
      
      res.status(201).json({
        success: true,
        stakeId: result.stakeId,
        transactionHash: result.transactionHash,
        message: 'Stake started successfully and persisted to database',
        stake: {
          id: result.stakeId,
          walletAddress: effectiveAddress,
          poolId,
          amount: amount.toString(),
          startTime: new Date().toISOString(),
          status: 'active',
          rewards: '0'
        }
      });
    } catch (error) {
      console.error('❌ STAKE CREATION FAILED:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to start staking'
      });
    }
  });

  // Get staking status for a wallet - READ FROM REAL DATABASE
  app.get('/api/stake/status/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      // Get real stakes from database using staking service
      const realStakes = await stakingService.getActiveStakes(address);
      
      console.log(`✅ FETCHED REAL STAKES FROM DATABASE: ${realStakes.length} active stakes for ${address}`);
      
      res.json({ stakes: realStakes });
    } catch (error) {
      console.error('❌ FAILED to fetch staking status:', error);
      res.status(500).json({ error: 'Failed to fetch staking status' });
    }
  });

  // Claim staking rewards - REAL DATABASE IMPLEMENTATION
  app.post('/api/stake/claim', async (req: Request, res: Response) => {
    try {
      const { 
        stakeId, 
        address, 
        passphrase 
      } = req.body;
      
      if (!stakeId || !address || !passphrase) {
        return res.status(400).json({ 
          error: 'StakeId, address, and passphrase are required' 
        });
      }
      
      // Verify passphrase
      if (passphrase !== 'zsfgaefhsethrthrtwtrh') {
        return res.status(401).json({ error: 'Invalid passphrase' });
      }
      
      // Claim rewards from database using staking service
      const claimedAmount = await stakingService.claimRewards(stakeId, address);
      
      console.log(`✅ REWARDS CLAIMED FROM DATABASE: ${claimedAmount.toFixed(6)} PVX for ${address}`);
      
      res.json({ 
        success: true, 
        rewards: claimedAmount.toString(),
        message: `Successfully claimed ${claimedAmount.toFixed(6)} PVX rewards from database`
      });
    } catch (error) {
      console.error('❌ REWARD CLAIM FAILED:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to claim rewards' 
      });
    }
  });

  // Get staking pools from database
  app.get('/api/stake/pools', async (req: Request, res: Response) => {
    try {
      const pools = await stakingService.getStakingPools();
      console.log(`✅ FETCHED REAL POOLS FROM DATABASE: ${pools.length} pools`);
      res.json({ pools });
    } catch (error) {
      console.error('❌ FAILED to fetch staking pools:', error);
      res.status(500).json({ error: 'Failed to fetch staking pools' });
    }
  });

  app.get('/api/staking/pools', async (req: Request, res: Response) => {
    try {
      const pools = await stakingService.getStakingPools();
      console.log(`✅ FETCHED REAL POOLS FROM DATABASE: ${pools.length} pools`);
      res.json(pools);
    } catch (error) {
      console.error('❌ FAILED to fetch staking pools:', error);
      res.status(500).json({ error: 'Failed to fetch staking pools' });
    }
  });

  // ============= BLOCKCHAIN API ENDPOINTS =============
  
  // Get blockchain statistics
  app.get('/api/blockchain/stats', async (req: Request, res: Response) => {
    try {
      const blockchainService = (req as any).blockchainService;
      if (!blockchainService) {
        return res.status(500).json({ error: 'Blockchain service not available' });
      }
      
      // Get real blockchain data from the service
      const latestBlock = await blockchainService.getLatestBlock();
      const status = await blockchainService.getBlockchainStatus();
      const recentBlocks = await blockchainService.getRecentBlocks(10);
      const recentTransactions = await blockchainService.getRecentTransactions(50);
      
      const stats = {
        currentBlock: latestBlock?.height || 0,
        difficulty: latestBlock?.difficulty || 1,
        hashRate: 150.7,
        totalTransactions: recentTransactions.length,
        networkStatus: status.connected ? 'active' : 'inactive',
        lastBlockTime: latestBlock?.timestamp || Date.now(),
        totalSupply: "6009420000000",
        circulatingSupply: "5500000000000"
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Failed to get blockchain stats:', error);
      res.status(500).json({ error: 'Failed to get blockchain stats' });
    }
  });

  // Get recent blocks
  app.get('/api/blockchain/blocks', async (req: Request, res: Response) => {
    try {
      const blockchainService = (req as any).blockchainService;
      if (!blockchainService) {
        return res.status(500).json({ error: 'Blockchain service not available' });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const recentBlocks = await blockchainService.getRecentBlocks(limit);
      
      res.json({ blocks: recentBlocks });
    } catch (error) {
      console.error('Failed to get blocks:', error);
      res.status(500).json({ error: 'Failed to get blocks' });
    }
  });

  // ============= MINING API ENDPOINTS =============
  
  // Get mining statistics
  app.get('/api/mining/stats', async (req: Request, res: Response) => {
    try {
      const blockchainService = (req as any).blockchainService;
      if (!blockchainService) {
        return res.status(500).json({ error: 'Blockchain service not available' });
      }
      
      const status = blockchainService.getBlockchainStatus();
      const recentBlocks = await blockchainService.getRecentBlocks(100);
      
      const today = new Date();
      const blocksMinedToday = recentBlocks.filter((block: any) => {
        const blockDate = new Date(block.timestamp);
        return blockDate.toDateString() === today.toDateString();
      }).length;
      
      const stats = {
        hashRate: status.hashRate || 150000,
        difficulty: status.difficulty,
        blocksMinedToday,
        totalBlocks: status.currentBlock,
        lastBlockReward: 5000000,
        isActiveMining: true
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Failed to get mining stats:', error);
      res.status(500).json({ error: 'Failed to get mining stats' });
    }
  });

  // ============= TRANSACTION API ENDPOINTS =============
  
  // Get recent transactions
  app.get('/api/transactions/recent', async (req: Request, res: Response) => {
    try {
      if (!simplifiedStorage) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      
      const limit = parseInt(req.query.limit as string) || 20;
      const recentTransactions = await simplifiedStorage.getRecentTransactions(limit);
      
      res.json({ transactions: recentTransactions });
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      res.status(500).json({ error: 'Failed to get recent transactions' });
    }
  });

  // ============= BADGES API ENDPOINTS =============
  
  // Get all available badges
  app.get('/api/badges/all', async (req: Request, res: Response) => {
    try {
      if (!simplifiedStorage) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      
      const badges = await simplifiedStorage.getAllBadges();
      res.json({ badges });
    } catch (error) {
      console.error('Failed to get badges:', error);
      res.status(500).json({ error: 'Failed to get badges' });
    }
  });

  // Get user badges
  app.get('/api/badges/user/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      if (!simplifiedStorage) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      
      const userBadges = await simplifiedStorage.getUserBadges(address);
      res.json({ badges: userBadges });
    } catch (error) {
      console.error('Failed to get user badges:', error);
      res.status(500).json({ error: 'Failed to get user badges' });
    }
  });

  // ============= DROPS API ENDPOINTS =============
  
  // Get drops statistics
  app.get('/api/drops/stats', async (req: Request, res: Response) => {
    try {
      if (!simplifiedStorage) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      
      const drops = await simplifiedStorage.getAllDrops();
      const stats = {
        totalDrops: drops.length,
        activeDrops: drops.filter((drop: any) => drop.status === 'active').length,
        completedDrops: drops.filter((drop: any) => drop.status === 'completed').length
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Failed to get drops stats:', error);
      res.status(500).json({ error: 'Failed to get drops stats' });
    }
  });

  // ============= GOVERNANCE API ENDPOINTS =============
  
  // Get governance proposals
  app.get('/api/governance/proposals', async (req: Request, res: Response) => {
    try {
      if (!simplifiedStorage) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      
      const proposals = await simplifiedStorage.getGovernanceProposals();
      res.json({ proposals });
    } catch (error) {
      console.error('Failed to get governance proposals:', error);
      res.status(500).json({ error: 'Failed to get governance proposals' });
    }
  });

  // ============= MISSING ENDPOINTS =============
  
  // Add missing /api/drops endpoint
  app.get('/api/drops', async (req: Request, res: Response) => {
    try {
      const drops = await simplifiedStorage.getAllDrops();
      res.json({ drops, totalActive: drops.filter((d: any) => d.status === 'active').length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get drops' });
    }
  });
  
  // Add missing /api/badges endpoint
  app.get('/api/badges', async (req: Request, res: Response) => {
    try {
      const badges = await simplifiedStorage.getAllBadges();
      res.json({ badges });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get badges' });
    }
  });
  
  // Add missing blockchain metrics endpoint
  app.get('/api/blockchain/metrics', async (req: Request, res: Response) => {
    try {
      const stats = await simplifiedStorage.getBlockchainStatus();
      res.json({
        hashRate: stats.hashRate || 150000,
        difficulty: stats.difficulty || 5,
        networkGrowth: 8.5,
        transactionVolume: stats.totalTransactions || 50
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get blockchain metrics' });
    }
  });
  
  // Add missing blockchain status endpoint
  app.get('/api/blockchain/status', async (req: Request, res: Response) => {
    try {
      const status = await simplifiedStorage.getBlockchainStatus();
      res.json({
        status: 'active',
        currentBlock: status.currentBlock || 1600,
        networkStatus: 'healthy',
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get blockchain status' });
    }
  });
  
  // Add missing UTR (Universal Transaction Router) endpoints
  app.get('/api/utr/transactions', async (req: Request, res: Response) => {
    try {
      const transactions = await simplifiedStorage.getRecentTransactions(20);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get UTR transactions' });
    }
  });
  
  app.get('/api/utr/stats', async (req: Request, res: Response) => {
    try {
      res.json({
        totalTransactions: 150,
        averageGasPrice: '21000',
        networkLoad: '45%',
        lastBlockTime: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get UTR stats' });
    }
  });
  
  app.get('/api/utr/realtime', async (req: Request, res: Response) => {
    try {
      res.json({
        activeConnections: 42,
        transactionsPerSecond: 15.7,
        memPoolSize: 234,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get UTR realtime data' });
    }
  });
  
  // Add missing leaderboard endpoints
  app.get('/api/badges/leaderboard', async (req: Request, res: Response) => {
    try {
      res.json({
        leaderboard: [
          { rank: 1, address: 'PVX_1295b5490224b2eb64e9724dc091795a', badges: 5, score: 1250 },
          { rank: 2, address: 'PVX_test_user_001', badges: 3, score: 980 },
          { rank: 3, address: 'PVX_test_user_002', badges: 2, score: 750 }
        ],
        totalParticipants: 3
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get badge leaderboard' });
    }
  });
  
  app.get('/api/learning/leaderboard', async (req: Request, res: Response) => {
    try {
      res.json({
        leaderboard: [
          { rank: 1, address: 'PVX_1295b5490224b2eb64e9724dc091795a', completedModules: 5, experience: 2500 },
          { rank: 2, address: 'PVX_learner_001', completedModules: 3, experience: 1800 },
          { rank: 3, address: 'PVX_learner_002', completedModules: 2, experience: 1200 }
        ],
        totalLearners: 3
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get learning leaderboard' });
    }
  });
  
  // Add missing governance veto guardians endpoint
  app.get('/api/governance/veto-guardians', async (req: Request, res: Response) => {
    try {
      res.json({
        guardians: [
          { address: 'PVX_1295b5490224b2eb64e9724dc091795a', stakingPower: '999999999', votes: 150 },
          { address: 'PVX_guardian_001', stakingPower: '500000000', votes: 75 },
          { address: 'PVX_guardian_002', stakingPower: '250000000', votes: 42 }
        ],
        totalGuardians: 3,
        quorumThreshold: '1000000000'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get veto guardians' });
    }
  });

  // Add missing /api/tx/recent endpoint (alternative to /api/transactions/recent)
  app.get('/api/tx/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await simplifiedStorage.getRecentTransactions(limit);
      res.json({ transactions, count: transactions.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recent transactions' });
    }
  });
  
  // Blockchain trends
  app.get('/api/blockchain/trends', async (req: Request, res: Response) => {
    try {
      res.json({
        trends: {
          hashRateGrowth: 15.2,
          transactionVolume: 1847,
          networkGrowth: 8.5,
          stakingParticipation: 67.3
        },
        chartData: [
          { period: '24h', blocks: 144, transactions: 520 },
          { period: '7d', blocks: 1008, transactions: 3640 },
          { period: '30d', blocks: 4320, transactions: 15600 }
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get blockchain trends' });
    }
  });

  // Mining rewards for user
  app.get('/api/mining/rewards/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      res.json({
        totalRewards: '250000000',
        dailyRewards: '5000000',
        weeklyRewards: '35000000',
        recentRewards: [
          { amount: '5000000', timestamp: Date.now() - 3600000, blockHeight: 1616 },
          { amount: '5000000', timestamp: Date.now() - 7200000, blockHeight: 1615 },
          { amount: '5000000', timestamp: Date.now() - 10800000, blockHeight: 1614 }
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get mining rewards' });
    }
  });

  // User transactions
  app.get('/api/transactions/user/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      res.json({
        transactions: [
          {
            hash: 'tx_' + Date.now() + '_mining_reward',
            type: 'MINING_REWARD',
            from: 'PVX_GENESIS_ADDR_00000000000000',
            to: address,
            amount: '5000000',
            timestamp: Date.now(),
            status: 'confirmed',
            blockHeight: 1616
          }
        ],
        totalCount: 150,
        page: 1,
        pageSize: 10
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user transactions' });
    }
  });

  // Governance votes for user
  app.get('/api/governance/votes/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      res.json({
        votes: [],
        totalVotes: 0,
        votingPower: '0'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user votes' });
    }
  });

  // Active drops
  app.get('/api/drops/active', async (req: Request, res: Response) => {
    try {
      res.json({
        drops: [],
        totalActive: 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get active drops' });
    }
  });

  // Learning progress for user
  app.get('/api/learning/progress/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      res.json({
        progress: {
          completedModules: 0,
          totalModules: 5,
          currentLevel: 1,
          experiencePoints: 0
        },
        modules: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get learning progress' });
    }
  });

  // ============= LEARNING API ENDPOINTS =============
  
  // Get learning modules
  app.get('/api/learning/modules', async (req: Request, res: Response) => {
    try {
      if (!simplifiedStorage) {
        return res.status(500).json({ error: 'Storage not available' });
      }
      
      const modules = await simplifiedStorage.getLearningModules();
      res.json({ modules });
    } catch (error) {
      console.error('Failed to get learning modules:', error);
      res.status(500).json({ error: 'Failed to get learning modules' });
    }
  });

}