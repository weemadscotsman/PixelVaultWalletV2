import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertUTRSchema } from '@shared/schema';

const router = Router();

// Create a new UTR entry
router.post('/api/utr', async (req, res) => {
  try {
    const validationResult = insertUTRSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid UTR data',
        details: validationResult.error.format()
      });
    }

    const utrEntry = await storage.createUTREntry(req.body);
    res.status(201).json(utrEntry);
  } catch (error) {
    console.error('Error creating UTR entry:', error);
    res.status(500).json({ error: 'Failed to create UTR entry' });
  }
});

// Get UTR entry by tx_id
router.get('/api/utr/:txId', async (req, res) => {
  try {
    const txId = req.params.txId;
    const utrEntry = await storage.getUTRByTxId(txId);
    if (!utrEntry) {
      return res.status(404).json({ error: 'UTR entry not found' });
    }
    res.json(utrEntry);
  } catch (error) {
    console.error('Error getting UTR entry:', error);
    res.status(500).json({ error: 'Failed to get UTR entry' });
  }
});

// Get all UTR entries with optional limit
router.get('/api/utr', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const utrEntries = await storage.getUTREntries(limit);
    res.json(utrEntries);
  } catch (error) {
    console.error('Error getting UTR entries:', error);
    res.status(500).json({ error: 'Failed to get UTR entries' });
  }
});

// Get UTR entries by address
router.get('/api/utr/address/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const asReceiver = req.query.as_receiver === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const utrEntries = await storage.getUTREntriesByAddress(address, asReceiver, limit);
    res.json(utrEntries);
  } catch (error) {
    console.error('Error getting UTR entries by address:', error);
    res.status(500).json({ error: 'Failed to get UTR entries' });
  }
});

// Get UTR entries by transaction type
router.get('/api/utr/type/:txType', async (req, res) => {
  try {
    const txType = req.params.txType;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const utrEntries = await storage.getUTREntriesByType(txType, limit);
    res.json(utrEntries);
  } catch (error) {
    console.error('Error getting UTR entries by type:', error);
    res.status(500).json({ error: 'Failed to get UTR entries' });
  }
});

// Get UTR entries by asset type and optional asset ID
router.get('/api/utr/asset/:assetType', async (req, res) => {
  try {
    const assetType = req.params.assetType;
    const assetId = req.query.asset_id as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const utrEntries = await storage.getUTREntriesByAsset(assetType, assetId, limit);
    res.json(utrEntries);
  } catch (error) {
    console.error('Error getting UTR entries by asset:', error);
    res.status(500).json({ error: 'Failed to get UTR entries' });
  }
});

// Update UTR entry status
router.patch('/api/utr/:txId/status', async (req, res) => {
  try {
    const txId = req.params.txId;
    const statusSchema = z.object({
      status: z.string().refine(s => 
        ['pending', 'confirmed', 'failed', 'vetoed'].includes(s), {
          message: "Status must be one of: pending, confirmed, failed, vetoed"
        }),
      metadata: z.record(z.any()).optional()
    });
    
    const validationResult = statusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid status update data',
        details: validationResult.error.format()
      });
    }
    
    const { status, metadata } = req.body;
    const updatedEntry = await storage.updateUTREntryStatus(txId, status, metadata);
    
    if (!updatedEntry) {
      return res.status(404).json({ error: 'UTR entry not found' });
    }
    
    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating UTR entry status:', error);
    res.status(500).json({ error: 'Failed to update UTR entry status' });
  }
});

// Verify UTR entry
router.patch('/api/utr/:txId/verify', async (req, res) => {
  try {
    const txId = req.params.txId;
    const verifySchema = z.object({
      verified: z.boolean()
    });
    
    const validationResult = verifySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid verification data',
        details: validationResult.error.format()
      });
    }
    
    const { verified } = req.body;
    const updatedEntry = await storage.verifyUTREntry(txId, verified);
    
    if (!updatedEntry) {
      return res.status(404).json({ error: 'UTR entry not found' });
    }
    
    res.json(updatedEntry);
  } catch (error) {
    console.error('Error verifying UTR entry:', error);
    res.status(500).json({ error: 'Failed to verify UTR entry' });
  }
});

// Get UTR statistics
router.get('/api/utr/stats', async (req, res) => {
  try {
    const stats = await storage.getUTRStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting UTR stats:', error);
    res.status(500).json({ error: 'Failed to get UTR stats' });
  }
});

export default router;