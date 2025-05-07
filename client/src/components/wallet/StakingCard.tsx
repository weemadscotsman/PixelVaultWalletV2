import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  CoinsIcon, 
  Shuffle, 
  Clock, 
  TrendingUp, 
  Plus, 
  Loader2,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateStakeDialog } from "@/components/wallet/CreateStakeDialog";
import { formatCryptoAmount, formatTimeAgo } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface StakingPool {
  id: string;
  name: string;
  description: string;
  minAmount: string;
  lockPeriod: number; // in days
  apy: number;
  totalStaked: string;
  active: boolean;
}

interface StakeRecord {
  id: string;
  walletAddress: string;
  poolId: string;
  amount: string;
  startTime: string;
  endTime: string;
  rewards: string;
  status: "active" | "completed" | "pending";
}

export function StakingCard() {
  const { activeWallet } = useWallet();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch staking pools
  const { 
    data: stakingPools, 
    isLoading: isLoadingPools,
    error: poolsError 
  } = useQuery({
    queryKey: ['/api/blockchain/staking/pools'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/blockchain/staking/pools');
        if (!res.ok) {
          throw new Error('Failed to fetch staking pools');
        }
        return await res.json() as StakingPool[];
      } catch (error) {
        console.error('Error fetching staking pools:', error);
        throw error;
      }
    },
  });
  
  // Fetch active stakes for current wallet
  const {
    data: activeStakes,
    isLoading: isLoadingStakes,
    error: stakesError
  } = useQuery({
    queryKey: ['/api/blockchain/staking/stakes', activeWallet],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/blockchain/staking/stakes/${activeWallet}`);
        if (!res.ok) {
          throw new Error('Failed to fetch active stakes');
        }
        return await res.json() as StakeRecord[];
      } catch (error) {
        console.error('Error fetching active stakes:', error);
        throw error;
      }
    },
    enabled: !!activeWallet,
  });
  
  // Calculate total staked amount
  const totalStaked = activeStakes?.reduce((sum, stake) => {
    return sum + parseFloat(stake.amount);
  }, 0) || 0;
  
  // Calculate projected rewards (simplified calculation)
  const projectedRewards = activeStakes?.reduce((sum, stake) => {
    const pool = stakingPools?.find(p => p.id === stake.poolId);
    if (!pool) return sum;
    
    const stakeAmount = parseFloat(stake.amount);
    const dailyRate = pool.apy / 365 / 100; // Convert annual rate to daily
    const startDate = new Date(stake.startTime);
    const endDate = new Date(stake.endTime);
    const daysStaked = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Daily compound interest calculation
    const projectedAmount = stakeAmount * Math.pow(1 + dailyRate, daysStaked);
    const reward = projectedAmount - stakeAmount;
    
    return sum + reward;
  }, 0) || 0;

  if (!activeWallet) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            PVX Staking
          </CardTitle>
          <CardDescription className="text-gray-400">
            Stake your PVX tokens to earn passive rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="text-center py-10">
            <p className="text-gray-400 mb-4">Connect or create a wallet first to start staking</p>
            <Button
              variant="outline"
              className="border-blue-900/50 text-blue-300"
              onClick={() => window.location.href = '/wallet'}
            >
              Go to Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoadingPools || isLoadingStakes) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            PVX Staking
          </CardTitle>
          <CardDescription className="text-gray-400">
            Stake your PVX tokens to earn passive rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }
  
  if (poolsError || stakesError) {
    return (
      <Card className="bg-black/70 border-blue-900/50">
        <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            PVX Staking
          </CardTitle>
          <CardDescription className="text-gray-400">
            Stake your PVX tokens to earn passive rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <p className="text-red-400">Error loading staking data</p>
            <p className="text-gray-400 text-sm mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-black/70 border-blue-900/50">
      <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <CoinsIcon className="h-5 w-5" />
              PVX Staking
            </CardTitle>
            <CardDescription className="text-gray-400">
              Stake your PVX tokens to earn passive rewards
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-700 hover:bg-blue-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Stake
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Staking Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4">
            <p className="text-sm text-gray-400 mb-1">Total Staked</p>
            <p className="text-xl font-bold text-blue-300">{formatCryptoAmount(totalStaked)}</p>
          </div>
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4">
            <p className="text-sm text-gray-400 mb-1">Active Stakes</p>
            <p className="text-xl font-bold text-blue-300">{activeStakes?.length || 0}</p>
          </div>
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4">
            <p className="text-sm text-gray-400 mb-1">Est. Rewards</p>
            <p className="text-xl font-bold text-green-400">+{formatCryptoAmount(projectedRewards)}</p>
          </div>
          <div className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4">
            <p className="text-sm text-gray-400 mb-1">Available Pools</p>
            <p className="text-xl font-bold text-blue-300">{stakingPools?.filter(p => p.active).length || 0}</p>
          </div>
        </div>
        
        {/* Active Stakes */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-medium text-blue-300 mb-3">Your Active Stakes</h3>
          
          {activeStakes && activeStakes.length > 0 ? (
            <div className="space-y-3">
              {activeStakes.map((stake) => {
                const pool = stakingPools?.find(p => p.id === stake.poolId);
                return (
                  <div key={stake.id} className="bg-gray-900/30 border border-blue-900/20 rounded-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-blue-300">{pool?.name || 'Staking Pool'}</h4>
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-900/50 mt-1">
                          {stake.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-300">{formatCryptoAmount(stake.amount)}</p>
                        <p className="text-xs text-gray-400">
                          <TrendingUp className="h-3 w-3 inline-block mr-1" />
                          APY: {pool?.apy || 0}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Started</p>
                        <p className="text-gray-300 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(new Date(stake.startTime))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Ends</p>
                        <p className="text-gray-300 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(new Date(stake.endTime))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Current Rewards</p>
                        <p className="text-green-400">{formatCryptoAmount(stake.rewards)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Pool</p>
                        <p className="text-gray-300">{pool?.name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-900/30 border border-blue-900/20 rounded-md p-6 text-center">
              <p className="text-gray-400">You don't have any active stakes</p>
              <Button 
                variant="outline" 
                className="mt-3 border-blue-900/50 text-blue-300"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Stake
              </Button>
            </div>
          )}
        </div>
        
        {/* Available Staking Pools */}
        <div>
          <h3 className="text-lg font-medium text-blue-300 mb-3">Available Staking Pools</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stakingPools?.filter(pool => pool.active).map((pool) => (
              <div key={pool.id} className="bg-gray-900/30 border border-blue-900/20 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-blue-300">{pool.name}</h4>
                  <Badge className="bg-blue-700 hover:bg-blue-600">
                    {pool.apy}% APY
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{pool.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-400">Min. Stake</p>
                    <p className="text-gray-300">{formatCryptoAmount(pool.minAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Lock Period</p>
                    <p className="text-gray-300">{pool.lockPeriod} days</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Staked</p>
                    <p className="text-gray-300">{formatCryptoAmount(pool.totalStaked)}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                    // You could set a selected pool state here if you want to pre-select this pool
                  }}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Stake in This Pool
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      {/* Create Stake Dialog */}
      <CreateStakeDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        stakingPools={stakingPools?.filter(pool => pool.active) || []}
      />
    </Card>
  );
}