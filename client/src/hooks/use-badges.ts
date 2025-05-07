import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, BadgeType, UserBadge } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useBadges() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all visible badges
  const getAllBadges = () => 
    useQuery<Badge[]>({
      queryKey: ['/api/badge'],
      staleTime: 60000 * 5, // 5 minutes
    });

  // Get badges by type
  const getBadgesByType = (type: BadgeType) =>
    useQuery<Badge[]>({
      queryKey: ['/api/badge/type', type],
      staleTime: 60000 * 5, // 5 minutes
    });

  // Get a single badge by ID
  const getBadgeById = (id: string) =>
    useQuery<Badge>({
      queryKey: ['/api/badge', id],
      enabled: !!id,
      staleTime: 60000 * 5, // 5 minutes
    });

  // Get badges for a user
  const getUserBadges = (userId: string) =>
    useQuery<(UserBadge & { badge: Badge })[]>({
      queryKey: ['/api/badge/user', userId],
      enabled: !!userId,
      staleTime: 60000 * 5, // 5 minutes
    });

  // Update badge progress
  const { mutate: updateBadgeProgress } = useMutation({
    mutationFn: async ({ 
      userId, 
      badgeId, 
      progress 
    }: { 
      userId: string; 
      badgeId: string;

      progress: number;
    }) => {
      const res = await apiRequest('POST', '/api/badge/progress', {
        userId,
        badgeId,
        progress
      });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate badge queries
      queryClient.invalidateQueries({ queryKey: ['/api/badge/user', variables.userId] });
      
      if (data.progress >= 100) {
        toast({
          title: 'Achievement Unlocked!',
          description: `You've earned the ${data.badge.name} badge!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update badge progress: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  return {
    getAllBadges,
    getBadgesByType,
    getBadgeById,
    getUserBadges,
    updateBadgeProgress,
    isLoading: false // Default value for UI states
  };
}