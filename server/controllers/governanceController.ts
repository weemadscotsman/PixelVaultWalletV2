import { Request, Response } from 'express';
import crypto from 'crypto';
// import { memBlockchainStorage } from '../mem-blockchain'; // Will be removed if other fns are refactored
import { broadcastTransaction } from '../utils/websocket';
import { PVX_GOVERNANCE_ADDRESS } from '../utils/constants';
import { generateRandomHash } from '../utils/crypto';
import { governanceDao } from '../database/governanceDao';
import {
  GovernanceProposal as SharedGovernanceProposal,
  GovernanceVote as SharedGovernanceVote,
  ProposalStatus as SharedProposalStatus,
  VoteType as SharedVoteType,
  Transaction as SharedTransaction // For transaction creation
} from '@shared/types';
import { walletDao } from '../database/walletDao';
import { stakingService } from '../services/stakingService';
import { transactionDao } from '../database/transactionDao';


// Define TransactionType as string literals since the enum is not available
const LocalTransactionType = { // Renamed to avoid conflict if shared TransactionType is different
  TRANSFER: 'TRANSFER' as SharedTransaction['type'],
  MINING_REWARD: 'MINING_REWARD'as SharedTransaction['type'],
  STAKING_REWARD: 'STAKING_REWARD'as SharedTransaction['type'],
  AIRDROP: 'AIRDROP'as SharedTransaction['type'],
  NFT_MINT: 'NFT_MINT'as SharedTransaction['type'],
  BADGE_AWARD: 'BADGE_AWARD'as SharedTransaction['type'],
  GOVERNANCE_VOTE: 'GOVERNANCE_VOTE'as SharedTransaction['type'],
  GOVERNANCE_PROPOSAL: 'GOVERNANCE_PROPOSAL'as SharedTransaction['type']
};

// Using SharedProposalStatus and SharedVoteType now, removing local enums
// enum ProposalStatus {
//   ACTIVE = 'active',
//   PASSED = 'passed',
//   REJECTED = 'rejected',
//   EXECUTED = 'executed'
// }

// enum VoteType {
//   FOR = 'for',
//   AGAINST = 'against',
//   ABSTAIN = 'abstain'
// }

// Remove in-memory storage for proposals
// const governanceProposals: Proposal[] = [ ... ];

/**
 * Get all governance proposals
 */
export const getAllProposals = async (req: Request, res: Response): Promise<void> => {
  try {
    const proposalsFromDao = await governanceDao.getAllProposals();

    const responseProposals = await Promise.all(proposalsFromDao.map(async (proposal) => {
      const votes = await governanceDao.getVotesForProposal(proposal.id);
      // Ensure dates are consistently formatted (e.g., ISO strings or numbers as per API contract)
      // The DAO already returns numbers for createdAt, endTime
      return {
        ...proposal,
        voterCount: votes.length,
        // Ensure status and category match expected client values (string/enum)
        // DAO returns them as strings which should be fine if they match local enums/shared types.
      };
    }));
    
    res.status(200).json(responseProposals);
  } catch (error) {
    console.error('Error getting governance proposals:', error);
    res.status(500).json({ error: 'Failed to fetch governance proposals' });
  }
};

/**
 * Get a specific proposal by ID
 */
export const getProposalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    const proposal = await governanceDao.getProposalById(proposalId);
    
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }
    
    const votesFromDao = await governanceDao.getVotesForProposal(proposalId);
    const sanitizedVotes = votesFromDao.map(vote => ({
      ...vote,
      // Sanitize voter address
      voterAddress: `${vote.voterAddress.substring(0, 6)}...${vote.voterAddress.substring(vote.voterAddress.length - 4)}`,
      // Ensure voteType matches expected client values (string/enum)
      // Ensure timestamp is in expected format
      timestamp: Number(vote.timestamp) // DAO returns number, ensure it's what client expects
    }));

    const responseProposal = {
      ...proposal,
      // Ensure dates are consistently formatted
      createdAt: Number(proposal.createdAt),
      endTime: Number(proposal.endTime),
      votes: sanitizedVotes // Replace 'voters' with 'votes' if that's the new structure from DAO/shared type
    };
    
    // If the original response had a 'voters' field with specific structure, adapt here.
    // For now, assuming the client expects 'votes' as an array of vote objects.
    // If the original `Proposal` interface's `voters` structure is strictly needed,
    // then `sanitizedVotes` would need to be mapped to that structure.
    // The DAO returns GovernanceVote[], which has voterAddress, voteType, votingPower, timestamp.
    // The old interface had `voters: { address, voteType, votingPower, timestamp }[]`
    // So, mapping voterAddress to address is needed if using old interface structure.
    // For simplicity, let's assume the client can adapt to `voterAddress` or the shared type is used.

    res.status(200).json(responseProposal);
  } catch (error) {
    console.error('Error getting proposal by ID:', error);
    res.status(500).json({ error: 'Failed to fetch proposal' });
  }
};

/**
 * Create a new governance proposal
 */
export const createProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, proposerAddress, endTimeInDays, minimumVotingPower, parameterChanges } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !proposerAddress || !endTimeInDays) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if wallet exists using walletDao
    const wallet = await walletDao.getWalletByAddress(proposerAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Proposer wallet not found' });
      return;
    }
    
    // Check if proposer has enough voting power (staked tokens) using stakingService
    const activeStakes = await stakingService.getActiveStakes(proposerAddress);
    const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
    
    const MIN_POWER_TO_PROPOSE = 10000; // Example value, should be a constant
    if (totalStaked < MIN_POWER_TO_PROPOSE) {
      res.status(400).json({ error: `Insufficient voting power to create a proposal. Minimum ${MIN_POWER_TO_PROPOSE} μPVX staked required.` });
      return;
    }
    
    const proposalId = `gov_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();
    
    const newProposalData: SharedGovernanceProposal = {
      id: proposalId,
      title,
      description,
      proposer: proposerAddress,
      createdAt: now,
      endTime: now + (endTimeInDays * 24 * 60 * 60 * 1000),
      status: SharedProposalStatus.ACTIVE, // Use shared enum
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      minimumVotingPower: minimumVotingPower || 1000,
      category: category, // Assuming category from body matches SharedGovernanceProposal['category']
      parameterChanges: parameterChanges || [],
      // 'votes' field is usually not part of proposal creation, but handled by separate votes table
    };
    
    const createdProposal = await governanceDao.createProposal(newProposalData);
    
    const txHash = crypto.createHash('sha256')
      .update(`proposal_create_${proposalId}_${proposerAddress}_${now}`)
      .digest('hex');
    
    const transaction: SharedTransaction = {
      hash: txHash,
      type: LocalTransactionType.GOVERNANCE_PROPOSAL,
      from: proposerAddress, // Correct field name for shared type
      to: PVX_GOVERNANCE_ADDRESS, // Correct field name for shared type
      amount: 0,
      timestamp: now,
      nonce: wallet.nonce ? wallet.nonce + 1 : 1, // Example nonce handling
      signature: generateRandomHash(), // Placeholder
      status: 'confirmed', // Or 'pending' then updated by a block
      metadata: {
        action: 'create_proposal',
        proposalId,
        title
      }
    };
    
    await transactionDao.createTransaction(transaction);
    // Potentially update wallet nonce if that's handled centrally
    
    // Broadcast transaction via WebSocket
    try {
      broadcastTransaction(transaction);
    } catch (err) {
      console.error('Error broadcasting proposal creation transaction:', err);
    }
    
    res.status(201).json({
      success: true,
      message: 'Governance proposal created successfully',
      proposal: createdProposal, // Return proposal from DB
      transactionHash: txHash
    });
    
  } catch (error) {
    console.error('Error creating governance proposal:', error);
    res.status(500).json({ error: 'Failed to create governance proposal' });
  }
};

/**
 * Vote on a governance proposal
 */
export const voteOnProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    const { voterAddress, voteType } = req.body;
    
    // Validate required fields
    if (!proposalId || !voterAddress || !voteType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if proposal exists using DAO
    const proposal = await governanceDao.getProposalById(proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }
    
    // Check if proposal is still active (using shared enum if available)
    if (proposal.status !== SharedProposalStatus.ACTIVE) { // Assuming SharedProposalStatus.ACTIVE
      res.status(400).json({ error: 'This proposal is no longer active' });
      return;
    }
    
    // Check if voting period is still open
    if (Number(proposal.endTime) < Date.now()) {
      res.status(400).json({ error: 'Voting period for this proposal has ended' });
      return;
    }
    
    // Check if wallet exists using walletDao
    const wallet = await walletDao.getWalletByAddress(voterAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Voter wallet not found' });
      return;
    }
    
    // Check if user has already voted using DAO
    const alreadyVoted = await governanceDao.hasUserVoted(proposalId, voterAddress);
    if (alreadyVoted) {
      res.status(400).json({ error: 'You have already voted on this proposal' });
      return;
    }
    
    // Calculate voting power (based on staked tokens) using stakingService
    const activeStakes = await stakingService.getActiveStakes(voterAddress);
    const votingPower = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
    
    // Check if voter has minimum required voting power
    if (votingPower < proposal.minimumVotingPower) {
      res.status(400).json({ 
        error: `Insufficient voting power. Minimum ${proposal.minimumVotingPower} μPVX staked required.` 
      });
      return;
    }
    
    const now = Date.now();
    const newVote: SharedGovernanceVote = {
      proposalId,
      voterAddress,
      voteType: voteType as SharedVoteType, // Cast to shared enum
      votingPower,
      timestamp: now
    };
    
    // Save the vote using DAO (DAO handles updating proposal counts)
    const createdVote = await governanceDao.createVote(newVote);
    
    const txHash = crypto.createHash('sha256')
      .update(`proposal_vote_${proposalId}_${voterAddress}_${now}`)
      .digest('hex');
    
    const transaction: SharedTransaction = {
      hash: txHash,
      type: LocalTransactionType.GOVERNANCE_VOTE,
      from: voterAddress, // Correct field name
      to: PVX_GOVERNANCE_ADDRESS, // Correct field name
      amount: 0,
      timestamp: now,
      nonce: wallet.nonce ? wallet.nonce + 1 : 1, // Example nonce handling
      signature: generateRandomHash(), // Placeholder
      status: 'confirmed', // Or 'pending'
      metadata: {
        action: 'vote',
        proposalId,
        voteType: createdVote.voteType,
        votingPower: createdVote.votingPower
      }
    };
    
    await transactionDao.createTransaction(transaction);
    // Potentially update wallet nonce if that's handled centrally
    
    // Broadcast transaction via WebSocket
    try {
      broadcastTransaction(transaction);
    } catch (err) {
      console.error('Error broadcasting vote transaction:', err);
      // Continue even if broadcast fails
    }
    
    res.status(200).json({
      success: true,
      message: `Vote cast successfully: ${voteType}`,
      votingPower,
      transactionHash: txHash
    });
    
  } catch (error) {
    console.error('Error voting on proposal:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
};

/**
 * Execute a passed proposal
 */
export const executeProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    const { executorAddress } = req.body;
    
    // Validate required fields
    if (!proposalId || !executorAddress) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if proposal exists
    const proposal = governanceProposals.find(p => p.id === proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }
    
    // Check if proposal is still active
    if (proposal.status !== ProposalStatus.ACTIVE) {
      res.status(400).json({ error: 'This proposal has already been processed' });
      return;
    }
    
    // Check if voting period has ended
    if (proposal.endTime > Date.now()) {
      res.status(400).json({ error: 'Voting period for this proposal has not ended yet' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(executorAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Executor wallet not found' });
      return;
    }
    
    // Determine if proposal passed
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const isPassed = totalVotes > 0 && proposal.votesFor > proposal.votesAgainst;
    
    // Update proposal status
    proposal.status = isPassed ? ProposalStatus.PASSED : ProposalStatus.REJECTED;
    
    // Create a transaction for the execution
    const now = Date.now();
    const txHash = crypto.createHash('sha256')
      .update(`proposal_execute_${proposalId}_${executorAddress}_${now}`)
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.GOVERNANCE,
      from: executorAddress,
      to: PVX_GOVERNANCE_ADDRESS,
      amount: 0, // No tokens transferred for execution
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed',
      metadata: {
        action: 'execute_proposal',
        proposalId,
        result: isPassed ? 'passed' : 'rejected'
      }
    };
    
    // Add transaction to the blockchain
    await memBlockchainStorage.createTransaction(transaction);
    
    // Save transaction hash in proposal
    proposal.executionTransactionHash = txHash;
    
    // Implement proposal changes if passed
    if (isPassed) {
      await implementProposalChanges(proposal);
      proposal.status = ProposalStatus.EXECUTED;
    }
    
    // Broadcast transaction via WebSocket
    try {
      broadcastTransaction(transaction);
    } catch (err) {
      console.error('Error broadcasting proposal execution transaction:', err);
      // Continue even if broadcast fails
    }
    
    res.status(200).json({
      success: true,
      message: `Proposal ${isPassed ? 'passed' : 'rejected'} and ${isPassed ? 'executed' : 'recorded'} successfully`,
      result: isPassed ? 'passed' : 'rejected',
      transactionHash: txHash
    });
    
  } catch (error) {
    console.error('Error executing proposal:', error);
    res.status(500).json({ error: 'Failed to execute proposal' });
  }
};

/**
 * Implement changes from a passed proposal
 */
async function implementProposalChanges(proposal: Proposal): Promise<void> {
  // This would contain the logic to implement the changes from the proposal
  // For now, we'll just log the implementation
  console.log(`Implementing proposal ${proposal.id}: ${proposal.title}`);
  
  switch (proposal.category) {
    case 'PARAMETER':
      if (proposal.parameterChanges) {
        for (const change of proposal.parameterChanges) {
          console.log(`Changing parameter ${change.paramName} from ${change.currentValue} to ${change.proposedValue}`);
          // Here we would actually update the parameter in the system
        }
      }
      break;
    case 'TREASURY':
      console.log(`Executing treasury action from proposal: ${proposal.title}`);
      // Here we would implement treasury-related changes
      break;
    case 'PROTOCOL':
      console.log(`Executing protocol change from proposal: ${proposal.title}`);
      // Here we would implement protocol-level changes
      break;
    case 'SOCIAL':
      console.log(`Executing social directive from proposal: ${proposal.title}`);
      // Social directives might not need on-chain implementation
      break;
  }
}

/**
 * Get governance stats
 */
export const getGovernanceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeProposals = governanceProposals.filter(p => p.status === ProposalStatus.ACTIVE).length;
    const passedProposals = governanceProposals.filter(p => p.status === ProposalStatus.PASSED || p.status === ProposalStatus.EXECUTED).length;
    const rejectedProposals = governanceProposals.filter(p => p.status === ProposalStatus.REJECTED).length;
    
    const totalVotes = governanceProposals.reduce((sum, proposal) => {
      return sum + proposal.voters.length;
    }, 0);
    
    const totalVotingPower = governanceProposals.reduce((sum, proposal) => {
      return sum + proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    }, 0);
    
    res.status(200).json({
      activeProposals,
      passedProposals,
      rejectedProposals,
      totalProposals: governanceProposals.length,
      totalVotes,
      totalVotingPower
    });
  } catch (error) {
    console.error('Error getting governance stats:', error);
    res.status(500).json({ error: 'Failed to fetch governance stats' });
  }
};

/**
 * Get user voting power
 */
export const getUserVotingPower = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(walletAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }
    
    // Calculate voting power (based on staked tokens)
    const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(walletAddress);
    const votingPower = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
    
    // Get user's voting history
    const votingHistory = governanceProposals.reduce((history, proposal) => {
      const vote = proposal.voters.find(v => v.address === walletAddress);
      if (vote) {
        history.push({
          proposalId: proposal.id,
          proposalTitle: proposal.title,
          voteType: vote.voteType,
          votingPower: vote.votingPower,
          timestamp: vote.timestamp
        });
      }
      return history;
    }, [] as any[]);
    
    res.status(200).json({
      address: walletAddress,
      currentVotingPower: votingPower,
      votingHistory
    });
  } catch (error) {
    console.error('Error getting user voting power:', error);
    res.status(500).json({ error: 'Failed to fetch user voting power' });
  }
};