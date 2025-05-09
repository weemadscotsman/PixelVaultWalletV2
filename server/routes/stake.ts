import express from 'express';
import * as stakeController from '../controllers/stakeController.fixed';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Temporarily disable JWT authentication for debugging
// router.use(authenticateJWT);

/**
 * Start staking (stake PVX tokens)
 * POST /api/stake/start
 */
router.post('/start', stakeController.startStaking);

/**
 * Stop staking (unstake PVX tokens)
 * POST /api/stake/stop
 */
router.post('/stop', stakeController.stopStaking);

/**
 * Claim staking rewards
 * POST /api/stake/claim
 */
router.post('/claim', stakeController.claimRewards);

/**
 * Get available staking pools
 * GET /api/stake/pools
 */
router.get('/pools', stakeController.getStakingPools);

/**
 * Get staking status for a wallet
 * GET /api/stake/status/:address
 */
router.get('/status/:address', stakeController.getStakingStatus);

/**
 * Get user's staking status from query param
 * GET /api/stake/status?address=xyz
 */
router.get('/status', (req, res) => {
  const address = req.query.address || req.query.limit; // Accept both formats
  
  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }
  
  // Call the controller with the address parameter
  req.params.address = address.toString();
  stakeController.getStakingStatus(req, res);
});

/**
 * Debug endpoint for getting wallet directly from DAO and mem storage
 * GET /api/stake/debug-wallet/:address
 */
router.get('/debug-wallet/:address', async (req, res) => {
  const { address } = req.params;
  
  if (!address) {
    return res.status(400).json({ error: 'Address parameter is required' });
  }
  
  try {
    // Direct SQL query for debugging
    const { db } = await import('../db');
    const sqlResult = await db.execute(`SELECT * FROM wallets WHERE address = '${address}'`);
    
    // Try to get the wallet from DAO
    const { walletDao } = await import('../database/walletDao');
    let daoWallet;
    try {
      daoWallet = await walletDao.getWalletByAddress(address);
    } catch (err) {
      console.error('Error getting wallet from DAO:', err);
    }
    
    // Try to get the wallet from memory storage
    const { memBlockchainStorage } = await import('../mem-blockchain');
    let memWallet;
    try {
      memWallet = await memBlockchainStorage.getWalletByAddress(address);
    } catch (err) {
      console.error('Error getting wallet from memory storage:', err);
    }
    
    // Return all the data
    res.json({
      sqlResult,
      daoWallet,
      memWallet,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
        current_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in debug-wallet endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve wallet information', details: error.message });
  }
});

export default router;