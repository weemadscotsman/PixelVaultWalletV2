import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { 
  Blocks, 
  Zap, 
  Clock,
  Cpu,
  FileCode,
  RefreshCw,
  BarChart,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendRadar } from '@/components/blockchain/TrendRadar';
import { useBlockchain } from '@/hooks/use-blockchain';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/use-wallet';
import { shortenAddress } from '@/lib/utils';
import { Link } from 'wouter';

export default function BlockchainPage() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const queryClient = useQueryClient();
  const { activeWallet } = useWallet();
  
  const { 
    statusQuery, 
    getRecentBlocks, 
    getRecentTransactions,
    latestBlockQuery,
    startMiningMutation,
    stopMiningMutation,
    getMiningStats
  } = useBlockchain();
  
  // Get blockchain status
  const { data: blockchainStatus, isLoading: isStatusLoading, error: statusError } = statusQuery;
  
  // Get recent blocks
  const { data: recentBlocks, isLoading: isBlocksLoading } = getRecentBlocks(5);
  
  // Get mining stats if active wallet exists
  const { data: miningStats, isLoading: isMiningStatsLoading } = getMiningStats(activeWallet || '');
  
  // Check if wallet is currently mining
  const isMining = miningStats?.isCurrentlyMining || false;
  
  // Mock data for parts not yet implemented in real API
  const networkVersion = 'v0.1.42';
  const consensusHealth = 95;
  const activeMiners = miningStats ? 1 : 0;
  
  // Start mining with active wallet
  const handleStartMining = () => {
    if (activeWallet) {
      startMiningMutation.mutate(activeWallet);
    }
  };
  
  // Stop mining with active wallet
  const handleStopMining = () => {
    if (activeWallet) {
      stopMiningMutation.mutate(activeWallet);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['/api/blockchain/status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/blockchain/blocks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/blockchain/mining/stats', activeWallet] });
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatTimeAgo = (date: Date) => {
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
    <PageLayout isConnected={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Blocks className="inline-block mr-2 h-6 w-6" /> 
            PVX Blockchain Explorer
          </h2>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Cpu className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Current Block Height</p>
                  {isStatusLoading ? (
                    <p className="text-xl font-bold text-blue-300"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...</p>
                  ) : blockchainStatus?.latestBlock ? (
                    <p className="text-xl font-bold text-blue-300">{blockchainStatus.latestBlock.height.toLocaleString()}</p>
                  ) : (
                    <p className="text-xl font-bold text-blue-300">-</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Network Hash Rate</p>
                  {isStatusLoading ? (
                    <p className="text-xl font-bold text-blue-300"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...</p>
                  ) : blockchainStatus?.networkHashRate ? (
                    <p className="text-xl font-bold text-blue-300">{blockchainStatus.networkHashRate.toFixed(2)} MH/s</p>
                  ) : (
                    <p className="text-xl font-bold text-blue-300">-</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Difficulty</p>
                  {isStatusLoading ? (
                    <p className="text-xl font-bold text-blue-300"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...</p>
                  ) : blockchainStatus?.difficulty ? (
                    <p className="text-xl font-bold text-blue-300">{blockchainStatus.difficulty.toFixed(2)}</p>
                  ) : (
                    <p className="text-xl font-bold text-blue-300">-</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Blockchain Trend Radar */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              <span>Network Metrics Radar</span>
            </h3>
          </div>
          <TrendRadar className="w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <CardTitle className="text-blue-300">Recent Blocks</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isBlocksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : recentBlocks && recentBlocks.length > 0 ? (
                    <div className="space-y-3">
                      {recentBlocks.map((block) => (
                        <div key={block.height} className="bg-gray-900/30 p-3 rounded hover:bg-gray-900/50 transition-colors cursor-pointer">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                                <Blocks className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-300">Block #{block.height.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{shortenAddress(block.hash)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-blue-400">{block.transactions.length} txns</p>
                              <p className="text-xs text-gray-500">{formatTimeAgo(new Date(block.timestamp))}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-400">No blocks found</p>
                    </div>
                  )}
                </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                <Link href="/blockchain/blocks">
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-900/50 text-blue-300"
                  >
                    View All Blocks
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <CardTitle className="text-blue-300">Mining Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Consensus Health</p>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-xs text-green-400">Healthy</p>
                    </div>
                    <Progress value={consensusHealth} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/30 p-3 rounded">
                      <p className="text-xs text-gray-400">Difficulty</p>
                      <p className="text-lg font-bold text-blue-300">
                        {blockchainStatus?.difficulty ? blockchainStatus.difficulty.toFixed(2) : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-900/30 p-3 rounded">
                      <p className="text-xs text-gray-400">Active Miners</p>
                      <p className="text-lg font-bold text-blue-300">{activeMiners}</p>
                    </div>
                  </div>
                  
                  {activeWallet && (
                    <div className="bg-blue-950/40 p-4 rounded border border-blue-900/60">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">Your Mining Stats</h4>
                      {isMiningStatsLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                        </div>
                      ) : miningStats ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Hash Rate:</span>
                            <span className="text-xs text-blue-300">{miningStats.currentHashRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Blocks Mined:</span>
                            <span className="text-xs text-blue-300">{miningStats.blocksMined}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Total Rewards:</span>
                            <span className="text-xs text-blue-300">{parseInt(miningStats.totalRewards).toLocaleString()} μPVX</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No mining stats available</p>
                      )}
                    </div>
                  )}
                  
                  <div className="bg-blue-950/20 p-3 rounded border border-blue-900/30">
                    <p className="text-xs text-gray-400 mb-1">Network Version</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FileCode className="w-4 h-4 text-blue-400 mr-2" />
                        <p className="text-sm font-semibold text-blue-300">{networkVersion}</p>
                      </div>
                      <div className="bg-green-900/30 px-2 py-0.5 rounded text-green-400 text-xs">
                        Current
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                {activeWallet ? (
                  isMining ? (
                    <Button 
                      className="w-full bg-red-700 hover:bg-red-600 text-white"
                      onClick={handleStopMining}
                      disabled={stopMiningMutation.isPending}
                    >
                      {stopMiningMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Stopping Mining...</>
                      ) : (
                        'Stop Mining'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-blue-700 hover:bg-blue-600 text-white"
                      onClick={handleStartMining}
                      disabled={startMiningMutation.isPending}
                    >
                      {startMiningMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting Mining...</>
                      ) : (
                        'Start Mining'
                      )}
                    </Button>
                  )
                ) : (
                  <Button 
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                    disabled
                  >
                    Connect Wallet to Mine
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}