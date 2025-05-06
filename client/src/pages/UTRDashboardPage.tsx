import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { UTRList, UTRStatsCard } from '@/components/utr';
import { DatabaseBackup, FileSearch, PieChart, Search, BarChart4 } from 'lucide-react';

export function UTRDashboardPage() {
  const [searchAddress, setSearchAddress] = useState('');
  const [activeAddress, setActiveAddress] = useState<string | undefined>(undefined);
  const [txType, setTxType] = useState<string | undefined>(undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      setActiveAddress(searchAddress.trim());
    } else {
      setActiveAddress(undefined);
    }
  };

  const clearSearch = () => {
    setSearchAddress('');
    setActiveAddress(undefined);
  };

  useEffect(() => {
    document.title = "PVX Universal Transaction Registry | Blockchain Explorer";
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
              Universal Transaction Registry
            </h1>
            <p className="text-gray-400">Track all transactions across the PVX blockchain</p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by wallet address..."
                className="pl-9 bg-gray-900/50 border-gray-800"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
            {activeAddress && (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-gray-900/50">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-700/50">
                    <DatabaseBackup className="mr-2 h-4 w-4" />
                    All Transactions
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="data-[state=active]:bg-gray-700/50" disabled={!activeAddress}>
                    <FileSearch className="mr-2 h-4 w-4" />
                    Wallet View
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <UTRList />
              </TabsContent>

              <TabsContent value="wallet" className="mt-0">
                {activeAddress ? (
                  <UTRList wallet={activeAddress} />
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <p>Enter a wallet address to view its transactions</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <UTRStatsCard />

            <Card className="overflow-hidden border border-gray-200 bg-transparent backdrop-blur-sm backdrop-filter bg-opacity-80 rounded-xl shadow-sm">
              <CardHeader className="bg-gradient-to-b from-gray-900/70 to-gray-900/40 text-white p-4 pb-3">
                <CardTitle className="text-xl font-bold tracking-tight">
                  <div className="flex items-center">
                    <BarChart4 className="mr-2 h-5 w-5" />
                    Quick Stats
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Recent PVX network activity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/20 border border-gray-800/30">
                    <span className="text-sm text-gray-400">Pending Txs</span>
                    <span className="font-mono text-yellow-500 font-medium">12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/20 border border-gray-800/30">
                    <span className="text-sm text-gray-400">24h Volume</span>
                    <span className="font-mono text-green-500 font-medium">27.3M PVX</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/20 border border-gray-800/30">
                    <span className="text-sm text-gray-400">Avg Tx Fee</span>
                    <span className="font-mono text-blue-500 font-medium">0.00021 PVX</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/20 border border-gray-800/30">
                    <span className="text-sm text-gray-400">Txs Per Block</span>
                    <span className="font-mono text-purple-500 font-medium">~38</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-gray-200 bg-transparent backdrop-blur-sm backdrop-filter bg-opacity-80 rounded-xl shadow-sm">
              <CardHeader className="bg-gradient-to-b from-gray-900/70 to-gray-900/40 text-white p-4 pb-3">
                <CardTitle className="text-xl font-bold tracking-tight">
                  <div className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Asset Distribution
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Transaction volume by asset
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {/* In a real implementation, this would be a chart */}
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">PVX</span>
                      <span className="text-sm text-gray-300">78.4%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{ width: '78.4%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">NFTs</span>
                      <span className="text-sm text-gray-300">12.2%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-400 h-2 rounded-full" style={{ width: '12.2%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Thringlets</span>
                      <span className="text-sm text-gray-300">6.8%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2 rounded-full" style={{ width: '6.8%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Governance</span>
                      <span className="text-sm text-gray-300">2.6%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full" style={{ width: '2.6%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UTRDashboardPage;