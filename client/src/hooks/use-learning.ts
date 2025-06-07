import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'advanced' | 'trading' | 'security' | 'governance';
  difficulty: 'beginner' | 'intermediate' | 'expert';
  duration: number; // in minutes
  rewards: {
    pvxAmount: string;
    badgeId?: string;
    stakingBonus?: number;
  };
  isActive: boolean;
  prerequisites: string[];
  content: {
    sections: {
      title: string;
      content: string;
      type: 'text' | 'video' | 'interactive';
    }[];
    quiz: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];
  };
}

export interface UserProgress {
  moduleId: string;
  userId: string;
  progress: number; // 0-100
  currentSection: number;
  isCompleted: boolean;
  score: number;
  completedAt?: Date;
  timeSpent: number; // in minutes
}

export interface LearningStats {
  totalModules: number;
  completedModules: number;
  totalTimeSpent: number;
  averageScore: number;
  totalRewardsEarned: string;
  currentStreak: number;
  longestStreak: number;
}

export function useLearning(walletAddress?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all learning modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['/api/learning/modules'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/learning/modules');
      if (!res.ok) throw new Error('Failed to fetch learning modules');
      return await res.json() as LearningModule[];
    },
  });

  // Get user's learning progress
  const { data: userProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['/api/learning/progress', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const res = await apiRequest('GET', `/api/learning/progress/${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch learning progress');
      const data = await res.json();
      return data.map((progress: any) => ({
        ...progress,
        completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined
      })) as UserProgress[];
    },
    enabled: !!walletAddress,
  });

  // Get learning statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/learning/stats', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      const res = await apiRequest('GET', `/api/learning/stats/${walletAddress}`);
      if (!res.ok) throw new Error('Failed to fetch learning stats');
      return await res.json() as LearningStats;
    },
    enabled: !!walletAddress,
  });

  // Get leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/learning/leaderboard'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/learning/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch learning leaderboard');
      return await res.json();
    },
  });

  // Start module mutation
  const startModuleMutation = useMutation({
    mutationFn: async (data: { moduleId: string; userId: string }) => {
      const res = await apiRequest('POST', `/api/learning/modules/${data.moduleId}/start`, {
        userId: data.userId
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start module');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { 
      moduleId: string; 
      userId: string; 
      progress: number;
      currentSection: number;
      timeSpent: number;
    }) => {
      const res = await apiRequest('PUT', `/api/learning/modules/${data.moduleId}/progress`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete module mutation
  const completeModuleMutation = useMutation({
    mutationFn: async (data: { 
      moduleId: string; 
      userId: string; 
      score: number;
      timeSpent: number;
    }) => {
      const res = await apiRequest('POST', `/api/learning/modules/${data.moduleId}/complete`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to complete module');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Module Completed!",
        description: `You've earned ${data.rewards.pvxAmount} PVX tokens!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getModuleProgress = (moduleId: string): UserProgress | undefined => {
    return userProgress.find(p => p.moduleId === moduleId);
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    const progress = getModuleProgress(moduleId);
    return progress?.isCompleted || false;
  };

  const canStartModule = (module: LearningModule): boolean => {
    if (module.prerequisites.length === 0) return true;
    return module.prerequisites.every(prereqId => isModuleCompleted(prereqId));
  };

  const getModulesByCategory = (category: string): LearningModule[] => {
    return modules.filter(module => module.category === category);
  };

  const getModulesByDifficulty = (difficulty: string): LearningModule[] => {
    return modules.filter(module => module.difficulty === difficulty);
  };

  const getCompletedModules = (): LearningModule[] => {
    return modules.filter(module => isModuleCompleted(module.id));
  };

  const getAvailableModules = (): LearningModule[] => {
    return modules.filter(module => 
      !isModuleCompleted(module.id) && canStartModule(module)
    );
  };

  const getNextRecommendedModule = (): LearningModule | undefined => {
    const available = getAvailableModules();
    if (available.length === 0) return undefined;
    
    // Sort by difficulty (beginner first) then by prerequisites count
    return available.sort((a, b) => {
      const difficultyOrder = { beginner: 0, intermediate: 1, expert: 2 };
      const aDiff = difficultyOrder[a.difficulty];
      const bDiff = difficultyOrder[b.difficulty];
      
      if (aDiff !== bDiff) return aDiff - bDiff;
      return a.prerequisites.length - b.prerequisites.length;
    })[0];
  };

  const getTotalRewardsEarned = (): string => {
    return getCompletedModules()
      .reduce((total, module) => total + parseFloat(module.rewards.pvxAmount), 0)
      .toFixed(6);
  };

  const getOverallProgress = (): number => {
    if (modules.length === 0) return 0;
    const completed = getCompletedModules().length;
    return Math.round((completed / modules.length) * 100);
  };

  return {
    // Data
    modules,
    userProgress,
    stats,
    leaderboard,
    
    // Loading states
    isLoading: modulesLoading || progressLoading || statsLoading || leaderboardLoading,
    
    // Mutations
    startModule: startModuleMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    completeModule: completeModuleMutation.mutate,
    
    // Mutation states
    isStarting: startModuleMutation.isPending,
    isUpdating: updateProgressMutation.isPending,
    isCompleting: completeModuleMutation.isPending,
    
    // Helper functions
    getModuleProgress,
    isModuleCompleted,
    canStartModule,
    getModulesByCategory,
    getModulesByDifficulty,
    getCompletedModules,
    getAvailableModules,
    getNextRecommendedModule,
    getTotalRewardsEarned,
    getOverallProgress,
  };
}