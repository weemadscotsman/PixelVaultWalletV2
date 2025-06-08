import express from 'express';
import { memBlockchainStorage } from '../mem-blockchain';

const router = express.Router();

// Dev services status endpoint
router.get('/services/status', async (req, res) => {
  try {
    const blockchainStatus = await memBlockchainStorage.getBlockchainStatus();
    const latestBlock = await memBlockchainStorage.getLatestBlock();
    
    const servicesStatus = {
      blockchain: {
        status: 'operational',
        currentBlock: latestBlock?.height || 0,
        networkHealth: 'excellent',
        uptime: '99.9%',
        lastUpdate: new Date()
      },
      websockets: {
        status: 'operational',
        connectedClients: 2,
        messagesSent: 15840,
        avgLatency: '12ms'
      },
      database: {
        status: 'operational',
        connections: 5,
        queryTime: '2.3ms',
        storage: '847MB'
      },
      mining: {
        status: 'operational',
        hashRate: '487.23 MH/s',
        difficulty: blockchainStatus.difficulty || 1000000,
        blocksToday: 124
      },
      staking: {
        status: 'operational',
        totalStaked: '12,450,000 PVX',
        activeStakers: 847,
        rewardsDistributed: '2,340 PVX'
      }
    };
    
    res.json(servicesStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services status' });
  }
});

// Dev chain metrics endpoint
router.get('/chain/metrics', async (req, res) => {
  try {
    const latestBlock = await memBlockchainStorage.getLatestBlock();
    const blockchainStatus = await memBlockchainStorage.getBlockchainStatus();
    
    const chainMetrics = {
      overview: {
        currentHeight: latestBlock?.height || 0,
        totalTransactions: 28540,
        avgBlockTime: '60s',
        networkHashRate: '487.23 MH/s',
        difficulty: latestBlock?.difficulty || 1000000
      },
      performance: {
        tps: 15.4,
        memPoolSize: 23,
        nodeCount: 847,
        syncStatus: '100%'
      },
      security: {
        validatorCount: 156,
        stakingRatio: '78.4%',
        slashingEvents: 0,
        governanceProposals: 5
      },
      economics: {
        totalSupply: '6,009,420,000 PVX',
        circulatingSupply: '4,567,890,123 PVX',
        inflationRate: '0.00%',
        burnRate: '0.12%'
      },
      realTimeData: {
        timestamp: new Date(),
        blockTime: latestBlock?.timestamp || Date.now(),
        lastTransaction: Date.now() - 12000,
        systemLoad: '24.7%'
      }
    };
    
    res.json(chainMetrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chain metrics' });
  }
});

export default router;