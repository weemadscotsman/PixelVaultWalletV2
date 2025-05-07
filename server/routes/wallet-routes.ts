import express from 'express';
import * as blockchainService from '../services/blockchain-service';

const router = express.Router();

/**
 * Create wallet
 * POST /api/wallet/create
 */
router.post('/create', async (req, res) => {
  try {
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
    const address = await blockchainService.createWallet(passphrase);
    const wallet = await blockchainService.getWallet(address);
    
    if (!wallet) {
      return res.status(500).json({ error: 'Failed to retrieve created wallet' });
    }
    
    res.status(201).json({
      address: wallet.address,
      pubkey: wallet.publicKey,
      mnemonic: null // Not implemented yet
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create wallet'
    });
  }
});

/**
 * Import wallet
 * POST /api/wallet/import
 */
router.post('/import', async (req, res) => {
  try {
    const { privateKey, passphrase } = req.body;
    
    if (!privateKey || !passphrase) {
      return res.status(400).json({ error: 'Private key and passphrase are required' });
    }
    
    const address = await blockchainService.importWallet(privateKey, passphrase);
    const wallet = await blockchainService.getWallet(address);
    
    if (!wallet) {
      return res.status(500).json({ error: 'Failed to retrieve imported wallet' });
    }
    
    res.status(201).json({
      address: wallet.address,
      pubkey: wallet.publicKey
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to import wallet'
    });
  }
});

/**
 * View Balance
 * GET /api/wallet/balance/:address
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const wallet = await blockchainService.getWallet(address);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    // We'll need to enhance this with staking data in the future
    res.json({
      balance: wallet.balance,
      staked: "0", // Not implemented yet
      rewards: "0"  // Not implemented yet
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get wallet balance'
    });
  }
});

/**
 * Send PVX
 * POST /api/wallet/send
 */
router.post('/send', async (req, res) => {
  try {
    const { from, to, amount, memo, gas_limit } = req.body;
    const passphrase = req.body.passphrase; // Added for authentication
    
    if (!from || !to || !amount || !passphrase) {
      return res.status(400).json({ 
        error: 'from, to, amount, and passphrase are required' 
      });
    }
    
    const txHash = await blockchainService.sendTransaction(
      from, 
      to, 
      amount, 
      passphrase
    );
    
    res.status(201).json({ 
      tx_hash: txHash, 
      status: 'success' 
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send transaction'
    });
  }
});

/**
 * Stake PVX
 * POST /api/wallet/stake
 */
router.post('/stake', async (req, res) => {
  try {
    const { address, amount, validator, passphrase } = req.body;
    
    if (!address || !amount || !passphrase) {
      return res.status(400).json({ 
        error: 'address, amount, and passphrase are required' 
      });
    }
    
    // TODO: Implement actual staking logic
    const txHash = "simulated_stake_tx_" + Date.now().toString(16);
    
    res.status(201).json({ 
      tx_hash: txHash, 
      status: 'success' 
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to stake tokens'
    });
  }
});

/**
 * Unstake PVX
 * POST /api/wallet/unstake
 */
router.post('/unstake', async (req, res) => {
  try {
    const { address, amount, validator, passphrase } = req.body;
    
    if (!address || !amount || !passphrase) {
      return res.status(400).json({ 
        error: 'address, amount, and passphrase are required' 
      });
    }
    
    // TODO: Implement actual unstaking logic
    const txHash = "simulated_unstake_tx_" + Date.now().toString(16);
    const cooldownTime = new Date();
    cooldownTime.setDate(cooldownTime.getDate() + 7); // 7 day cooldown
    
    res.status(201).json({ 
      tx_hash: txHash, 
      cooldown_time: cooldownTime.toISOString() 
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to unstake tokens'
    });
  }
});

/**
 * Claim Rewards
 * POST /api/wallet/claim
 */
router.post('/claim', async (req, res) => {
  try {
    const { address, passphrase } = req.body;
    
    if (!address || !passphrase) {
      return res.status(400).json({ 
        error: 'address and passphrase are required' 
      });
    }
    
    // TODO: Implement actual reward claiming logic
    const txHash = "simulated_claim_tx_" + Date.now().toString(16);
    const amount = "10.5"; // Simulated reward amount
    
    res.status(201).json({ 
      tx_hash: txHash, 
      amount: amount 
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to claim rewards'
    });
  }
});

/**
 * Transaction History
 * GET /api/wallet/history/:address
 */
router.get('/history/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const transactions = await blockchainService.getTransactionsByAddress(address);
    
    // Transform to the format specified in the wallet spec
    const formattedTransactions = transactions.map(tx => ({
      tx_type: tx.type || 'transfer',
      amount: tx.amount,
      to: tx.to,
      from: tx.from,
      timestamp: tx.timestamp,
      hash: tx.hash
    }));
    
    res.json(formattedTransactions);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get transaction history'
    });
  }
});

/**
 * Export wallet keys
 * POST /api/wallet/:address/export
 */
router.post('/:address/export', async (req, res) => {
  try {
    const { address } = req.params;
    const { passphrase } = req.body;
    
    if (!passphrase) {
      return res.status(400).json({ error: 'Passphrase is required' });
    }
    
    const keys = await blockchainService.exportWalletKeys(address, passphrase);
    res.json({
      publicKey: keys.publicKey,
      privateKey: keys.privateKey
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to export wallet keys'
    });
  }
});

/**
 * Get all wallets
 * GET /api/wallet/all
 */
router.get('/all', async (req, res) => {
  try {
    const wallets = await blockchainService.getAllWallets();
    res.json(wallets);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get wallets'
    });
  }
});

export default router;