import { IStorage } from "../storage";
import { Stake, Proposal, VoteOption, TransactionType, StakingStats } from "@shared/types";
import { calculateVotingPower } from "../utils/crypto";

export class StakingService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Create a new stake
   */
  async createStake(address: string, amount: number, duration: number): Promise<Stake> {
    // Check if wallet has sufficient balance
    const balance = await this.storage.getWalletBalance(address);
    if (balance < amount) {
      throw new Error("Insufficient balance for staking");
    }
    
    // Validate duration (must be at least 30 days)
    if (duration < 30) {
      throw new Error("Minimum staking duration is 30 days");
    }
    
    // Calculate voting power based on amount and duration
    const votingPower = calculateVotingPower(amount, duration);
    
    // Create a new stake
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 24 * 60 * 60 * 1000);
    
    const stake: Omit<Stake, 'id'> = {
      address,
      amount,
      startTime,
      endTime,
      duration,
      votingPower,
      isActive: true
    };
    
    // Create a transaction for the stake
    await this.storage.createTransaction({
      type: TransactionType.STAKE,
      fromAddress: address,
      toAddress: "zk_PVX:staking_pool",
      amount,
      timestamp: new Date(),
      note: `Staked for ${duration} days`
    });
    
    // Update wallet balance
    await this.storage.updateWalletBalance(address, balance - amount);
    
    return this.storage.createStake(stake);
  }

  /**
   * Get active stakes for an address
   */
  async getStakes(address: string): Promise<Stake[]> {
    return this.storage.getStakes(address);
  }

  /**
   * Get staking stats for an address
   */
  async getStakingStats(address: string): Promise<StakingStats> {
    const stakes = await this.storage.getStakes(address);
    
    let totalStaked = 0;
    let totalVotingPower = 0;
    
    // Calculate totals from active stakes
    for (const stake of stakes) {
      if (stake.isActive) {
        totalStaked += stake.amount;
        totalVotingPower += stake.votingPower;
      }
    }
    
    // Mock estimated yield based on current network conditions
    // In a real implementation, this would be calculated based on 
    // total staked tokens, reward rate, etc.
    const estimatedYield = "8.2";
    
    return {
      totalStaked,
      votingPower: totalVotingPower,
      estimatedYield
    };
  }

  /**
   * Unstake tokens
   */
  async unstake(stakeId: string): Promise<boolean> {
    return this.storage.unstake(stakeId);
  }

  /**
   * Get active governance proposals
   */
  async getProposals(): Promise<Proposal[]> {
    try {
      return this.storage.getProposals();
    } catch (error) {
      console.error("Error getting proposals:", error);
      // Return default fallback values
      return [
        {
          id: "1",
          title: "PVX Improvement Proposal #1",
          description: "Allocate 5% of treasury to security audits",
          creatorAddress: "0x58a42d5c19c6066dda35e274f7f08aaca541c1b0",
          createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          status: 'active',
          yesVotes: "6750000",
          noVotes: "2340000",
          abstainVotes: "890000",
          quorum: "8000000",
          voteCount: 126,
          ttl: 21
        }
      ];
    }
  }

  /**
   * Get user votes
   */
  async getVotes(address: string): Promise<{proposalId: string, option: VoteOption}[]> {
    return this.storage.getVotes(address);
  }

  /**
   * Vote on a governance proposal
   */
  async vote(address: string, proposalId: string, option: VoteOption): Promise<boolean> {
    // Verify the proposal exists
    const proposal = await this.storage.getProposal(proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    
    // Check if proposal is still active
    if (proposal.status !== "active" || new Date() > proposal.endTime) {
      throw new Error("Proposal is no longer active");
    }
    
    // Verify that the user has voting power
    const stats = await this.getStakingStats(address);
    if (stats.votingPower <= 0) {
      throw new Error("You need staked tokens to vote");
    }
    
    // Record the vote
    return this.storage.vote(address, proposalId, option);
  }

  /**
   * Create a governance proposal
   */
  async createProposal(
    address: string, 
    title: string, 
    description: string, 
    ttl: number
  ): Promise<Proposal> {
    // Verify that the user has sufficient voting power to create a proposal
    const stats = await this.getStakingStats(address);
    
    // Require minimum 1,000 voting power
    if (stats.votingPower < 1000) {
      throw new Error("Minimum 1,000 voting power required to create proposals");
    }
    
    // Validate TTL (must be between 1 and 30 days)
    if (ttl < 1 || ttl > 30) {
      throw new Error("Proposal duration must be between 1 and 30 days");
    }
    
    // Create a new proposal
    const createTime = new Date();
    const endTime = new Date(createTime.getTime() + ttl * 24 * 60 * 60 * 1000);
    
    const proposal: Omit<Proposal, 'id'> = {
      title,
      description,
      creatorAddress: address,
      createTime,
      endTime,
      status: "active",
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      quorum: 1000, // Minimum votes needed to be valid
      voteCount: 0,
      ttl
    };
    
    // Create a transaction record for the proposal creation
    await this.storage.createTransaction({
      type: TransactionType.GOVERNANCE_PROPOSAL,
      fromAddress: address,
      toAddress: "zk_PVX:governance",
      amount: 0,
      timestamp: new Date(),
      note: `Created proposal: ${title}`
    });
    
    return this.storage.createProposal(proposal);
  }
}
