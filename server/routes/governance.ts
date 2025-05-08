import express from 'express';
import { 
  getAllProposals,
  getProposalById,
  createProposal,
  voteOnProposal,
  executeProposal,
  getGovernanceStats,
  getUserVotingPower
} from '../controllers/governanceController';

const router = express.Router();

// Get all proposals
router.get('/proposals', getAllProposals);

// Get proposal by ID
router.get('/proposals/:proposalId', getProposalById);

// Create new proposal
router.post('/proposals', createProposal);

// Vote on a proposal
router.post('/vote/:proposalId', voteOnProposal);

// Execute a proposal
router.post('/execute/:proposalId', executeProposal);

// Get governance stats
router.get('/stats', getGovernanceStats);

// Get user voting power
router.get('/voting-power/:walletAddress', getUserVotingPower);

export default router;