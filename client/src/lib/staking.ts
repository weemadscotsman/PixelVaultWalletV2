import { Stake, Proposal, VoteOption, StakingStats } from "@/types/blockchain";

// Mock base URL - in a real app, this would be configured properly
const API_BASE_URL = "/api";

// Create a new stake
export async function createStake(
  address: string,
  amount: number,
  duration: number
): Promise<Stake> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, amount, duration }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create stake: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error creating stake:", error);
    throw new Error("Failed to create stake");
  }
}

// Get active stakes for an address
export async function getStakes(address: string): Promise<Stake[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking/stakes?address=${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stakes: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching stakes:", error);
    throw new Error("Failed to fetch stakes");
  }
}

// Get staking stats for an address
export async function getStakingStats(address: string): Promise<StakingStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking/stats?address=${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch staking stats: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching staking stats:", error);
    throw new Error("Failed to fetch staking stats");
  }
}

// Unstake (if allowed based on lock duration)
export async function unstake(stakeId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/staking/unstake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stakeId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to unstake: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error unstaking:", error);
    throw new Error("Failed to unstake");
  }
}

// Calculate voting power based on stake amount and duration
export function calculateVotingPower(amount: number, durationDays: number): number {
  // Implementation based on the formula: voting power = amount * multiplier
  // where multiplier is determined by duration
  let multiplier = 1.0;
  
  if (durationDays >= 365) {
    multiplier = 3.0; // 3x for 1 year
  } else if (durationDays >= 180) {
    multiplier = 2.0; // 2x for 6 months
  } else if (durationDays >= 90) {
    multiplier = 1.5; // 1.5x for 3 months
  } else if (durationDays >= 30) {
    multiplier = 1.2; // 1.2x for 1 month
  }
  
  return amount * multiplier;
}

// Get active governance proposals
export async function getProposals(): Promise<Proposal[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/proposals`);
    if (!response.ok) {
      throw new Error(`Failed to fetch proposals: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching proposals:", error);
    throw new Error("Failed to fetch proposals");
  }
}

// Get votes for an address
export async function getVotes(address: string): Promise<{
  proposalId: string;
  option: VoteOption;
}[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/votes?address=${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch votes: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching votes:", error);
    throw new Error("Failed to fetch votes");
  }
}

// Vote on a proposal
export async function vote(
  address: string,
  proposalId: string,
  option: VoteOption
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, proposalId, option }),
    });

    if (!response.ok) {
      throw new Error(`Failed to vote: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error voting:", error);
    throw new Error("Failed to vote");
  }
}

// Create a governance proposal (requires minimum voting power)
export async function createProposal(
  address: string,
  title: string,
  description: string,
  ttl: number // Time to live in days
): Promise<Proposal> {
  try {
    const response = await fetch(`${API_BASE_URL}/governance/proposal/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address, title, description, ttl }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create proposal: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw new Error("Failed to create proposal");
  }
}
