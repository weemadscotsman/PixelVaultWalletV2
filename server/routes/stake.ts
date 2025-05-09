import express from 'express';
import * as stakeController from '../controllers/stakeController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// Apply JWT authentication to all stake routes
router.use(authenticateJWT);

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

export default router;