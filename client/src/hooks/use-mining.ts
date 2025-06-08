import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { queryClient } from '@/lib/queryClient';

export type HardwareType = 'cpu' | 'gpu' | 'asic';

export interface MiningStats {
  address: string;
  hashRate: string;
  blocksFound: number;
  totalRewards: string;
  isActive: boolean;
  startedAt: Date;
  lastBlockTime: Date | null;
}

export interface MiningReward {
  id: string;
  amount: string;
  timestamp: Date;
  blockHeight: number;
  type: 'block_reward' | 'transaction_fee';
}

export function useMining() {
  const { wallet, refreshBalance } = useWallet();
  const { toast } = useToast();
  
  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [hashRate, setHashRate] = useState(0);
  const [blocksMined, setBlocksMined] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [threads, setThreads] = useState(2);
  const [hardwareType, setHardwareType] = useState<HardwareType>('cpu');
  
  // Additional mining data
  const [miningStats, setMiningStats] = useState<MiningStats | null>(null);
  const [miningRewards, setMiningRewards] = useState<MiningReward[]>([]);
  const [blockReward, setBlockReward] = useState('5000000000');
  const [halvingProgress, setHalvingProgress] = useState({ current: 0, total: 210000 });
  const [nextHalvingEstimate, setNextHalvingEstimate] = useState('');
  const [rewardDistribution, setRewardDistribution] = useState({
    miner: 60,
    governance: 15,
    staking: 15,
    reserve: 10
  });

  const minerRef = useRef<Worker | null>(null);

  // Fetch current block reward
  const blockRewardQuery = useQuery({
    queryKey: ['/api/mining/block-reward'],
    staleTime: 300000, // 5 minutes
  });
  
  useEffect(() => {
    if (blockRewardQuery.data && typeof blockRewardQuery.data === 'object' && blockRewardQuery.data !== null) {
      const data = blockRewardQuery.data as { reward: string };
      if ('reward' in data && typeof data.reward === 'string') {
        setBlockReward(data.reward);
      }
    }
  }, [blockRewardQuery.data]);

  // Fetch halving progress
  const halvingProgressQuery = useQuery({
    queryKey: ['/api/mining/halving-progress'],
    staleTime: 60000,
  });
  
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
  }, [halvingProgressQuery.data]);

  // Fetch reward distribution
  const rewardDistributionQuery = useQuery({
    queryKey: ['/api/mining/reward-distribution'],
    staleTime: 60000,
  });
  
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
  }, [rewardDistributionQuery.data]);

  // Fetch mining stats when wallet is available
  const miningStatsQuery = useQuery({
    queryKey: [`/api/blockchain/mining/stats/${wallet?.address || ''}`],
    enabled: !!wallet?.address,
    staleTime: 5000,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });
  
  // Update state when mining stats data changes
  useEffect(() => {
    if (miningStatsQuery.data) {
      const data = miningStatsQuery.data as any;
      console.log('Mining stats received:', data);
      
      // Set mining status based on backend response
      const isCurrentlyMining = data.status === 'active';
      setIsMining(isCurrentlyMining);
      
      // Parse hash rate from string format like "42.1 TH/s"
      if (data.hashRate && typeof data.hashRate === 'string') {
        const hashRateMatch = data.hashRate.match(/[\d.]+/);
        if (hashRateMatch) {
          setHashRate(parseFloat(hashRateMatch[0]));
        }
      }
      
      // Set blocks mined
      if (data.blocksMinedToday) {
        setBlocksMined(data.blocksMinedToday);
      }
      
      // Create mining stats object compatible with existing code
      const miningStatsData: MiningStats = {
        address: data.address || wallet?.address || '',
        hashRate: data.hashRate || '0 MH/s',
        blocksFound: data.totalBlocksMined || 0,
        totalRewards: data.totalRewards || '0',
        isActive: isCurrentlyMining,
        startedAt: new Date(),
        lastBlockTime: null
      };
      
      setMiningStats(miningStatsData);
    }
  }, [miningStatsQuery.data, wallet?.address]);

  // Fetch mining rewards when wallet is available
  const miningRewardsQuery = useQuery({
    queryKey: [`/api/mining/rewards?address=${wallet?.address || ''}`],
    enabled: !!wallet,
    staleTime: 30000,
  });
  
  useEffect(() => {
    if (miningRewardsQuery.data) {
      setMiningRewards(miningRewardsQuery.data as MiningReward[]);
    }
  }, [miningRewardsQuery.data]);

  // Start mining mutation
  const { mutate: startMiningMutation } = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error("No wallet available");
      
      const res = await fetch('/api/blockchain/mining/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: wallet.address,
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
      queryClient.invalidateQueries({ queryKey: [`/api/blockchain/mining/stats/${wallet?.address || ''}`] });
      refreshBalance();
      
      toast({
        title: "Mining Started",
        description: "Successfully started mining operations"
      });
      
      setIsMining(true);
      setHashRate(10);
      setIsStarting(false);
    },
    onError: (error) => {
      toast({
        title: "Mining Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsStarting(false);
    }
  });

  // Stop mining mutation
  const { mutate: stopMiningMutation } = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error("No wallet available");
      
      const res = await fetch('/api/blockchain/mining/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: wallet.address
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to stop mining');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blockchain/mining/stats/${wallet?.address || ''}`] });
      refreshBalance();
      
      toast({
        title: "Mining Stopped",
        description: "Successfully stopped mining operations"
      });
      
      setIsMining(false);
      setHashRate(0);
      setIsStopping(false);
    },
    onError: (error) => {
      toast({
        title: "Stop Mining Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsStopping(false);
    }
  });

  // Start mining function
  const startMining = () => {
    if (!wallet || isMining || isStarting) return;
    
    setIsStarting(true);
    
    // Cleanup any existing miner
    if (minerRef.current) {
      minerRef.current.terminate();
    }
    
    // Start mining process
    startMiningMutation();
  };

  // Stop mining function
  const stopMining = () => {
    if (!isMining || isStopping) return;
    
    setIsStopping(true);
    
    // Cleanup miner worker
    if (minerRef.current) {
      minerRef.current.terminate();
      minerRef.current = null;
    }
    
    // Stop mining process
    stopMiningMutation();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (minerRef.current) {
        minerRef.current.terminate();
      }
    };
  }, []);

  // Auto-refresh mining stats and balance when mining
  useEffect(() => {
    if (!wallet || !isMining) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/blockchain/mining/stats/${wallet.address}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/wallet/${wallet.address}`] });
      refreshBalance();
      queryClient.invalidateQueries({ queryKey: [`/api/mining/rewards?address=${wallet.address}`] });
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [wallet, isMining, refreshBalance]);

  return {
    // Mining state
    isMining,
    hashRate,
    blocksMined,
    isStarting,
    isStopping,
    threads,
    setThreads,
    hardwareType,
    setHardwareType,
    
    // Actions
    startMining,
    stopMining,
    
    // Data
    miningStats,
    miningRewards,
    blockReward,
    halvingProgress,
    nextHalvingEstimate,
    rewardDistribution,
    
    // Query states
    isLoading: miningStatsQuery.isLoading,
    error: miningStatsQuery.error
  };
}