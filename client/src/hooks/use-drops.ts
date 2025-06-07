import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface Drop {
  id: string;
  name: string;
  description: string;
  tokenAmount: string;
  totalSupply: string;
  claimed: string;
  remaining: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  eligibilityType: 'staking' | 'mining' | 'governance' | 'all';
  minimumRequirement: string;
  claimersCount: number;
  maxClaimers: number;
}

export interface DropClaim {
  id: string;
  dropId: string;
  userAddress: string;
  amount: string;
  claimedAt: Date;
  txHash: string;
}

export interface UserDropEligibility {
  dropId: string;
  isEligible: boolean;
  reason: string;
  userScore: number;
  requiredScore: number;
  alreadyClaimed: boolean;
}

export function useDrops(walletAddress?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all available drops
  const { data: drops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ['/api/drops'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/drops');
      if (!res.ok) throw new Error('Failed to fetch drops');
      const data = await res.json();
      return data.map((drop: any) => ({
        ...drop,
        startDate: new Date(drop.startDate),
        endDate: new Date(drop.endDate)
      })) as Drop[];
    },
  });

  // Get user's drop eligibility
  const { data: eligibility = [], isLoading: eligibilityLoading } = useQuery({
    queryKey: ['/api/drops/eligibility', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await apiRequest('GET', `/api/drops/eligibility?address=${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch drop eligibility');
      return await res.json() as UserDropEligibility[];
    },
    enabled: !!walletAddress,
  });

  // Get user's claimed drops
  const { data: claimedDrops = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['/api/drops/claims', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await apiRequest('GET', `/api/drops/claims?address=${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch drop claims');
      const data = await res.json();
      return data.map((claim: any) => ({
        ...claim,
        claimedAt: new Date(claim.claimedAt)
      })) as DropClaim[];
    },
    enabled: !!walletAddress,
  });

  // Get drop statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/drops/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/drops/stats');
      if (!res.ok) throw new Error('Failed to fetch drop stats');
      return await res.json();
    },
  });

  // Claim drop mutation
  const claimDropMutation = useMutation({
    mutationFn: async (data: { dropId: string; userAddress: string }) => {
      const res = await apiRequest('POST', `/api/drops/${data.dropId}/claim`, {
        address: data.userAddress
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to claim drop');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Drop Claimed Successfully",
        description: `You've claimed ${data.amount} PVX tokens!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/drops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drops/eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drops/claims'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drops/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim drop",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create drop mutation (admin only)
  const createDropMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      tokenAmount: string;
      totalSupply: string;
      duration: number;
      eligibilityType: string;
      minimumRequirement: string;
      maxClaimers: number;
    }) => {
      const res = await apiRequest('POST', '/api/drops', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create drop');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Drop Created",
        description: "New airdrop has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/drops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drops/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create drop",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getEligibilityForDrop = (dropId: string): UserDropEligibility | undefined => {
    return eligibility.find(e => e.dropId === dropId);
  };

  const hasClaimedDrop = (dropId: string): boolean => {
    return claimedDrops.some(claim => claim.dropId === dropId);
  };

  const getActiveDrops = (): Drop[] => {
    return drops.filter(drop => drop.isActive && new Date() < drop.endDate);
  };

  const getUpcomingDrops = (): Drop[] => {
    return drops.filter(drop => new Date() < drop.startDate);
  };

  const getExpiredDrops = (): Drop[] => {
    return drops.filter(drop => new Date() > drop.endDate);
  };

  return {
    // Data
    drops,
    eligibility,
    claimedDrops,
    stats,
    
    // Loading states
    isLoading: dropsLoading || eligibilityLoading || claimsLoading,
    
    // Mutations
    claimDrop: claimDropMutation.mutate,
    createDrop: createDropMutation.mutate,
    
    // Mutation states
    isClaiming: claimDropMutation.isPending,
    isCreating: createDropMutation.isPending,
    
    // Helper functions
    getEligibilityForDrop,
    hasClaimedDrop,
    getActiveDrops,
    getUpcomingDrops,
    getExpiredDrops,
  };
}