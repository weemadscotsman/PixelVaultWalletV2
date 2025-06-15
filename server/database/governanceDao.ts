import { eq, desc, and, gt } from 'drizzle-orm';
import { db } from './index';
import { governanceProposals, governanceVotes } from './schema';
import { GovernanceProposal, GovernanceVote } from '@shared/types';

/**
 * Data access object for governance proposals and votes
 */
export class GovernanceDao {
  /**
   * Create a new governance proposal
   * @param proposal Governance proposal to create
   * @returns Created governance proposal
   */
  async createProposal(proposal: GovernanceProposal): Promise<GovernanceProposal> {
    try {
      // Convert proposal to database format
      const dbProposal = {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        proposer: proposal.proposer,
        createdAt: BigInt(proposal.createdAt),
        endTime: BigInt(proposal.endTime),
        status: proposal.status,
        votesFor: BigInt(proposal.votesFor),
        votesAgainst: BigInt(proposal.votesAgainst),
        votesAbstain: BigInt(proposal.votesAbstain),
        minimumVotingPower: proposal.minimumVotingPower,
        category: proposal.category,
        parameterChanges: proposal.parameterChanges,
        executionTransactionHash: proposal.executionTransactionHash
      };

      // Insert proposal
      await db.insert(governanceProposals).values(dbProposal);
      
      // Return original proposal
      return proposal;
    } catch (error) {
      console.error('Error creating governance proposal:', error);
      throw new Error('Failed to create governance proposal');
    }
  }

  /**
   * Get governance proposal by ID
   * @param id Governance proposal ID
   * @returns Governance proposal or undefined if not found
   */
  async getProposalById(id: string): Promise<GovernanceProposal | undefined> {
    try {
      const result = await db.select()
        .from(governanceProposals)
        .where(eq(governanceProposals.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to GovernanceProposal
      const dbProposal = result[0];
      return {
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        proposer: dbProposal.proposer,
        createdAt: Number(dbProposal.createdAt),
        endTime: Number(dbProposal.endTime),
        status: dbProposal.status as 'active' | 'passed' | 'rejected' | 'executed',
        votesFor: Number(dbProposal.votesFor),
        votesAgainst: Number(dbProposal.votesAgainst),
        votesAbstain: Number(dbProposal.votesAbstain),
        minimumVotingPower: dbProposal.minimumVotingPower,
        category: dbProposal.category,
        parameterChanges: dbProposal.parameterChanges,
        executionTransactionHash: dbProposal.executionTransactionHash ?? undefined
      };
    } catch (error) {
      console.error('Error getting governance proposal by ID:', error);
      throw new Error('Failed to get governance proposal');
    }
  }

  /**
   * Get all governance proposals
   * @param limit Maximum number of proposals to return
   * @returns Array of governance proposals
   */
  async getAllProposals(limit: number = 100): Promise<GovernanceProposal[]> {
    try {
      const result = await db.select()
        .from(governanceProposals)
        .orderBy(desc(governanceProposals.createdAt))
        .limit(limit);
      
      // Convert database format to GovernanceProposal[]
      return result.map(dbProposal => ({
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        proposer: dbProposal.proposer,
        createdAt: Number(dbProposal.createdAt),
        endTime: Number(dbProposal.endTime),
        status: dbProposal.status as 'active' | 'passed' | 'rejected' | 'executed',
        votesFor: Number(dbProposal.votesFor),
        votesAgainst: Number(dbProposal.votesAgainst),
        votesAbstain: Number(dbProposal.votesAbstain),
        minimumVotingPower: dbProposal.minimumVotingPower,
        category: dbProposal.category,
        parameterChanges: dbProposal.parameterChanges,
        executionTransactionHash: dbProposal.executionTransactionHash ?? undefined
      }));
    } catch (error) {
      console.error('Error getting all governance proposals:', error);
      throw new Error('Failed to get governance proposals');
    }
  }

  /**
   * Get active governance proposals
   * @returns Array of active governance proposals
   */
  async getActiveProposals(): Promise<GovernanceProposal[]> {
    try {
      const result = await db.select()
        .from(governanceProposals)
        .where(
          and(
            eq(governanceProposals.status, 'active'),
            gt(governanceProposals.endTime, BigInt(Date.now()))
          )
        )
        .orderBy(desc(governanceProposals.createdAt));
      
      // Convert database format to GovernanceProposal[]
      return result.map(dbProposal => ({
        id: dbProposal.id,
        title: dbProposal.title,
        description: dbProposal.description,
        proposer: dbProposal.proposer,
        createdAt: Number(dbProposal.createdAt),
        endTime: Number(dbProposal.endTime),
        status: dbProposal.status as 'active' | 'passed' | 'rejected' | 'executed',
        votesFor: Number(dbProposal.votesFor),
        votesAgainst: Number(dbProposal.votesAgainst),
        votesAbstain: Number(dbProposal.votesAbstain),
        minimumVotingPower: dbProposal.minimumVotingPower,
        category: dbProposal.category,
        parameterChanges: dbProposal.parameterChanges,
        executionTransactionHash: dbProposal.executionTransactionHash ?? undefined
      }));
    } catch (error) {
      console.error('Error getting active governance proposals:', error);
      throw new Error('Failed to get active governance proposals');
    }
  }

  /**
   * Update a governance proposal
   * @param proposal Governance proposal to update
   * @returns Updated governance proposal
   */
  async updateProposal(proposal: GovernanceProposal): Promise<GovernanceProposal> {
    try {
      // Check if proposal exists
      const existingProposal = await this.getProposalById(proposal.id);
      if (!existingProposal) {
        return this.createProposal(proposal);
      }
      
      // Convert proposal to database format
      const dbProposal = {
        title: proposal.title,
        description: proposal.description,
        endTime: BigInt(proposal.endTime),
        status: proposal.status,
        votesFor: BigInt(proposal.votesFor),
        votesAgainst: BigInt(proposal.votesAgainst),
        votesAbstain: BigInt(proposal.votesAbstain),
        minimumVotingPower: proposal.minimumVotingPower,
        category: proposal.category,
        parameterChanges: proposal.parameterChanges,
        executionTransactionHash: proposal.executionTransactionHash,
        updatedAt: new Date()
      };

      // Update proposal
      await db.update(governanceProposals)
        .set(dbProposal)
        .where(eq(governanceProposals.id, proposal.id));
      
      // Return updated proposal
      return proposal;
    } catch (error) {
      console.error('Error updating governance proposal:', error);
      throw new Error('Failed to update governance proposal');
    }
  }

  /**
   * Update proposal status
   * @param proposalId Proposal ID
   * @param status New status
   * @param executionTransactionHash Optional transaction hash for executed proposals
   * @returns Updated governance proposal
   */
  async updateProposalStatus(
    proposalId: string,
    status: 'active' | 'passed' | 'rejected' | 'executed',
    executionTransactionHash?: string
  ): Promise<GovernanceProposal | undefined> {
    try {
      // Get existing proposal
      const proposal = await this.getProposalById(proposalId);
      if (!proposal) {
        return undefined;
      }
      
      // Update status
      proposal.status = status;
      if (executionTransactionHash) {
        proposal.executionTransactionHash = executionTransactionHash;
      }
      
      // Save proposal
      return await this.updateProposal(proposal);
    } catch (error) {
      console.error('Error updating proposal status:', error);
      throw new Error('Failed to update proposal status');
    }
  }

  /**
   * Create a new governance vote
   * @param vote Governance vote to create
   * @returns Created governance vote
   */
  async createVote(vote: GovernanceVote): Promise<GovernanceVote> {
    try {
      // Check if user has already voted on this proposal
      const existingVote = await this.getVote(vote.proposalId, vote.voterAddress);
      if (existingVote) {
        throw new Error('User has already voted on this proposal');
      }
      
      // Convert vote to database format
      const dbVote = {
        proposalId: vote.proposalId,
        voterAddress: vote.voterAddress,
        voteType: vote.voteType,
        votingPower: BigInt(vote.votingPower),
        timestamp: BigInt(vote.timestamp)
      };

      // Insert vote
      await db.insert(governanceVotes).values(dbVote);
      
      // Update proposal vote counts
      await this.updateProposalVoteCounts(vote.proposalId);
      
      // Return original vote
      return vote;
    } catch (error) {
      console.error('Error creating governance vote:', error);
      throw new Error('Failed to create governance vote');
    }
  }

  /**
   * Get governance vote
   * @param proposalId Proposal ID
   * @param voterAddress Voter address
   * @returns Governance vote or undefined if not found
   */
  async getVote(proposalId: string, voterAddress: string): Promise<GovernanceVote | undefined> {
    try {
      const result = await db.select()
        .from(governanceVotes)
        .where(
          and(
            eq(governanceVotes.proposalId, proposalId),
            eq(governanceVotes.voterAddress, voterAddress)
          )
        )
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to GovernanceVote
      const dbVote = result[0];
      return {
        proposalId: dbVote.proposalId,
        voterAddress: dbVote.voterAddress,
        voteType: dbVote.voteType as 'for' | 'against' | 'abstain',
        votingPower: Number(dbVote.votingPower),
        timestamp: Number(dbVote.timestamp)
      };
    } catch (error) {
      console.error('Error getting governance vote:', error);
      throw new Error('Failed to get governance vote');
    }
  }

  /**
   * Get votes for a proposal
   * @param proposalId Proposal ID
   * @returns Array of governance votes
   */
  async getVotesForProposal(proposalId: string): Promise<GovernanceVote[]> {
    try {
      const result = await db.select()
        .from(governanceVotes)
        .where(eq(governanceVotes.proposalId, proposalId))
        .orderBy(desc(governanceVotes.timestamp));
      
      // Convert database format to GovernanceVote[]
      return result.map(dbVote => ({
        proposalId: dbVote.proposalId,
        voterAddress: dbVote.voterAddress,
        voteType: dbVote.voteType as 'for' | 'against' | 'abstain',
        votingPower: Number(dbVote.votingPower),
        timestamp: Number(dbVote.timestamp)
      }));
    } catch (error) {
      console.error('Error getting votes for proposal:', error);
      throw new Error('Failed to get governance votes');
    }
  }

  /**
   * Check if a user has voted on a proposal
   * @param proposalId Proposal ID
   * @param voterAddress Voter address
   * @returns True if the user has voted, false otherwise
   */
  async hasUserVoted(proposalId: string, voterAddress: string): Promise<boolean> {
    try {
      const vote = await this.getVote(proposalId, voterAddress);
      return !!vote;
    } catch (error) {
      console.error('Error checking if user has voted:', error);
      throw new Error('Failed to check if user has voted');
    }
  }

  /**
   * Update proposal vote counts based on votes
   * @param proposalId Proposal ID
   * @returns Updated governance proposal
   */
  private async updateProposalVoteCounts(proposalId: string): Promise<GovernanceProposal | undefined> {
    try {
      // Get proposal
      const proposal = await this.getProposalById(proposalId);
      if (!proposal) {
        throw new Error(`Governance proposal not found: ${proposalId}`);
      }
      
      // Get votes for proposal
      const votes = await this.getVotesForProposal(proposalId);
      
      // Calculate vote counts
      let votesFor = 0;
      let votesAgainst = 0;
      let votesAbstain = 0;
      
      for (const vote of votes) {
        if (vote.voteType === 'for') {
          votesFor += vote.votingPower;
        } else if (vote.voteType === 'against') {
          votesAgainst += vote.votingPower;
        } else if (vote.voteType === 'abstain') {
          votesAbstain += vote.votingPower;
        }
      }
      
      // Update proposal
      proposal.votesFor = votesFor;
      proposal.votesAgainst = votesAgainst;
      proposal.votesAbstain = votesAbstain;
      
      // Check if proposal should be finalized
      if (proposal.status === 'active' && Date.now() >= proposal.endTime) {
        // Finalize proposal
        if (votesFor > votesAgainst) {
          proposal.status = 'passed';
        } else {
          proposal.status = 'rejected';
        }
      }
      
      // Save proposal
      return await this.updateProposal(proposal);
    } catch (error) {
      console.error('Error updating proposal vote counts:', error);
      throw new Error('Failed to update proposal vote counts');
    }
  }

  /**
   * Finalize expired proposals
   * @returns Number of proposals finalized
   */
  async finalizeExpiredProposals(): Promise<number> {
    try {
      // Get active proposals
      const proposals = await this.getActiveProposals();
      
      // Filter expired proposals
      const expiredProposals = proposals.filter(p => Date.now() >= p.endTime);
      
      // Finalize each proposal
      let count = 0;
      for (const proposal of expiredProposals) {
        // Determine final status
        if (proposal.votesFor > proposal.votesAgainst) {
          proposal.status = 'passed';
        } else {
          proposal.status = 'rejected';
        }
        
        // Save proposal
        await this.updateProposal(proposal);
        count++;
      }
      
      return count;
    } catch (error) {
      console.error('Error finalizing expired proposals:', error);
      throw new Error('Failed to finalize expired proposals');
    }
  }

  /**
   * Get all votes by a specific voter
   * @param voterAddress The address of the voter
   * @returns Array of governance votes cast by the user
   */
  async getVotesByVoter(voterAddress: string): Promise<GovernanceVote[]> {
    try {
      const result = await db.select()
        .from(governanceVotes)
        .where(eq(governanceVotes.voterAddress, voterAddress))
        .orderBy(desc(governanceVotes.timestamp));

      return result.map(dbVote => ({
        proposalId: dbVote.proposalId,
        voterAddress: dbVote.voterAddress,
        voteType: dbVote.voteType as 'for' | 'against' | 'abstain',
        votingPower: Number(dbVote.votingPower),
        timestamp: Number(dbVote.timestamp)
      }));
    } catch (error) {
      console.error('Error getting votes by voter:', error);
      throw new Error('Failed to get votes by voter');
    }
  }
}

// Create a singleton instance
export const governanceDao = new GovernanceDao();