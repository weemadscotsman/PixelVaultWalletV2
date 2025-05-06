import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WebWorkerMiner, getMiningStats, getMiningRewards } from "@/lib/mining";
import { getHalvingProgress, getRewardDistribution, getCurrentBlockReward } from "@/lib/blockchain";
import { MiningReward, MiningStats } from "@/types/blockchain";
import { useWallet } from "./use-wallet";
import { useToast } from "./use-toast";

export function useMining() {
  const { wallet, refreshBalance } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [hashRate, setHashRate] = useState(0);
  const [blocksMined, setBlocksMined] = useState(0);
  const [threads, setThreads] = useState(2);
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

  // Reference to the miner instance
  const minerRef = useRef<WebWorkerMiner | null>(null);

  // Fetch current block reward
  useQuery({
    queryKey: ['/api/mining/block-reward'],
    onSuccess: (data) => {
      setBlockReward(data.reward);
    },
    onError: (error) => {
      console.error("Error fetching block reward:", error);
    }
  });

  // Fetch halving progress
  useQuery({
    queryKey: ['/api/mining/halving-progress'],
    onSuccess: (data) => {
      setHalvingProgress({
        current: data.current,
        total: data.total
      });
      setNextHalvingEstimate(data.nextEstimate);
    },
    onError: (error) => {
      console.error("Error fetching halving progress:", error);
    }
  });

  // Fetch reward distribution
  useQuery({
    queryKey: ['/api/mining/reward-distribution'],
    onSuccess: (data) => {
      setRewardDistribution(data);
    },
    onError: (error) => {
      console.error("Error fetching reward distribution:", error);
    }
  });

  // Fetch mining stats when wallet is available
  const { refetch: refreshMiningStats } = useQuery({
    queryKey: [`/api/mining/stats?address=${wallet?.publicAddress || ''}`],
    enabled: !!wallet,
    onSuccess: (data: MiningStats) => {
      if (data) {
        setBlocksMined(data.blocksMined);
        if (data.isCurrentlyMining && !isMining) {
          setIsMining(true);
          setHashRate(data.currentHashRate || 0);
        }
      }
    },
    onError: (error) => {
      console.error("Error fetching mining stats:", error);
    }
  });

  // Fetch mining rewards when wallet is available
  const { refetch: refreshMiningRewards } = useQuery({
    queryKey: [`/api/mining/rewards?address=${wallet?.publicAddress || ''}`],
    enabled: !!wallet,
    onSuccess: (data: MiningReward[]) => {
      if (data) {
        setMiningRewards(data);
      }
    },
    onError: (error) => {
      console.error("Error fetching mining rewards:", error);
    }
  });

  // Start mining mutation
  const { mutate: startMiningMutation } = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error("No wallet available");
      return { success: true };
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
      return { success: true };
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

      // Start mining with selected threads
      minerRef.current.start(threads);
      
      // Report to server
      startMiningMutation();
      
      // Update state
      setIsMining(true);
      setIsStarting(false);
      
      toast({
        title: "Mining Started",
        description: `Mining started with ${threads} threads`,
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
  }, [wallet, isMining, isStarting, threads, startMiningMutation, refreshBalance, toast]);

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

  // Refresh data periodically while mining
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (wallet && isMining) {
      interval = setInterval(() => {
        refreshMiningStats();
        refreshMiningRewards();
        refreshBalance();
      }, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [wallet, isMining, refreshMiningStats, refreshMiningRewards, refreshBalance]);

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
    startMining,
    stopMining,
    isStarting,
    isStopping,
    blockReward,
    halvingProgress,
    nextHalvingEstimate,
    rewardDistribution,
    miningRewards,
  };
}
