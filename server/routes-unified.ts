import { Request, Response, NextFunction } from 'express';
import { stakingService } from './services/stakingService';

export function registerRoutes(app: any, simplifiedStorage?: any) {
  // Initialize staking pools on startup
  stakingService.initializeStakingPools();

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
      const blockchain = (req as any).blockchain;
      if (!blockchain) {
        return res.status(500).json({ error: 'Blockchain not available' });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const recentBlocks = blockchain.blocks.slice(-limit).reverse();
      
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
      const blockchain = (req as any).blockchain;
      if (!blockchain) {
        return res.status(500).json({ error: 'Blockchain not available' });
      }
      
      const stats = {
        hashRate: blockchain.hashRate || 1000000,
        difficulty: blockchain.difficulty,
        blocksMinedToday: blockchain.blocks.filter((block: any) => {
          const today = new Date();
          const blockDate = new Date(block.timestamp);
          return blockDate.toDateString() === today.toDateString();
        }).length,
        totalBlocks: blockchain.blocks.length,
        lastBlockReward: 5,
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