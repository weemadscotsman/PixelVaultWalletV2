import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WebWorkerMiner, getMiningStats, getMiningRewards } from "@/lib/mining";
import { getHalvingProgress, getRewardDistribution, getCurrentBlockReward } from "@/lib/blockchain";
import { MiningReward, MiningStats } from "@/types/blockchain";
import { useWallet } from "./use-wallet";
import { useToast } from "./use-toast";

export type HardwareType = 'cpu' | 'gpu' | 'asic';

export function useMining() {
  const { wallet, refreshBalance } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [hashRate, setHashRate] = useState(0);
  const [blocksMined, setBlocksMined] = useState(0);
  const [threads, setThreads] = useState(2);
  const [hardwareType, setHardwareType] = useState<HardwareType>('cpu');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [blockReward, setBlockReward] = useState<number>(150);
  const [halvingProgress, setHalvingProgress] = useState<{current: number, total: number} | null>(null);
  const [nextHalvingEstimate, setNextHalvingEstimate] = useState<string>("");
  const [rewardDistribution, setRewardDistribution] = useState<{
    miner: number;
    governance: number;
    staking: number;
    reserve: number;
  } | null>(null);
  const [miningRewards, setMiningRewards] = useState<MiningReward[]>([]);
  const [miningStats, setMiningStats] = useState<MiningStats | null>(null);

  // Reference to the miner instance
  const minerRef = useRef<WebWorkerMiner | null>(null);

  // Fetch current block reward
  const blockRewardQuery = useQuery({
    queryKey: ['/api/mining/block-reward'],
    staleTime: 60000,
  });
  
  // Update state when block reward data changes
  useEffect(() => {
    if (blockRewardQuery.data && typeof blockRewardQuery.data === 'object' && blockRewardQuery.data !== null) {
      const data = blockRewardQuery.data as { reward: number };
      if ('reward' in data && typeof data.reward === 'number') {
        setBlockReward(data.reward);
      }
    }
    if (blockRewardQuery.error) {
      console.error("Error fetching block reward:", blockRewardQuery.error);
    }
  }, [blockRewardQuery.data, blockRewardQuery.error]);

  // Fetch halving progress
  const halvingProgressQuery = useQuery({
    queryKey: ['/api/mining/halving-progress'],
    staleTime: 60000,
  });
  
  // Update state when halving progress data changes
  useEffect(() => {
    if (halvingProgressQuery.data && typeof halvingProgressQuery.data === 'object' && halvingProgressQuery.data !== null) {
      const data = halvingProgressQuery.data as { current: number; total: number; nextEstimate: string };
      
      if ('current' in data && 'total' in data && 
          typeof data.current === 'number' && typeof data.total === 'number') {
        setHalvingProgress({
          current: data.current,
          total: data.total
        });
      }
      
      if ('nextEstimate' in data && typeof data.nextEstimate === 'string') {
        setNextHalvingEstimate(data.nextEstimate);
      }
    }
    if (halvingProgressQuery.error) {
      console.error("Error fetching halving progress:", halvingProgressQuery.error);
    }
  }, [halvingProgressQuery.data, halvingProgressQuery.error]);

  // Fetch reward distribution
  const rewardDistributionQuery = useQuery({
    queryKey: ['/api/mining/reward-distribution'],
    staleTime: 60000,
  });
  
  // Update state when reward distribution data changes
  useEffect(() => {
    if (rewardDistributionQuery.data && typeof rewardDistributionQuery.data === 'object' && rewardDistributionQuery.data !== null) {
      const data = rewardDistributionQuery.data as {
        miner: number;
        governance: number;
        staking: number;
        reserve: number;
      };
      setRewardDistribution(data);
    }
    if (rewardDistributionQuery.error) {
      console.error("Error fetching reward distribution:", rewardDistributionQuery.error);
    }
  }, [rewardDistributionQuery.data, rewardDistributionQuery.error]);

  // Fetch mining stats when wallet is available
  const miningStatsQuery = useQuery({
    queryKey: [`/api/mining/stats?address=${wallet?.publicAddress || ''}`],
    enabled: !!wallet,
    staleTime: 30000,
  });
  
  // Update state when mining stats data changes
  useEffect(() => {
    if (miningStatsQuery.data) {
      const data = miningStatsQuery.data as MiningStats;
      setMiningStats(data);
      setBlocksMined(data.blocksMined);
      if (data.isCurrentlyMining && !isMining) {
        setIsMining(true);
        setHashRate(data.currentHashRate || 0);
      }
    }
    if (miningStatsQuery.error) {
      console.error("Error fetching mining stats:", miningStatsQuery.error);
    }
  }, [miningStatsQuery.data, miningStatsQuery.error, isMining]);

  // Fetch mining rewards when wallet is available
  const miningRewardsQuery = useQuery({
    queryKey: [`/api/mining/rewards?address=${wallet?.publicAddress || ''}`],
    enabled: !!wallet,
    staleTime: 30000,
  });
  
  // Update state when mining rewards data changes
  useEffect(() => {
    if (miningRewardsQuery.data) {
      setMiningRewards(miningRewardsQuery.data as MiningReward[]);
    }
    if (miningRewardsQuery.error) {
      console.error("Error fetching mining rewards:", miningRewardsQuery.error);
    }
  }, [miningRewardsQuery.data, miningRewardsQuery.error]);

  // Start mining mutation
  const { mutate: startMiningMutation } = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error("No wallet available");
      
      // Make API call to the blockchain service with hardware type
      const res = await fetch('/api/blockchain/mining/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: wallet.publicAddress,
          hardwareType: hardwareType
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start mining');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mining/stats?address=${wallet?.publicAddress || ''}`] });
    },
    onError: (error) => {
      console.error("Error starting mining:", error);
      toast({
        title: "Mining Start Failed",
        description: error instanceof Error ? error.message : "Failed to start mining",
        variant: "destructive",
      });
      setIsMining(false);
      setHashRate(0);
      setIsStarting(false);
    }
  });

  // Stop mining mutation
  const { mutate: stopMiningMutation } = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error("No wallet available");
      
      // Make API call to the blockchain service to stop mining
      const res = await fetch('/api/blockchain/mining/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: wallet.publicAddress
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to stop mining');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mining/stats?address=${wallet?.publicAddress || ''}`] });
      refreshBalance();
    },
    onError: (error) => {
      console.error("Error stopping mining:", error);
      toast({
        title: "Mining Stop Failed",
        description: error instanceof Error ? error.message : "Failed to stop mining",
        variant: "destructive",
      });
      setIsStopping(false);
    }
  });

  // Start mining function
  const startMining = useCallback(() => {
    if (!wallet || isMining || isStarting) return;

    try {
      setIsStarting(true);

      // Create a new miner instance if needed
      if (!minerRef.current) {
        minerRef.current = new WebWorkerMiner(
          wallet.publicAddress,
          (rate) => setHashRate(rate),
          (blockHeight, reward) => {
            setBlocksMined((prev) => prev + 1);
            
            // Add new reward
            const newReward: MiningReward = {
              id: `${Date.now()}`,
              blockHeight,
              amount: reward,
              timestamp: new Date(),
              address: wallet.publicAddress
            };
            
            setMiningRewards((prev) => [newReward, ...prev]);
            
            // Update wallet balance
            refreshBalance();
            
            // Show notification
            toast({
              title: "Block Found!",
              description: `You mined block #${blockHeight} and earned ${reward} PVX`,
            });
          }
        );
      }

      // Apply hardware-specific settings
      let effectiveThreads = threads;
      let speedMultiplier = 1;
      
      switch(hardwareType) {
        case 'cpu':
          speedMultiplier = 1;
          break;
        case 'gpu':
          speedMultiplier = 15; // GPUs are ~15x faster than CPUs
          effectiveThreads = Math.min(threads * 4, 32); // GPUs can handle more parallel work
          break;
        case 'asic':
          speedMultiplier = 100; // ASICs are ~100x faster than CPUs
          effectiveThreads = Math.min(threads * 8, 64); // ASICs are highly parallel
          break;
      }

      // Start mining with selected threads and configured speed multiplier
      minerRef.current.start(effectiveThreads, speedMultiplier);
      
      // Report to server
      startMiningMutation();
      
      // Update state
      setIsMining(true);
      setIsStarting(false);
      
      toast({
        title: "Mining Started",
        description: `Mining started with ${hardwareType.toUpperCase()} (${threads} threads)`,
      });
    } catch (error) {
      console.error("Error starting mining:", error);
      toast({
        title: "Mining Start Failed",
        description: error instanceof Error ? error.message : "Failed to start mining",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  }, [wallet, isMining, isStarting, threads, hardwareType, startMiningMutation, refreshBalance, toast]);

  // Stop mining function
  const stopMining = useCallback(() => {
    if (!isMining || isStopping) return;

    try {
      setIsStopping(true);

      // Stop mining worker if it exists
      if (minerRef.current) {
        minerRef.current.stop();
      }
      
      // Report to server
      if (wallet) {
        stopMiningMutation();
      }
      
      // Update state
      setIsMining(false);
      setHashRate(0);
      setIsStopping(false);
      
      toast({
        title: "Mining Stopped",
        description: "Mining has been stopped",
      });
    } catch (error) {
      console.error("Error stopping mining:", error);
      toast({
        title: "Mining Stop Failed",
        description: error instanceof Error ? error.message : "Failed to stop mining",
        variant: "destructive",
      });
      setIsStopping(false);
    }
  }, [isMining, isStopping, wallet, stopMiningMutation, toast]);

  // Function to refresh all mining data
  const refreshAllMiningData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`/api/mining/stats?address=${wallet?.publicAddress || ''}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/mining/rewards?address=${wallet?.publicAddress || ''}`] });
    refreshBalance();
  }, [queryClient, wallet, refreshBalance]);

  // Refresh data periodically while mining
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (wallet && isMining) {
      interval = setInterval(() => {
        refreshAllMiningData();
      }, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [wallet, isMining, refreshAllMiningData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (minerRef.current) {
        minerRef.current.stop();
      }
    };
  }, []);

  return {
    isMining,
    hashRate,
    blocksMined,
    threads,
    setThreads,
    hardwareType,
    setHardwareType,
    startMining,
    stopMining,
    isStarting,
    isStopping,
    blockReward,
    halvingProgress,
    nextHalvingEstimate,
    rewardDistribution,
    miningRewards,
    miningStats,
  };
}
