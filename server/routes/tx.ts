import express from 'express';
import * as txController from '../controllers/txController';

const router = express.Router();

/**
 * Send transaction
 * POST /api/tx/send
 */
router.post('/send', txController.sendTransaction);

/**
 * Get recent transactions
 * GET /api/tx/recent
 */
router.get('/recent', txController.getRecentTransactions);

/**
 * Get transaction history for wallet
 * GET /api/tx/history/:address
 */
router.get('/history/:address', txController.getTransactionHistory);

/**
 * Get transaction details
 * GET /api/tx/:hash
 */
router.get('/:hash', txController.getTransactionDetails);

export default router;