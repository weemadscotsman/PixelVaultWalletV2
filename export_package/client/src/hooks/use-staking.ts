import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakes, getStakingStats, createStake as createStakeApi, unstake as unstakeApi, getProposals, getVotes, vote as voteApi, createProposal as createProposalApi } from "@/lib/staking";
import { Stake, Proposal, VoteOption } from "@/types/blockchain";
import { useToast } from "./use-toast";

export function useStaking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [votingPower, setVotingPower] = useState<number>(0);
  const [estimatedYield, setEstimatedYield] = useState<string>("8.2");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votesCount, setVotesCount] = useState<number>(0);
  const [userVotes, setUserVotes] = useState<{[proposalId: string]: VoteOption}>({});

  // Initialize with wallet address
  const initializeStaking = useCallback((address: string) => {
    setWalletAddress(address);
  }, []);

  // Fetch stakes when wallet address is available
  const { refetch: refreshStakes } = useQuery({
    queryKey: [`/api/staking/stakes?address=${walletAddress}`],
    enabled: !!walletAddress,
    onSuccess: (data: Stake[]) => {
      if (data) {
        setStakes(data);
        
        // Calculate total staked
        const total = data.reduce((sum, stake) => sum + stake.amount, 0);
        setTotalStaked(total);
        
        // Calculate total voting power
        const vp = data.reduce((sum, stake) => sum + stake.votingPower, 0);
        setVotingPower(vp);
      }
    },
    onError: (error) => {
      console.error("Error fetching stakes:", error);
      toast({
        title: "Failed to Load Stakes",
        description: error instanceof Error ? error.message : "Could not load your staking information",
        variant: "destructive",
      });
    }
  });

  // Fetch staking stats when wallet address is available
  const { refetch: refreshStakingStats } = useQuery({
    queryKey: [`/api/staking/stats?address=${walletAddress}`],
    enabled: !!walletAddress,
    onSuccess: (data) => {
      if (data) {
        setTotalStaked(data.totalStaked);
        setVotingPower(data.votingPower);
        setEstimatedYield(data.estimatedYield);
      }
    },
    onError: (error) => {
      console.error("Error fetching staking stats:", error);
    }
  });

  // Fetch active proposals
  const { refetch: refreshProposals } = useQuery({
    queryKey: ['/api/governance/proposals'],
    onSuccess: (data: Proposal[]) => {
      if (data) {
        setProposals(data);
      }
    },
    onError: (error) => {
      console.error("Error fetching proposals:", error);
      toast({
        title: "Failed to Load Proposals",
        description: error instanceof Error ? error.message : "Could not load governance proposals",
        variant: "destructive",
      });
    }
  });

  // Fetch user votes when wallet address is available
  const { refetch: refreshVotes } = useQuery({
    queryKey: [`/api/governance/votes?address=${walletAddress}`],
    enabled: !!walletAddress,
    onSuccess: (data: {proposalId: string, option: VoteOption}[]) => {
      if (data) {
        const votes: {[proposalId: string]: VoteOption} = {};
        data.forEach(vote => {
          votes[vote.proposalId] = vote.option;
        });
        setUserVotes(votes);
        setVotesCount(data.length);
      }
    },
    onError: (error) => {
      console.error("Error fetching votes:", error);
    }
  });

  // Check if user has voted on a proposal
  const hasVoted = useCallback((proposalId: string): boolean => {
    return userVotes.hasOwnProperty(proposalId);
  }, [userVotes]);

  // Create stake mutation
  const { mutateAsync: createStakeMutation } = useMutation({
    mutationFn: async (params: { address: string; amount: number; duration: number }) => {
      return createStakeApi(params.address, params.amount, params.duration);
    },
    onSuccess: () => {
      // Refresh stakes data after creating a stake
      refreshStakes();
      refreshStakingStats();
      
      // Invalidate wallet balance query
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/balance?address=${walletAddress}`] });
      
      toast({
        title: "Stake Created",
        description: "Your PVX tokens have been staked successfully.",
      });
    },
    onError: (error) => {
      console.error("Staking error:", error);
      toast({
        title: "Staking Failed",
        description: error instanceof Error ? error.message : "Failed to stake your tokens",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Unstake mutation
  const { mutateAsync: unstakeMutation } = useMutation({
    mutationFn: async (stakeId: string) => {
      return unstakeApi(stakeId);
    },
    onSuccess: () => {
      // Refresh stakes data after unstaking
      refreshStakes();
      refreshStakingStats();
      
      // Invalidate wallet balance query
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/balance?address=${walletAddress}`] });
      
      toast({
        title: "Unstaked Successfully",
        description: "Your PVX tokens have been returned to your wallet.",
      });
    },
    onError: (error) => {
      console.error("Unstaking error:", error);
      toast({
        title: "Unstaking Failed",
        description: error instanceof Error ? error.message : "Failed to unstake your tokens",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Vote mutation
  const { mutateAsync: voteMutation } = useMutation({
    mutationFn: async (params: { address: string; proposalId: string; option: VoteOption }) => {
      return voteApi(params.address, params.proposalId, params.option);
    },
    onSuccess: () => {
      // Refresh votes and proposals after voting
      refreshVotes();
      refreshProposals();
      
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded.",
      });
    },
    onError: (error) => {
      console.error("Voting error:", error);
      toast({
        title: "Voting Failed",
        description: error instanceof Error ? error.message : "Failed to submit your vote",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Create proposal mutation
  const { mutateAsync: createProposalMutation } = useMutation({
    mutationFn: async (params: { 
      address: string; 
      title: string; 
      description: string; 
      ttl: number;
    }) => {
      return createProposalApi(params.address, params.title, params.description, params.ttl);
    },
    onSuccess: () => {
      // Refresh proposals after creating
      refreshProposals();
      
      toast({
        title: "Proposal Created",
        description: "Your governance proposal has been submitted.",
      });
    },
    onError: (error) => {
      console.error("Proposal creation error:", error);
      toast({
        title: "Proposal Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create your proposal",
        variant: "destructive",
      });
      throw error;
    }
  });

  // Refresh data periodically
  useEffect(() => {
    if (walletAddress) {
      // Initial load
      refreshStakes();
      refreshStakingStats();
      refreshVotes();
      refreshProposals();
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        refreshProposals();
        refreshStakes();
      }, 60000); // every minute
      
      return () => clearInterval(interval);
    }
  }, [walletAddress, refreshStakes, refreshStakingStats, refreshVotes, refreshProposals]);

  return {
    stakes,
    totalStaked,
    votingPower,
    estimatedYield,
    proposals,
    votesCount,
    userVotes,
    initializeStaking,
    createStake: async (address: string, amount: number, duration: number) => {
      return createStakeMutation({ address, amount, duration });
    },
    unstake: async (stakeId: string) => {
      return unstakeMutation(stakeId);
    },
    vote: async (address: string, proposalId: string, option: VoteOption) => {
      return voteMutation({ address, proposalId, option });
    },
    hasVoted,
    createProposal: async (address: string, title: string, description: string, ttl: number) => {
      return createProposalMutation({ address, title, description, ttl });
    }
  };
}
