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

import {
  getAllVetoGuardians,
  getVetoGuardianById,
  getVetoGuardianByAddress,
  createVetoGuardian,
  updateVetoGuardian
} from '../controllers/vetoGuardianController';

const router = express.Router();

// PROPOSAL ROUTES
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

// VETO GUARDIAN ROUTES
// Get all veto guardians
router.get('/veto-guardians', getAllVetoGuardians);

// Get veto guardian by ID
router.get('/veto-guardian/:id', getVetoGuardianById);

// Get veto guardian by wallet address
router.get('/veto-guardian/address/:address', getVetoGuardianByAddress);

// Create new veto guardian
router.post('/veto-guardian/create', createVetoGuardian);

// Update veto guardian (activate/deactivate or modify)
router.patch('/veto-guardian/:id', updateVetoGuardian);

export default router;