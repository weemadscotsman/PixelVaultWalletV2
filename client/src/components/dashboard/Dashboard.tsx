import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Share2, 
  Award, 
  Heart, 
  Droplets, 
  GraduationCap,
  RefreshCw,
  Plus,
  ChevronRight,
  Activity,
  BarChart,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { TrendRadar } from '@/components/blockchain/TrendRadar';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { useStaking } from '@/hooks/use-staking';
import { useBlockchainMetrics } from '@/hooks/use-blockchain-metrics';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Transaction } from '@/types/blockchain';
import { shortenAddress } from '@/lib/utils';

// Default data to use while loading or when real data is unavailable
const defaultWalletData = {
  publicAddress: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
  balance: 432914.832651,
  transactions: [
    { id: 1, type: 'receive', amount: 5000, from: '0x3a...4b2c', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: 2, type: 'send', amount: 2500, to: '0x8d...9f3e', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { id: 3, type: 'receive', amount: 10000, from: '0x5e...2a1d', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
  ]
};

// Default blockchain data
const defaultBlockchainData = {
  currentHeight: 3421897,
  difficulty: 3.75,
  hashRate: '14.2 TH/s',
  lastBlockTime: new Date(Date.now() - 1000 * 15)
};

// Default staking data
const defaultStakingData = {
  totalStaked: 120000,
  activeStakes: 3,
  rewards: 3245.21,
  stakingPower: 85
};

// Default governance data
const defaultGovernanceData = {
  activeProposals: 2,
  votingPower: 8500,
  votingStatus: 'Open',
  nextVoteEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
};

// Default thringlets data
const defaultThringletData = {
  owned: 3,
  rarity: {
    common: 1,
    rare: 1,
    legendary: 1
  },
  emotions: {
    joyful: 2,
    curious: 1
  }
};

// Default drops data
const defaultDropsData = {
  available: 2,
  recentDrop: {
    id: 'pvx-matrix-001',
    name: 'Matrix Pill',
    rarity: 'Rare',
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 24)
  },
  upcomingDrop: {
    name: 'Quantum Key',
    rarity: 'Epic',
    releaseTime: new Date(Date.now() + 1000 * 60 * 60 * 48)
  }
};

// Default learning data
const defaultLearningData = {
  completedModules: 3,
  currentModule: 'Proof of Stake',
  progress: 68,
  earnedRewards: 1500
};

export function Dashboard() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use states for fallback data
  const [walletData, setWalletData] = useState(defaultWalletData);
  const [blockchainData, setBlockchainData] = useState(defaultBlockchainData);
  const [stakingPanelData, setStakingPanelData] = useState(defaultStakingData);
  const [governanceData, setGovernanceData] = useState(defaultGovernanceData);
  const [thringletData, setThringletData] = useState(defaultThringletData);
  const [dropsData, setDropsData] = useState(defaultDropsData);
  const [learningData, setLearningData] = useState(defaultLearningData);
  
  // Get active wallet from wallet hook
  const { activeWallet, wallet, getWallet } = useWallet();
  
  // Get blockchain metrics hook
  const blockchainMetrics = useBlockchainMetrics();
  
  // Get staking hook
  const stakingHook = useStaking();
  
  // Query for active wallet data
  const { data: walletDataApi, isLoading: isLoadingWallet } = getWallet();
  
  // Query for blockchain status
  const { data: blockchainStatusApi, isLoading: isLoadingBlockchain } = useQuery({
    queryKey: ['/api/blockchain/status'],
  });
  
  // Query for wallet transactions
  const { data: walletTransactionsApi, isLoading: isLoadingTransactions } = useTransactionHistory(activeWallet || undefined);
  
  // Query for staking data
  const { data: activeStakesApi, isLoading: isLoadingStakes } = useQuery({
    queryKey: ['/api/stake/status', activeWallet],
    enabled: !!activeWallet
  });
  
  // Query for staking pools
  const { data: stakingPoolsApi, isLoading: isLoadingPools } = useQuery({
    queryKey: ['/api/stake/pools'],
  });
  
  // Update wallet data from API
  useEffect(() => {
    if (walletDataApi && !isLoadingWallet) {
      setWalletData(prev => ({
        ...prev,
        publicAddress: walletDataApi.address,
        balance: parseFloat(walletDataApi.balance)
      }));
    }
  }, [walletDataApi, isLoadingWallet]);
  
  // Update transaction data from API
  useEffect(() => {
    if (walletTransactionsApi && !isLoadingTransactions) {
      const formattedTransactions = walletTransactionsApi.slice(0, 3).map((tx, index) => ({
        id: index + 1,
        type: tx.senderAddress === activeWallet ? 'send' : 'receive',
        amount: parseFloat(tx.amount),
        from: tx.senderAddress !== activeWallet ? tx.senderAddress : undefined,
        to: tx.receiverAddress !== activeWallet ? tx.receiverAddress : undefined,
        timestamp: new Date(tx.timestamp)
      }));
      
      setWalletData(prev => ({
        ...prev,
        transactions: formattedTransactions
      }));
    }
  }, [walletTransactionsApi, isLoadingTransactions, activeWallet]);
  
  // Update blockchain data from API
  useEffect(() => {
    if (blockchainStatusApi && !isLoadingBlockchain) {
      setBlockchainData(prev => ({
        ...prev,
        currentHeight: blockchainStatusApi.latestBlockHeight || prev.currentHeight,
        difficulty: blockchainStatusApi.difficulty || prev.difficulty, 
        hashRate: blockchainStatusApi.hashRate ? `${blockchainStatusApi.hashRate} H/s` : prev.hashRate,
        lastBlockTime: blockchainStatusApi.lastBlockTime ? new Date(blockchainStatusApi.lastBlockTime) : prev.lastBlockTime
      }));
    }
  }, [blockchainStatusApi, isLoadingBlockchain]);
  
  // Update staking data from API
  useEffect(() => {
    if (activeStakesApi && stakingPoolsApi && !isLoadingStakes && !isLoadingPools) {
      // Calculate total staked
      const totalStaked = Array.isArray(activeStakesApi) 
        ? activeStakesApi.reduce((sum: number, stake: any) => {
            return sum + parseFloat(stake.amount);
          }, 0)
        : 0;
      
      // Calculate rewards
      const totalRewards = Array.isArray(activeStakesApi) 
        ? activeStakesApi.reduce((sum: number, stake: any) => {
            return sum + parseFloat(stake.pendingRewards || '0');
          }, 0)
        : 0;
      
      setStakingPanelData(prev => ({
        ...prev,
        totalStaked,
        activeStakes: Array.isArray(activeStakesApi) ? activeStakesApi.length : 0,
        rewards: totalRewards,
        stakingPower: Math.min(Math.round((totalStaked / 1000000) * 100), 100) // Cap at 100%
      }));
    }
  }, [activeStakesApi, stakingPoolsApi, isLoadingStakes, isLoadingPools]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Refresh all dashboard data queries
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/status'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/history'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/stake/status'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/stake/pools'] })
    ]).then(() => {
      toast({
        title: "Dashboard Refreshed",
        description: "All blockchain data has been updated",
      });
      setRefreshing(false);
    }).catch(() => {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh some blockchain data",
        variant: "destructive"
      });
      setRefreshing(false);
    });
  };
  
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return '0 μPVX';
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M μPVX`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K μPVX`;
    } else {
      return `${value.toFixed(2)} μPVX`;
    }
  };
  
  const formatTimeAgo = (date: Date | undefined) => {
    if (!date) return 'N/A';
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">Unified Control Console</h2>
        <Button 
          variant="outline" 
          size="sm"
          className="border-blue-800 text-blue-400"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Wallet Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Wallet</span>
              </CardTitle>
              <Link href="/wallet">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Balance</p>
                  <p className="text-2xl font-bold text-blue-300">{formatCurrency(walletData.balance)}</p>
                </div>
                <div className="text-xs text-gray-500 bg-blue-950/30 rounded px-2 py-1">
                  PAGE 3
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <div className="text-xs font-mono text-gray-300 truncate bg-gray-900/50 rounded px-2 py-1">
                  {walletData.publicAddress}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Recent Transactions</p>
                <div className="space-y-2">
                  {walletData.transactions && walletData.transactions.length > 0 ? (
                    walletData.transactions.slice(0, 2).map(tx => (
                      <div key={tx.id || Math.random().toString()} className="flex justify-between items-center bg-gray-900/30 p-2 rounded">
                        <div className="flex items-center">
                          {tx.type === 'receive' ? (
                            <ArrowDownRight className="w-4 h-4 text-green-400 mr-2" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-orange-400 mr-2" />
                          )}
                          <div>
                            <p className="text-xs text-gray-300">{tx.type === 'receive' ? 'Received' : 'Sent'}</p>
                            <p className="text-xs text-gray-500">
                              {tx.type === 'receive' ? `From ${tx.from || 'Unknown'}` : `To ${tx.to || 'Unknown'}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm ${tx.type === 'receive' ? 'text-green-400' : 'text-orange-400'}`}>
                            {tx.type === 'receive' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(tx.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-2 bg-gray-900/30 rounded">
                      <p className="text-xs text-gray-400">No transactions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <div className="w-full flex justify-between items-center">
              <Link href="/wallet#send">
                <Button variant="outline" size="sm" className="border-blue-900/50 text-blue-300">
                  Send
                </Button>
              </Link>
              <Link href="/wallet#receive">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-600 text-white">
                  Receive
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        {/* Blockchain Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span>Blockchain</span>
              </CardTitle>
              <Link href="/blockchain">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/30 p-3 rounded">
                  <p className="text-xs text-gray-400">Current Height</p>
                  <p className="text-xl font-bold text-blue-300">{blockchainData.currentHeight?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-gray-900/30 p-3 rounded">
                  <p className="text-xs text-gray-400">Difficulty</p>
                  <p className="text-xl font-bold text-blue-300">{blockchainData.difficulty}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/30 p-3 rounded">
                  <p className="text-xs text-gray-400">Network Hash Rate</p>
                  <p className="text-lg font-bold text-blue-300">{blockchainData.hashRate}</p>
                </div>
                <div className="bg-gray-900/30 p-3 rounded">
                  <p className="text-xs text-gray-400">Last Block</p>
                  <p className="text-lg font-bold text-blue-300">{formatTimeAgo(blockchainData.lastBlockTime)}</p>
                </div>
              </div>
              
              <div className="bg-blue-950/20 rounded p-3 border border-blue-900/30">
                <div className="flex justify-between mb-1">
                  <p className="text-xs text-gray-400">Network Status</p>
                  <p className="text-xs text-green-400">Healthy</p>
                </div>
                <div className="w-full bg-gray-900/60 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: '92%' }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <div className="w-full flex justify-between items-center">
              <Link href="/blockchain">
                <Button variant="outline" size="sm" className="border-blue-900/50 text-blue-300">
                  Explorer
                </Button>
              </Link>
              <Link href="/blockchain">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-600 text-white">
                  Mine
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        {/* Staking Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                <span>Staking</span>
              </CardTitle>
              <Link href="/staking">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Total Staked</p>
                  <p className="text-2xl font-bold text-blue-300">{formatCurrency(stakingPanelData.totalStaked)}</p>
                </div>
                <div className="bg-purple-900/30 px-2 py-1 rounded text-purple-300 text-xs">
                  {stakingPanelData.activeStakes} Active Stakes
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <p className="text-xs text-gray-400">Staking Power</p>
                  <p className="text-xs text-blue-300">{stakingPanelData.stakingPower}%</p>
                </div>
                <Progress value={stakingPanelData.stakingPower} className="h-2" />
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <p className="text-xs text-gray-400 mb-1">Rewards Earned</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-green-400">+ {formatCurrency(stakingPanelData.rewards)}</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-green-900/50 text-green-400">
                    Claim
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <Link href="/staking">
              <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Stake
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Governance Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span>Governance</span>
              </CardTitle>
              <Link href="/governance">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-400">Voting Status</p>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <p className="text-lg font-bold text-green-400">{governanceData.votingStatus}</p>
                  </div>
                </div>
                <div className="bg-gray-900/30 py-1 px-3 rounded">
                  <p className="text-xs text-gray-400">Active Proposals</p>
                  <p className="text-xl font-bold text-center text-yellow-300">{governanceData.activeProposals}</p>
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <p className="text-xs text-gray-400">Your Voting Power</p>
                  <p className="text-xs text-blue-300">{formatCurrency(governanceData.votingPower)}</p>
                </div>
                <div className="w-full bg-gray-900/60 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-400"
                    style={{ width: `${(governanceData.votingPower / 10000) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <p className="text-xs text-gray-400 mb-2">Next Vote Ends In</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-900/60 p-1 rounded text-center">
                    <p className="text-lg font-bold text-blue-300">3</p>
                    <p className="text-[10px] text-gray-500">Days</p>
                  </div>
                  <div className="bg-gray-900/60 p-1 rounded text-center">
                    <p className="text-lg font-bold text-blue-300">6</p>
                    <p className="text-[10px] text-gray-500">Hours</p>
                  </div>
                  <div className="bg-gray-900/60 p-1 rounded text-center">
                    <p className="text-lg font-bold text-blue-300">24</p>
                    <p className="text-[10px] text-gray-500">Mins</p>
                  </div>
                  <div className="bg-gray-900/60 p-1 rounded text-center">
                    <p className="text-lg font-bold text-blue-300">18</p>
                    <p className="text-[10px] text-gray-500">Secs</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <Link href="/governance">
              <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-600 text-white">
                Vote Now
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Thringlets Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span>Thringlets</span>
              </CardTitle>
              <div className="flex items-center">
                <div className="mr-2 text-xs px-2 py-0.5 bg-blue-950/40 rounded text-blue-400">
                  P5
                </div>
                <Link href="/thringlets">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Your Thringlets</p>
                  <p className="text-2xl font-bold text-pink-300">{thringletData.owned}</p>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center text-green-400 text-xs">
                    {thringletData.emotions.joyful}
                  </div>
                  <div className="w-8 h-8 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-400 text-xs">
                    {thringletData.emotions.curious}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-900/30 p-2 rounded text-center">
                  <p className="text-xs text-gray-400 mb-1">Common</p>
                  <p className="text-xl font-bold text-gray-300">{thringletData.rarity.common}</p>
                </div>
                <div className="bg-blue-900/20 p-2 rounded text-center">
                  <p className="text-xs text-gray-400 mb-1">Rare</p>
                  <p className="text-xl font-bold text-blue-300">{thringletData.rarity.rare}</p>
                </div>
                <div className="bg-purple-900/20 p-2 rounded text-center">
                  <p className="text-xs text-gray-400 mb-1">Legendary</p>
                  <p className="text-xl font-bold text-purple-300">{thringletData.rarity.legendary}</p>
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-blue-300">Emotional States</p>
                  <Activity className="w-4 h-4 text-pink-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">Joyful</p>
                    <div className="w-full max-w-[120px] bg-gray-900/60 h-2 rounded-full overflow-hidden ml-2">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${(thringletData.emotions.joyful / thringletData.owned) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">Curious</p>
                    <div className="w-full max-w-[120px] bg-gray-900/60 h-2 rounded-full overflow-hidden ml-2">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${(thringletData.emotions.curious / thringletData.owned) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <Link href="/thringlets">
              <Button size="sm" className="w-full bg-pink-700 hover:bg-pink-600 text-white">
                Interact
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Drops Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                <span>Secret Drops</span>
              </CardTitle>
              <Link href="/drops">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Available Drops</p>
                  <p className="text-2xl font-bold text-cyan-300">{dropsData.available}</p>
                </div>
                <div className="bg-cyan-900/30 px-2 py-1 rounded text-cyan-300 text-xs flex items-center">
                  <Droplets className="w-3 h-3 mr-1" />
                  Active Drops
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <p className="text-xs text-gray-400 mb-2">Recent Drop</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-cyan-300">{dropsData.recentDrop.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="text-[10px] px-1.5 py-0.5 bg-blue-900/40 rounded text-blue-300">
                        {dropsData.recentDrop.rarity}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Expires in {formatTimeAgo(dropsData.recentDrop.expiry).replace(' ago', '')}
                      </p>
                    </div>
                  </div>
                  <Link href="/drops">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-cyan-900/50 text-cyan-400">
                      Claim
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <p className="text-xs text-gray-400 mb-2">Upcoming Drop</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-purple-300">{dropsData.upcomingDrop.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="text-[10px] px-1.5 py-0.5 bg-purple-900/40 rounded text-purple-300">
                        {dropsData.upcomingDrop.rarity}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        in {formatTimeAgo(dropsData.upcomingDrop.releaseTime).replace(' ago', '')}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled className="h-7 text-xs border-gray-700/50 text-gray-500">
                    Soon
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <Link href="/drops">
              <Button size="sm" className="w-full bg-cyan-700 hover:bg-cyan-600 text-white">
                Open Drop Terminal
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Learning Panel */}
        <Card className="bg-black/70 border-blue-900/50 overflow-hidden">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-300 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                <span>Learning Lab</span>
              </CardTitle>
              <Link href="/learning">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Learning Progress</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-green-300">{learningData.progress}%</p>
                    <p className="text-xs text-gray-500">
                      {learningData.completedModules} modules completed
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <p className="text-xs text-gray-400">Current Module</p>
                  <p className="text-xs text-blue-300">{learningData.progress}% Complete</p>
                </div>
                <p className="text-sm font-bold text-blue-300 mb-2">{learningData.currentModule}</p>
                <Progress value={learningData.progress} className="h-2" />
              </div>
              
              <div className="bg-gray-900/30 p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Reward Progress</p>
                    <p className="text-lg font-bold text-yellow-300">
                      + {formatCurrency(learningData.earnedRewards)}
                    </p>
                  </div>
                  <Link href="/learning">
                    <Button variant="ghost" size="sm" className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/30">
                      View All <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-2">
            <Link href="/learning">
              <Button size="sm" className="w-full bg-green-700 hover:bg-green-600 text-white">
                Continue Learning
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Blockchain Trend Radar */}
      <div className="mt-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            <span>Blockchain Trends</span>
          </h3>
        </div>
        <TrendRadar className="w-full" />
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-blue-300">Quick Actions</h3>
          <Link href="/actions">
            <Button variant="ghost" size="sm" className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/30">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/wallet#send">
            <div className="bg-black/70 border border-blue-900/50 rounded-lg p-4 text-center hover:bg-blue-900/10 transition-colors">
              <Wallet className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-blue-300">Send μPVX</p>
            </div>
          </Link>
          
          <Link href="/blockchain">
            <div className="bg-black/70 border border-blue-900/50 rounded-lg p-4 text-center hover:bg-blue-900/10 transition-colors">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-blue-300">Mine Blocks</p>
            </div>
          </Link>
          
          <Link href="/staking">
            <div className="bg-black/70 border border-blue-900/50 rounded-lg p-4 text-center hover:bg-blue-900/10 transition-colors">
              <Share2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-blue-300">Stake Tokens</p>
            </div>
          </Link>
          
          <Link href="/drops">
            <div className="bg-black/70 border border-blue-900/50 rounded-lg p-4 text-center hover:bg-blue-900/10 transition-colors">
              <Droplets className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm text-blue-300">Access Drops</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}