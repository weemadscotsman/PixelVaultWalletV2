import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconType: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'mining' | 'staking' | 'governance' | 'trading' | 'social';
  requirements: {
    type: string;
    value: number;
    description: string;
  };
  rewards: {
    pvxAmount?: string;
    stakingBonus?: number;
    votingPowerBonus?: number;
  };
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  userAddress: string;
  earnedAt: Date;
  progress: number;
  isCompleted: boolean;
  badge: Badge;
}

export interface BadgeProgress {
  badgeId: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  nextMilestone?: number;
}

export function useBadges(walletAddress?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all available badges
  const { data: allBadges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/badges'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/badges');
      if (!res.ok) throw new Error('Failed to fetch badges');
      return await res.json() as Badge[];
    },
  });

  // Get user's earned badges
  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery({
    queryKey: ['/api/badges/user', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await apiRequest('GET', `/api/badges/user/${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch user badges');
      const data = await res.json();
      return data.map((badge: any) => ({
        ...badge,
        earnedAt: new Date(badge.earnedAt)
      })) as UserBadge[];
    },
    enabled: !!walletAddress,
  });

  // Get user's badge progress
  const { data: badgeProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['/api/badges/progress', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await apiRequest('GET', `/api/badges/progress/${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch badge progress');
      return await res.json() as BadgeProgress[];
    },
    enabled: !!walletAddress,
  });

  // Get badge leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/badges/leaderboard'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/badges/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch badge leaderboard');
      return await res.json();
    },
  });

  // Claim badge reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (data: { badgeId: string; userAddress: string }) => {
      const res = await apiRequest('POST', `/api/badges/${data.badgeId}/claim`, {
        address: data.userAddress
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to claim badge reward');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Badge Reward Claimed",
        description: `You've earned ${data.reward} for completing this badge!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/badges/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim reward",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getBadgeProgress = (badgeId: string): BadgeProgress | undefined => {
    return badgeProgress.find(p => p.badgeId === badgeId);
  };

  const hasBadge = (badgeId: string): boolean => {
    return userBadges.some(badge => badge.badgeId === badgeId && badge.isCompleted);
  };

  const getBadgesByCategory = (category: string): Badge[] => {
    return allBadges.filter(badge => badge.category === category);
  };

  const getBadgesByRarity = (rarity: string): Badge[] => {
    return allBadges.filter(badge => badge.rarity === rarity);
  };

  const getCompletedBadges = (): UserBadge[] => {
    return userBadges.filter(badge => badge.isCompleted);
  };

  const getInProgressBadges = (): UserBadge[] => {
    return userBadges.filter(badge => !badge.isCompleted && badge.progress > 0);
  };

  const getUserRank = (): number => {
    if (!walletAddress) return 0;
    const userIndex = leaderboard.findIndex((entry: any) => entry.address === walletAddress);
    return userIndex >= 0 ? userIndex + 1 : 0;
  };

  const getTotalBadgeValue = (): string => {
    return getCompletedBadges()
      .reduce((total, badge) => {
        const pvxAmount = badge.badge.rewards.pvxAmount || '0';
        return total + parseFloat(pvxAmount);
      }, 0)
      .toFixed(6);
  };

  const getNextBadgeToEarn = (): Badge | undefined => {
    const inProgress = getInProgressBadges();
    if (inProgress.length === 0) return undefined;
    
    // Return the badge with highest progress
    const sorted = inProgress.sort((a, b) => b.progress - a.progress);
    return sorted[0]?.badge;
  };

  return {
    // Data
    allBadges,
    userBadges,
    badgeProgress,
    leaderboard,
    
    // Loading states
    isLoading: badgesLoading || userBadgesLoading || progressLoading || leaderboardLoading,
    
    // Mutations
    claimReward: claimRewardMutation.mutate,
    
    // Mutation states
    isClaiming: claimRewardMutation.isPending,
    
    // Helper functions
    getBadgeProgress,
    hasBadge,
    getBadgesByCategory,
    getBadgesByRarity,
    getCompletedBadges,
    getInProgressBadges,
    getUserRank,
    getTotalBadgeValue,
    getNextBadgeToEarn,
  };
}