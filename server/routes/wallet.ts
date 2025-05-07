import express from 'express';
import * as walletController from '../controllers/walletController';

const router = express.Router();

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
 * Get wallet info
 * GET /api/wallet/:address
 */
router.get('/:address', walletController.getWallet);

/**
 * Get wallet balance
 * GET /api/wallet/:address/balance
 */
router.get('/:address/balance', walletController.getBalance);

/**
 * Export wallet keys
 * POST /api/wallet/:address/export
 */
router.post('/:address/export', walletController.exportWalletKeys);

/**
 * Get all wallets
 * GET /api/wallet/all
 */
router.get('/all', walletController.getAllWallets);

export default router;