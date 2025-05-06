import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Blocks, 
  Zap, 
  Clock,
  Cpu,
  FileCode,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Example blockchain data
const blockchainData = {
  currentHeight: 3421897,
  difficulty: 3.75,
  hashRate: '14.2 TH/s',
  lastBlockTime: new Date(Date.now() - 1000 * 15),
  networkVersion: 'v1.3.42',
  consensusHealth: 92,
  averageBlockTime: 15.3,
  activeMiners: 127,
  blocks: [
    { height: 3421897, hash: '0x8f2e7...9c3d', transactions: 24, timestamp: new Date(Date.now() - 1000 * 15), miner: '0x3a4b...7c9d' },
    { height: 3421896, hash: '0x3a5d9...8f2e', transactions: 18, timestamp: new Date(Date.now() - 1000 * 30), miner: '0x7e2f...1a5b' },
    { height: 3421895, hash: '0x6c1f8...2e5a', transactions: 32, timestamp: new Date(Date.now() - 1000 * 45), miner: '0x9d4e...5c2f' },
    { height: 3421894, hash: '0x2d8e3...7f1a', transactions: 12, timestamp: new Date(Date.now() - 1000 * 60), miner: '0x3a4b...7c9d' },
    { height: 3421893, hash: '0x9c4a2...1d7e', transactions: 27, timestamp: new Date(Date.now() - 1000 * 75), miner: '0x8e2d...4f9a' },
  ]
};

export default function BlockchainPage() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
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
    <DashboardLayout>
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
                  <p className="text-xl font-bold text-blue-300">{blockchainData.currentHeight.toLocaleString()}</p>
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
                  <p className="text-xl font-bold text-blue-300">{blockchainData.hashRate}</p>
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
                  <p className="text-xs text-gray-400">Avg Block Time</p>
                  <p className="text-xl font-bold text-blue-300">{blockchainData.averageBlockTime}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <CardTitle className="text-blue-300">Recent Blocks</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {blockchainData.blocks.map((block) => (
                    <div key={block.height} className="bg-gray-900/30 p-3 rounded hover:bg-gray-900/50 transition-colors cursor-pointer">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-900/30 h-8 w-8 rounded-full flex items-center justify-center">
                            <Blocks className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-300">Block #{block.height.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{block.hash}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-blue-400">{block.transactions} txns</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(block.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                <Button 
                  variant="outline" 
                  className="w-full border-blue-900/50 text-blue-300"
                >
                  View All Blocks
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <CardTitle className="text-blue-300">Network Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Consensus Health</p>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="text-xs text-green-400">Healthy</p>
                    </div>
                    <Progress value={blockchainData.consensusHealth} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/30 p-3 rounded">
                      <p className="text-xs text-gray-400">Difficulty</p>
                      <p className="text-lg font-bold text-blue-300">{blockchainData.difficulty}</p>
                    </div>
                    <div className="bg-gray-900/30 p-3 rounded">
                      <p className="text-xs text-gray-400">Active Miners</p>
                      <p className="text-lg font-bold text-blue-300">{blockchainData.activeMiners}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-950/20 p-3 rounded border border-blue-900/30">
                    <p className="text-xs text-gray-400 mb-1">Network Version</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <FileCode className="w-4 h-4 text-blue-400 mr-2" />
                        <p className="text-sm font-semibold text-blue-300">{blockchainData.networkVersion}</p>
                      </div>
                      <div className="bg-green-900/30 px-2 py-0.5 rounded text-green-400 text-xs">
                        Current
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                <Button className="w-full bg-blue-700 hover:bg-blue-600 text-white">
                  Start Mining
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}