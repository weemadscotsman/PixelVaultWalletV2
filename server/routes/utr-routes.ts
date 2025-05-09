import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { ZodError, z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Define UTR schema inline since it's not available in shared schema
const insertUTRSchema = z.object({
  txId: z.string(),
  type: z.string(),
  timestamp: z.number().or(z.date()),
  senderAddress: z.string(),
  receiverAddress: z.string().optional(),
  amount: z.number().optional(),
  status: z.string(),
  assetType: z.string().optional(),
  assetId: z.string().optional(),
  metadata: z.any().optional(),
  verified: z.boolean().default(false)
});

const router = Router();

// Get all UTR entries with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const entries = await storage.getUTREntries(limit);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching UTR entries:', error);
    res.status(500).json({ error: 'Failed to fetch UTR entries' });
  }
});

// Get UTR stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await storage.getUTRStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching UTR stats:', error);
    res.status(500).json({ error: 'Failed to fetch UTR statistics' });
  }
});

// Get UTR entry by TX ID
router.get('/tx/:txId', async (req: Request, res: Response) => {
  try {
    const entry = await storage.getUTRByTxId(req.params.txId);
    if (!entry) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error(`Error fetching UTR entry ${req.params.txId}:`, error);
    res.status(500).json({ error: 'Failed to fetch UTR entry' });
  }
});

// Get UTR entries by address
router.get('/address/:address', async (req: Request, res: Response) => {
  try {
    const asReceiver = req.query.as_receiver === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const entries = await storage.getUTREntriesByAddress(req.params.address, asReceiver, limit);
    res.json(entries);
  } catch (error) {
    console.error(`Error fetching UTR entries for address ${req.params.address}:`, error);
    res.status(500).json({ error: 'Failed to fetch UTR entries by address' });
  }
});

// Get UTR entries by type
router.get('/type/:txType', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const entries = await storage.getUTREntriesByType(req.params.txType, limit);
    res.json(entries);
  } catch (error) {
    console.error(`Error fetching UTR entries for type ${req.params.txType}:`, error);
    res.status(500).json({ error: 'Failed to fetch UTR entries by type' });
  }
});

// Get UTR entries by asset
router.get('/asset/:assetType', async (req: Request, res: Response) => {
  try {
    const assetId = req.query.asset_id as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const entries = await storage.getUTREntriesByAsset(req.params.assetType, assetId, limit);
    res.json(entries);
  } catch (error) {
    console.error(`Error fetching UTR entries for asset ${req.params.assetType}:`, error);
    res.status(500).json({ error: 'Failed to fetch UTR entries by asset' });
  }
});

// Create a new UTR entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = insertUTRSchema.parse(req.body);
    const newEntry = await storage.createUTREntry(validatedData);
    res.status(201).json(newEntry);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    console.error('Error creating UTR entry:', error);
    res.status(500).json({ error: 'Failed to create UTR entry' });
  }
});

// Update UTR entry status
router.patch('/status/:txId', async (req: Request, res: Response) => {
  try {
    const { status, metadata } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedEntry = await storage.updateUTREntryStatus(req.params.txId, status, metadata);
    if (!updatedEntry) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updatedEntry);
  } catch (error) {
    console.error(`Error updating UTR entry status ${req.params.txId}:`, error);
    res.status(500).json({ error: 'Failed to update UTR entry status' });
  }
});

// Verify UTR entry
router.patch('/verify/:txId', async (req: Request, res: Response) => {
  try {
    const { verified } = req.body;
    if (verified === undefined) {
      return res.status(400).json({ error: 'Verified status is required' });
    }
    
    const updatedEntry = await storage.verifyUTREntry(req.params.txId, verified);
    if (!updatedEntry) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(updatedEntry);
  } catch (error) {
    console.error(`Error verifying UTR entry ${req.params.txId}:`, error);
    res.status(500).json({ error: 'Failed to verify UTR entry' });
  }
});

export default router;