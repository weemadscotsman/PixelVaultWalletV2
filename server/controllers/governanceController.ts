import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { broadcastTransaction } from '../utils/websocket';
import { PVX_GOVERNANCE_ADDRESS } from '../utils/constants';
import { generateRandomHash } from '../utils/crypto';

// Define TransactionType as string literals since the enum is not available
const TransactionType = {
  TRANSFER: 'TRANSFER',
  MINING_REWARD: 'MINING_REWARD',
  STAKING_REWARD: 'STAKING_REWARD',
  AIRDROP: 'AIRDROP',
  NFT_MINT: 'NFT_MINT',
  BADGE_AWARD: 'BADGE_AWARD',
  GOVERNANCE_VOTE: 'GOVERNANCE_VOTE',
  GOVERNANCE_PROPOSAL: 'GOVERNANCE_PROPOSAL'
};

// Proposal status enum
enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXECUTED = 'executed'
}

// Vote type enum
enum VoteType {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain'
}

// Governance proposal interface
interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  endTime: number;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  minimumVotingPower: number;
  category: 'PROTOCOL' | 'TREASURY' | 'PARAMETER' | 'SOCIAL';
  parameterChanges?: {
    paramName: string;
    currentValue: string;
    proposedValue: string;
  }[];
  voters: {
    address: string;
    voteType: VoteType;
    votingPower: number;
    timestamp: number;
  }[];
  executionTransactionHash?: string;
}

// In-memory storage for proposals
const governanceProposals: Proposal[] = [
  {
    id: 'gov_001',
    title: 'Increase Staking Rewards',
    description: 'Proposal to increase staking rewards by 5% for all pools to incentivize network participation.',
    proposer: 'PVX_4cf911a2bfc8c35d91d05346f0f2cd96',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    endTime: Date.now() + 4 * 24 * 60 * 60 * 1000, // 4 days from now
    status: ProposalStatus.ACTIVE,
    votesFor: 25000,
    votesAgainst: 10000,
    votesAbstain: 5000,
    minimumVotingPower: 1000,
    category: 'PARAMETER',
    parameterChanges: [
      {
        paramName: 'stakingRewardMultiplier',
        currentValue: '1.0',
        proposedValue: '1.05'
      }
    ],
    voters: [
      {
        address: 'PVX_9703f23ff29015d96de825c2309ef249',
        voteType: VoteType.FOR,
        votingPower: 15000,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        address: 'PVX_f5ba480b7db6010eecb453eca8e67ff0',
        voteType: VoteType.FOR,
        votingPower: 10000,
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
      },
      {
        address: 'PVX_1e1ee32c2770a6af3ca119759c539907',
        voteType: VoteType.AGAINST,
        votingPower: 10000,
        timestamp: Date.now() - 12 * 60 * 60 * 1000
      },
      {
        address: 'PVX_8d7f1d18e22434e2f3fcb90098c5c898',
        voteType: VoteType.ABSTAIN,
        votingPower: 5000,
        timestamp: Date.now() - 6 * 60 * 60 * 1000
      }
    ]
  },
  {
    id: 'gov_002',
    title: 'Community Development Fund',
    description: 'Create a community development fund with 1% of all transaction fees to support ecosystem growth and developer initiatives.',
    proposer: 'PVX_1e1ee32c2770a6af3ca119759c539907',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    endTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
    status: ProposalStatus.ACTIVE,
    votesFor: 35000,
    votesAgainst: 15000,
    votesAbstain: 2000,
    minimumVotingPower: 1000,
    category: 'TREASURY',
    voters: [
      {
        address: 'PVX_4cf911a2bfc8c35d91d05346f0f2cd96',
        voteType: VoteType.FOR,
        votingPower: 20000,
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
      },
      {
        address: 'PVX_9703f23ff29015d96de825c2309ef249',
        voteType: VoteType.FOR,
        votingPower: 15000,
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
      },
      {
        address: 'PVX_f5ba480b7db6010eecb453eca8e67ff0',
        voteType: VoteType.AGAINST,
        votingPower: 15000,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
      },
      {
        address: 'PVX_8d7f1d18e22434e2f3fcb90098c5c898',
        voteType: VoteType.ABSTAIN,
        votingPower: 2000,
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
      }
    ]
  }
];

/**
 * Get all governance proposals
 */
export const getAllProposals = async (req: Request, res: Response): Promise<void> => {
  try {
    // Don't send full voter data to client for privacy
    const sanitizedProposals = governanceProposals.map(({ voters, ...rest }) => ({
      ...rest,
      voterCount: voters.length
    }));
    
    res.status(200).json(sanitizedProposals);
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
    const proposal = governanceProposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }
    
    // Don't send voter addresses to client for privacy
    const sanitizedProposal = {
      ...proposal,
      voters: proposal.voters.map(({ address, ...rest }) => ({
        ...rest,
        // Only send first and last 4 characters of address
        address: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      }))
    };
    
    res.status(200).json(sanitizedProposal);
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
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(proposerAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Proposer wallet not found' });
      return;
    }
    
    // Check if proposer has enough voting power (staked tokens)
    const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(proposerAddress);
    const totalStaked = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
    
    if (totalStaked < 10000) { // Minimum 10,000 μPVX to create a proposal
      res.status(400).json({ error: 'Insufficient voting power to create a proposal. Minimum 10,000 μPVX staked required.' });
      return;
    }
    
    // Generate a unique ID for the proposal
    const proposalId = `gov_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();
    
    // Create the new proposal
    const newProposal: Proposal = {
      id: proposalId,
      title,
      description,
      proposer: proposerAddress,
      createdAt: now,
      endTime: now + (endTimeInDays * 24 * 60 * 60 * 1000), // Convert days to milliseconds
      status: ProposalStatus.ACTIVE,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      minimumVotingPower: minimumVotingPower || 1000, // Default to 1000 μPVX if not specified
      category: category as any, // Cast to the correct type
      parameterChanges,
      voters: []
    };
    
    // Add the proposal to the list
    governanceProposals.push(newProposal);
    
    // Create a transaction for the proposal creation
    const txHash = crypto.createHash('sha256')
      .update(`proposal_create_${proposalId}_${proposerAddress}_${now}`)
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.GOVERNANCE_PROPOSAL,
      from: proposerAddress,
      to: PVX_GOVERNANCE_ADDRESS,
      amount: 0, // No tokens transferred for proposal creation
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed',
      metadata: {
        action: 'create_proposal',
        proposalId,
        title
      }
    };
    
    // Add transaction to the blockchain
    await memBlockchainStorage.createTransaction(transaction);
    
    // Broadcast transaction via WebSocket
    try {
      broadcastTransaction(transaction);
    } catch (err) {
      console.error('Error broadcasting proposal creation transaction:', err);
      // Continue even if broadcast fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Governance proposal created successfully',
      proposal: newProposal,
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
    
    // Check if proposal exists
    const proposal = governanceProposals.find(p => p.id === proposalId);
    if (!proposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }
    
    // Check if proposal is still active
    if (proposal.status !== ProposalStatus.ACTIVE) {
      res.status(400).json({ error: 'This proposal is no longer active' });
      return;
    }
    
    // Check if voting period is still open
    if (proposal.endTime < Date.now()) {
      res.status(400).json({ error: 'Voting period for this proposal has ended' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(voterAddress);
    if (!wallet) {
      res.status(404).json({ error: 'Voter wallet not found' });
      return;
    }
    
    // Check if user has already voted
    const existingVote = proposal.voters.find(v => v.address === voterAddress);
    if (existingVote) {
      res.status(400).json({ error: 'You have already voted on this proposal' });
      return;
    }
    
    // Calculate voting power (based on staked tokens)
    const activeStakes = await memBlockchainStorage.getActiveStakesByAddress(voterAddress);
    const votingPower = activeStakes.reduce((sum, stake) => sum + parseFloat(stake.amount), 0);
    
    // Check if voter has minimum required voting power
    if (votingPower < proposal.minimumVotingPower) {
      res.status(400).json({ 
        error: `Insufficient voting power. Minimum ${proposal.minimumVotingPower} μPVX staked required.` 
      });
      return;
    }
    
    // Add the vote
    const now = Date.now();
    proposal.voters.push({
      address: voterAddress,
      voteType: voteType as VoteType,
      votingPower,
      timestamp: now
    });
    
    // Update vote counts
    switch (voteType) {
      case VoteType.FOR:
        proposal.votesFor += votingPower;
        break;
      case VoteType.AGAINST:
        proposal.votesAgainst += votingPower;
        break;
      case VoteType.ABSTAIN:
        proposal.votesAbstain += votingPower;
        break;
      default:
        res.status(400).json({ error: 'Invalid vote type' });
        return;
    }
    
    // Create a transaction for the vote
    const txHash = crypto.createHash('sha256')
      .update(`proposal_vote_${proposalId}_${voterAddress}_${now}`)
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.GOVERNANCE_VOTE,
      from: voterAddress,
      to: PVX_GOVERNANCE_ADDRESS,
      amount: 0, // No tokens transferred for voting
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed',
      metadata: {
        action: 'vote',
        proposalId,
        voteType,
        votingPower
      }
    };
    
    // Add transaction to the blockchain
    await memBlockchainStorage.createTransaction(transaction);
    
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