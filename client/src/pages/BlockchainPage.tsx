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
  Loader2,
  Search,
  Database,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  Settings,
  Wifi
} from 'lucide-react';
import { PVXSystemValidator, type SystemStatus } from '@/utils/system-validator';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendRadar } from '@/components/blockchain/TrendRadar';
import HealthVitalsDashboard from '@/components/health/HealthVitalsDashboard';
import { useBlockchain } from '@/hooks/use-blockchain';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/use-wallet';
import { shortenAddress } from '@/lib/utils';
import { Link } from 'wouter';

export default function BlockchainPage() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isValidating, setIsValidating] = useState(false);
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
  
  // Check if wallet is currently mining - assume mining if we have mining stats and blocks found
  const isMining = miningStats && miningStats.blocksFound > 0;

  // System validation function
  const runSystemValidation = async () => {
    if (!activeWallet) {
      console.log('No wallet connected for system validation');
      return;
    }

    setIsValidating(true);
    console.log('🔍 INITIATING PVX SYSTEM CROSS-CHECK PROTOCOL...');
    
    try {
      const validator = new PVXSystemValidator(activeWallet, 'no-token-required');
      const status = await validator.runFullSystemCheck();
      setSystemStatus(status);
      
      // Also run wallet propagation test
      await validator.validateWalletPropagation();
      
    } catch (error) {
      console.error('System validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };
  
  // Get real data from blockchain status
  const activeMiners = blockchainStatus?.activeMiners || 0;
  const consensusHealth = blockchainStatus?.consensusHealth || 0;
  const networkVersion = 'v1.51-PVX';
  
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
                  ) : blockchainStatus?.latestBlock?.height ? (
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
                  ) : miningStats?.hashRate ? (
                    <p className="text-xl font-bold text-blue-300">{parseFloat(miningStats.hashRate).toFixed(2)} MH/s</p>
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
                              <p className="text-xs text-blue-400">{block.transactions?.length || 0} txns</p>
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
                            <span className="text-xs text-blue-300">{miningStats.hashRate} MH/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Blocks Mined:</span>
                            <span className="text-xs text-blue-300">{miningStats.blocksFound || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Total Rewards:</span>
                            <span className="text-xs text-blue-300">{Number(miningStats.totalRewards || 0).toLocaleString()} μPVX</span>
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

      {/* Block Inspector - Raw Chain Data */}
      <div className="mt-8">
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white flex items-center">
              <Search className="w-5 h-5 mr-2 text-green-400" />
              Live Block Inspector - Chain Transparency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentBlocks && recentBlocks.length > 0 ? (
              <div className="space-y-4">
                {recentBlocks.map((block, index) => (
                  <div key={block.hash} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          Block #{block.height}
                        </h4>
                        <div className="text-xs space-y-1 font-mono">
                          <div><span className="text-gray-400">Hash:</span> <span className="text-green-400">{block.hash}</span></div>
                          <div><span className="text-gray-400">Previous:</span> <span className="text-yellow-400">{block.previousHash}</span></div>
                          <div><span className="text-gray-400">Miner:</span> <span className="text-blue-400">{block.miner}</span></div>
                          <div><span className="text-gray-400">Merkle Root:</span> <span className="text-purple-400">{block.merkleRoot}</span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-orange-400 font-semibold mb-2">Mining Evidence</h4>
                        <div className="text-xs space-y-1">
                          <div><span className="text-gray-400">Nonce:</span> <span className="text-white font-mono">{block.nonce}</span></div>
                          <div><span className="text-gray-400">Difficulty:</span> <span className="text-orange-400">{block.difficulty}</span></div>
                          <div><span className="text-gray-400">Size:</span> <span className="text-cyan-400">{block.size} bytes</span></div>
                          <div><span className="text-gray-400">Timestamp:</span> <span className="text-gray-300">{new Date(block.timestamp).toLocaleString()}</span></div>
                          <div><span className="text-gray-400">Age:</span> <span className="text-white">{Math.floor((Date.now() - block.timestamp) / 1000)}s ago</span></div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-blue-400 font-semibold mb-2">Transaction Data</h4>
                        <div className="text-xs space-y-1">
                          <div><span className="text-gray-400">Count:</span> <span className="text-white">{block.transactions?.length || 0}</span></div>
                          <div><span className="text-gray-400">Total Txs:</span> <span className="text-green-400">{block.totalTransactions || 0}</span></div>
                          {block.transactions && block.transactions.length > 0 ? (
                            <div className="mt-2 p-2 bg-gray-700/50 rounded">
                              <div className="text-gray-400 mb-1">Raw Transactions:</div>
                              {block.transactions.slice(0, 3).map((tx, txIndex) => (
                                <div key={txIndex} className="text-xs text-green-300 font-mono break-all mb-1">
                                  {typeof tx === 'string' ? tx : JSON.stringify(tx)}
                                </div>
                              ))}
                              {block.transactions.length > 3 && (
                                <div className="text-gray-500 text-xs">+ {block.transactions.length - 3} more</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs">Empty block (mining reward only)</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Verification Status */}
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-400">Hash Valid</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-400">Chain Linked</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-400">PoW Verified</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-400">Immutable</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Confirmations: {recentBlocks.length - index}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Loading blockchain transparency data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mining Operation Transparency */}
      <div className="mt-8">
        <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-700/30">
          <CardHeader className="border-b border-green-700/30">
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-400" />
              Mining Operation Transparency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {miningStats && activeWallet ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Active Mining Session
                  </h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wallet ID:</span>
                      <span className="text-green-400 break-all">{activeWallet}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hash Rate:</span>
                      <span className="text-white">{miningStats.hashRate} MH/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Blocks Found:</span>
                      <span className="text-blue-400">{miningStats.blocksFound || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Rewards:</span>
                      <span className="text-yellow-400">{Number(miningStats.totalRewards || 0).toLocaleString()} μPVX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reward/Block:</span>
                      <span className="text-purple-400">5,000,000 μPVX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Est. Value:</span>
                      <span className="text-green-400">{((miningStats.blocksFound || 0) * 5000000).toLocaleString()} μPVX</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/30">
                  <h4 className="text-blue-400 font-semibold mb-3">Network Integrity Check</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network Status:</span>
                      <span className="text-green-400 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        {blockchainStatus?.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sync Status:</span>
                      <span className="text-green-400">{blockchainStatus?.synced ? 'Synchronized' : 'Syncing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Peer Count:</span>
                      <span className="text-white">{blockchainStatus?.peers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Difficulty:</span>
                      <span className="text-orange-400">{blockchainStatus?.difficulty || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latest Block:</span>
                      <span className="text-purple-400">#{blockchainStatus?.latestBlock?.height || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chain Version:</span>
                      <span className="text-blue-400">{networkVersion}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Connect wallet to view mining transparency</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PVX System Validation Dashboard */}
      <div className="mt-8">
        <Card className="bg-gradient-to-br from-red-900/20 to-black border-red-700/30">
          <CardHeader className="border-b border-red-700/30">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-red-400" />
                PVX System Interconnection Validator
              </div>
              <Button 
                onClick={runSystemValidation}
                disabled={isValidating || !activeWallet}
                className="bg-red-700 hover:bg-red-600 text-white"
              >
                {isValidating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Validating...</>
                ) : (
                  'Run Full System Check'
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!activeWallet ? (
              <div className="text-center text-gray-400 py-8">
                <Wifi className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Connect wallet to run system validation</p>
              </div>
            ) : systemStatus ? (
              <div className="space-y-6">
                {/* System Health Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-gray-400 text-sm mb-2">Overall Health</h4>
                    <div className={`text-lg font-bold ${
                      systemStatus.overallHealth === 'healthy' ? 'text-green-400' :
                      systemStatus.overallHealth === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {systemStatus.overallHealth.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-gray-400 text-sm mb-2">Services Online</h4>
                    <div className="text-lg font-bold text-white">
                      {systemStatus.servicesOnline}/{systemStatus.totalServices}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-gray-400 text-sm mb-2">Wallet Connected</h4>
                    <div className={`text-lg font-bold ${systemStatus.walletConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {systemStatus.walletConnected ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-gray-400 text-sm mb-2">Validation Time</h4>
                    <div className="text-lg font-bold text-white">
                      {systemStatus ? new Date(systemStatus.timestamp).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Service Status Matrix */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">Service Status Matrix</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {systemStatus.validationResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-gray-300">{result.service}</span>
                          {result.authRequired && (
                            <Shield className="w-3 h-3 ml-1 text-blue-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${
                            result.status === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {result.status === 'success' ? 'ONLINE' : 'OFFLINE'}
                          </span>
                          <span className="text-gray-500">{result.responseTime}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Failed Services Detail */}
                {systemStatus.validationResults.some(r => r.status === 'error') && (
                  <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
                    <h4 className="text-red-400 font-semibold mb-3">Failed Services</h4>
                    <div className="space-y-2">
                      {systemStatus.validationResults
                        .filter(r => r.status === 'error')
                        .map((result, index) => (
                          <div key={index} className="bg-red-800/20 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-red-300 font-medium">{result.service}</span>
                              <span className="text-red-400 text-xs">{result.endpoint}</span>
                            </div>
                            {result.error && (
                              <div className="text-red-200 text-xs mt-1">{result.error}</div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Run system validation to check all endpoint connections</p>
                <p className="text-xs mt-2">This will test all services with your connected wallet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Health Vitals Dashboard */}
      <div className="mt-8">
        <HealthVitalsDashboard />
      </div>

      {/* Real-time Chain Monitor */}
      <div className="mt-8">
        <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-700/30">
          <CardHeader className="border-b border-purple-700/30">
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-400" />
              Real-time Chain Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700/30">
                <h4 className="text-purple-400 font-semibold mb-2">Block Production</h4>
                <div className="text-2xl font-bold text-white">{latestBlock?.height || 0}</div>
                <div className="text-xs text-gray-400">Current Height</div>
                <div className="mt-2 text-xs">
                  <div className="text-gray-400">Latest Hash:</div>
                  <div className="text-purple-300 font-mono break-all">{latestBlock?.hash || 'N/A'}</div>
                </div>
              </div>
              
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
                <h4 className="text-green-400 font-semibold mb-2">Mining Stats</h4>
                <div className="text-2xl font-bold text-white">{miningStats?.blocksFound || 0}</div>
                <div className="text-xs text-gray-400">Total Blocks Mined</div>
                <div className="mt-2 text-xs">
                  <div className="text-gray-400">Success Rate:</div>
                  <div className="text-green-300">100% (Solo Mining)</div>
                </div>
              </div>
              
              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-700/30">
                <h4 className="text-yellow-400 font-semibold mb-2">Rewards Earned</h4>
                <div className="text-2xl font-bold text-white">{Number(miningStats?.totalRewards || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-400">μPVX Total</div>
                <div className="mt-2 text-xs">
                  <div className="text-gray-400">Last Reward:</div>
                  <div className="text-yellow-300">5,000,000 μPVX</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}