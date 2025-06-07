import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface Proposal {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'Active' | 'Passed' | 'Rejected';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  votingEnds: Date;
  createdBy: string;
  createdAt: Date;
}

export interface VetoGuardian {
  id: number;
  address: string;
  name: string;
  isActive: boolean;
  vetoesUsed: number;
  maxVetoes: number;
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  votingPower: number;
  userVotingPower: number;
}

export function useGovernance(walletAddress?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get governance statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/governance/stats', walletAddress],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/governance/stats${walletAddress ? `?address=${walletAddress}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch governance stats');
      return await res.json() as GovernanceStats;
    },
    enabled: !!walletAddress,
  });

  // Get all proposals
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['/api/governance/proposals'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/governance/proposals');
      if (!res.ok) throw new Error('Failed to fetch proposals');
      const data = await res.json();
      return data.map((p: any) => ({
        ...p,
        votingEnds: new Date(p.votingEnds),
        createdAt: new Date(p.createdAt)
      })) as Proposal[];
    },
  });

  // Get veto guardians
  const { data: vetoGuardians = [], isLoading: guardiansLoading } = useQuery({
    queryKey: ['/api/governance/veto-guardians'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/governance/veto-guardians');
      if (!res.ok) throw new Error('Failed to fetch veto guardians');
      return await res.json() as VetoGuardian[];
    },
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      description: string; 
      category: string; 
      createdBy: string;
      votingDuration: number;
    }) => {
      const res = await apiRequest('POST', '/api/governance/proposals', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create proposal');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Created",
        description: "Your governance proposal has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create proposal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Vote on proposal mutation
  const voteMutation = useMutation({
    mutationFn: async (data: { 
      proposalId: number; 
      vote: 'for' | 'against'; 
      voterAddress: string;
      votingPower: number;
    }) => {
      const res = await apiRequest('POST', `/api/governance/proposals/${data.proposalId}/vote`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to vote');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Veto proposal mutation (for guardians)
  const vetoMutation = useMutation({
    mutationFn: async (data: { 
      proposalId: number; 
      guardianAddress: string;
      reason: string;
    }) => {
      const res = await apiRequest('POST', `/api/governance/proposals/${data.proposalId}/veto`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to veto proposal');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Proposal Vetoed",
        description: "The proposal has been vetoed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/governance/veto-guardians'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to veto proposal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    stats,
    proposals,
    vetoGuardians,
    
    // Loading states
    isLoading: statsLoading || proposalsLoading || guardiansLoading,
    
    // Mutations
    createProposal: createProposalMutation.mutate,
    vote: voteMutation.mutate,
    veto: vetoMutation.mutate,
    
    // Mutation states
    isCreatingProposal: createProposalMutation.isPending,
    isVoting: voteMutation.isPending,
    isVetoing: vetoMutation.isPending,
  };
}