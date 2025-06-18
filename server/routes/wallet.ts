import express from 'express';
// Ensure the import path and name are correct
import { createWalletHandler } from '../controllers/walletController';

const router = express.Router();

// POST /api/wallet/new - uses the new handler
router.post('/new', createWalletHandler);

// Placeholder for GET /api/wallet/:address
// router.get('/:address', getWalletHandler); // Assuming a getWalletHandler will be created

export default router;
