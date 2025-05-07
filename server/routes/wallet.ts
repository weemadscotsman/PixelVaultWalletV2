import express from 'express';
import * as walletController from '../controllers/walletController';

const router = express.Router();

/**
 * Get all wallets
 * GET /api/wallet/all
 */
router.get('/all', walletController.getAllWallets);

/**
 * Create a new wallet
 * POST /api/wallet/create
 */
router.post('/create', walletController.createWallet);

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
 * Get wallet info
 * GET /api/wallet/:address
 */
router.get('/:address', walletController.getWallet);

export default router;