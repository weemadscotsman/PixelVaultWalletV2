import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  CoinsIcon, 
  Shuffle, 
  Clock, 
  TrendingUp, 
  Plus, 
  Loader2,
  Award,
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
import { ClaimRewardDialog } from "@/components/wallet/ClaimRewardDialog";
import { formatCryptoAmount, formatTimeAgo } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface StakingPool {
  id: string;
  name: string;
  description?: string; // Optional since it may not be present in API response
  minStake: string; // Backend uses minStake, not minAmount
  lockupPeriod: number; // Backend uses lockupPeriod, not lockPeriod
  apy: string; // Backend returns as string
  totalStaked: string;
  active?: boolean; // Optional since it may not be present in API response
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
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedStake, setSelectedStake] = useState<any>(null);
  
  // Fetch staking pools
  const { 
    data: stakingPools, 
    isLoading: isLoadingPools,
    error: poolsError 
  } = useQuery({
    queryKey: ['/api/stake/pools'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/stake/pools');
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
  
  // Fetch active stakes for current wallet - using the exact endpoint from blueprint
  const {
    data: activeStakes,
    isLoading: isLoadingStakes,
    error: stakesError
  } = useQuery({
    queryKey: ['/api/stake/status', activeWallet],
    queryFn: async () => {
      try {
        if (!activeWallet) return [];
        
        const res = await apiRequest('GET', `/api/stake/status/${activeWallet}`);
        if (!res.ok) {
          throw new Error('Failed to fetch active stakes');
        }
        
        const stakeData = await res.json();
        // Convert the response format to match our component expectations
        return stakeData.stakes || [];
      } catch (error) {
        console.error('Error fetching active stakes:', error);
        throw error;
      }
    },
    enabled: !!activeWallet,
  });
  
  // Calculate total staked amount
  const totalStaked = Array.isArray(activeStakes) ? activeStakes.reduce((sum: number, stake: any) => {
    return sum + parseFloat(stake.amount);
  }, 0) : 0;
  
  // Calculate projected rewards (simplified calculation)
  const projectedRewards = Array.isArray(activeStakes) ? activeStakes.reduce((sum: number, stake: any) => {
    const pool = stakingPools?.find(p => p.id === stake.poolId);
    if (!pool) return sum;
    
    const stakeAmount = parseFloat(stake.amount);
    const dailyRate = parseFloat(pool.apy) / 365 / 100; // Convert annual rate to daily
    
    // For calculating duration, use unlockTime if available, otherwise estimate 30 days
    const startDate = new Date(stake.startTime);
    const endDate = stake.unlockTime ? new Date(stake.unlockTime) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
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
          <div key="total-staked" className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4 flex flex-col h-full justify-between">
            <p className="text-sm text-gray-400">Total Staked</p>
            <p className="text-xl font-bold text-blue-300 mt-2">{formatCryptoAmount(totalStaked)}</p>
          </div>
          <div key="active-stakes" className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4 flex flex-col h-full justify-between">
            <p className="text-sm text-gray-400">Active Stakes</p>
            <p className="text-xl font-bold text-blue-300 mt-2">{activeStakes?.length || 0}</p>
          </div>
          <div key="est-rewards" className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4 flex flex-col h-full justify-between">
            <p className="text-sm text-gray-400">Est. Rewards</p>
            <p className="text-xl font-bold text-green-400 mt-2">+{formatCryptoAmount(projectedRewards)}</p>
          </div>
          <div key="available-pools" className="bg-blue-900/10 border border-blue-900/30 rounded-md p-4 flex flex-col h-full justify-between">
            <p className="text-sm text-gray-400">Available Pools</p>
            <p className="text-xl font-bold text-blue-300 mt-2">{stakingPools?.filter(p => p.active !== false).length || 0}</p>
          </div>
        </div>
        
        {/* Active Stakes */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-medium text-blue-300 mb-3">Your Active Stakes</h3>
          
          {activeStakes && activeStakes.length > 0 ? (
            <div className="space-y-3">
              {activeStakes.map((stake: any) => {
                const pool = stakingPools?.find(p => p.id === stake.poolId);
                return (
                  <div key={stake.id} className="bg-gray-900/30 border border-blue-900/20 rounded-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-blue-300">{pool?.name || 'Staking Pool'}</h4>
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-900/50 mt-1">
                          {stake.status ? stake.status.toUpperCase() : 'ACTIVE'}
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div key={`${stake.id}-start`} className="bg-gray-900/40 p-2 rounded">
                        <p className="text-gray-400 mb-1">Started</p>
                        <p className="text-gray-300 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {stake.startTime ? formatTimeAgo(new Date(stake.startTime)) : 'Just now'}
                        </p>
                      </div>
                      <div key={`${stake.id}-end`} className="bg-gray-900/40 p-2 rounded">
                        <p className="text-gray-400 mb-1">Ends</p>
                        <p className="text-gray-300 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {stake.endTime ? formatTimeAgo(new Date(stake.endTime)) : 'In progress'}
                        </p>
                      </div>
                      <div key={`${stake.id}-rewards`} className="bg-gray-900/40 p-2 rounded">
                        <p className="text-gray-400 mb-1">Current Rewards</p>
                        <p className="text-green-400">{formatCryptoAmount(stake.rewards || '0')}</p>
                      </div>
                      <div key={`${stake.id}-pool`} className="bg-gray-900/40 p-2 rounded">
                        <p className="text-gray-400 mb-1">Pool</p>
                        <p className="text-gray-300">{pool?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    {parseFloat(stake.rewards || '0') > 0 && (
                      <div className="mt-3 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-green-900/50 text-green-400 hover:bg-green-900/10"
                          onClick={() => {
                            setSelectedStake({
                              id: stake.id,
                              amount: stake.amount,
                              poolName: pool?.name || 'Staking Pool',
                              rewards: stake.rewards || '0'
                            });
                            setIsClaimDialogOpen(true);
                          }}
                        >
                          <Award className="mr-2 h-4 w-4" />
                          Claim Rewards
                        </Button>
                      </div>
                    )}
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
            {stakingPools?.filter(pool => pool.active !== false).map((pool) => (
              <div key={pool.id} className="bg-gray-900/30 border border-blue-900/20 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-blue-300">{pool.name}</h4>
                  <Badge className="bg-blue-700 hover:bg-blue-600">
                    {pool.apy}% APY
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">{pool.description}</p>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div key={`${pool.id}-min-stake`} className="bg-gray-900/40 p-2 rounded">
                    <p className="text-gray-400 mb-1">Min. Stake</p>
                    <p className="text-gray-300">{formatCryptoAmount(pool.minStake)}</p>
                  </div>
                  <div key={`${pool.id}-lock-period`} className="bg-gray-900/40 p-2 rounded">
                    <p className="text-gray-400 mb-1">Lock Period</p>
                    <p className="text-gray-300">{pool.lockupPeriod} days</p>
                  </div>
                  <div key={`${pool.id}-total-staked`} className="bg-gray-900/40 p-2 rounded">
                    <p className="text-gray-400 mb-1">Total Staked</p>
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
        stakingPools={stakingPools?.filter(pool => pool.active !== false) || [] as any[]}
      />
      
      {/* Claim Reward Dialog */}
      {selectedStake && (
        <ClaimRewardDialog
          open={isClaimDialogOpen}
          onOpenChange={setIsClaimDialogOpen}
          stakeId={selectedStake.id}
          stakeAmount={selectedStake.amount}
          poolName={selectedStake.poolName}
          rewards={selectedStake.rewards}
        />
      )}
    </Card>
  );
}