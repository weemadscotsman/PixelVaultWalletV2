import express from 'express';
import * as walletController from '../controllers/walletController';
import { authenticateJWT } from '../middleware/auth';
import { walletCreationLimiter } from '../middleware/rate-limiters';

const router = express.Router();

/**
 * Create a new wallet - accessible without authentication
 * POST /api/wallet/create
 */
router.post('/create', walletCreationLimiter, walletController.createWallet);

/**
 * Authenticate wallet and establish session
 * POST /api/wallet/:address/auth
 */
router.post('/:address/auth', walletController.authenticateWallet);

// Temporarily disable JWT authentication for development
// router.use(authenticateJWT);

/**
 * Get all wallets
 * GET /api/wallet/all
 */
router.get('/all', walletController.getAllWallets);

/**
 * Import an existing wallet
 * POST /api/wallet/import
 */
router.post('/import', walletController.importWallet);

/**
 * Get wallet balance with staking info
 * GET /api/wallet/:address/balance
 */
router.get('/:address/balance', walletController.getBalance);

/**
 * Get detailed staking information
 * GET /api/wallet/:address/staking
 */
router.get('/:address/staking', walletController.getStakingInfo);

/**
 * Export wallet keys
 * POST /api/wallet/:address/export
 */
router.post('/:address/export', walletController.exportWalletKeys);

/**
 * Get transaction history
 * GET /api/wallet/history/:address
 */
router.get('/history/:address', walletController.getTransactionHistory);

/**
 * Send transaction from wallet
 * POST /api/wallet/send
 */
router.post('/send', walletController.sendTransaction);

/**
 * Get wallet info
 * GET /api/wallet/:address
 */
router.get('/:address', walletController.getWallet);

export default router;