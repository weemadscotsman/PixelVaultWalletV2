import express from 'express';
import { 
  getActiveDrops, 
  getDropById, 
  checkDropEligibility, 
  claimDrop,
  getUserClaimedDrops
} from '../controllers/dropsController';

const router = express.Router();

// Get all active drops
router.get('/', getActiveDrops);

// Get drop by ID
router.get('/:dropId', getDropById);

// Check eligibility for a drop
router.get('/eligible/:dropId/:walletAddress', checkDropEligibility);

// Claim a drop
router.post('/claim/:dropId/:walletAddress', claimDrop);

// Get user's claimed drops
router.get('/claimed/:walletAddress', getUserClaimedDrops);

export default router;