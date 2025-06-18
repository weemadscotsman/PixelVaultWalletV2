import express from 'express';
import { createWallet } from '../controllers/walletController';

import { createWallet } from '../controllers/walletController';

const router = express.Router();
console.log('[WalletRoutes] Router created.');

router.post('/new', async (req: any, res: any, next: any) => { // Make the wrapper async
  console.log('[WalletRoutes] /new POST route hit. Attempting to call createWallet...');
  try {
    await createWallet(req, res); // Await the async controller function
  } catch (error) {
    console.error('[WalletRoutes] Error calling createWallet:', error);
    next(error); // Pass error to Express error handler
  }
});

export default router;
