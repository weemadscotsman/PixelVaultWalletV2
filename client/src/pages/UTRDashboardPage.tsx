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
import { PageLayout } from '@/components/layout/PageLayout';
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
    <PageLayout isConnected={true}>
      {/* Fixed header with consistent padding and styling */}
      <div className="px-8 py-6 border-b border-gray-800 bg-black/60 backdrop-blur-sm mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-shadow-neon bg-gradient-to-br from-blue-300 to-cyan-200 bg-clip-text text-transparent">
                Universal Transaction Registry
              </h1>
              <p className="text-gray-400 mt-1">Secure, immutable record of all PVX blockchain activity</p>
            </div>

            <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
                <Input
                  type="text"
                  placeholder="Search by wallet address..."
                  className="pl-10 bg-gray-900/70 border-gray-700 focus:border-cyan-500/50 text-gray-200"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                variant="secondary" 
                className="bg-cyan-900/50 text-cyan-200 border-cyan-700/50 hover:bg-cyan-800/30"
              >
                Search
              </Button>
              {activeAddress && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-gray-400 hover:text-gray-200"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
            </form>
          </div>
        </div>
      </div>
      
      {/* Main content with consistent max width and padding */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main transaction list - spans 8/12 columns on large screens */}
          <div className="col-span-12 lg:col-span-8">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-gray-900/70 border border-gray-800">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-cyan-300"
                  >
                    <DatabaseBackup className="mr-2 h-4 w-4" />
                    All Transactions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="wallet" 
                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-cyan-300" 
                    disabled={!activeAddress}
                  >
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
                  <Card className="border border-gray-800 bg-black/70 backdrop-blur-sm backdrop-filter rounded-xl shadow-md">
                    <CardContent className="p-8 text-center">
                      <FileSearch className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-300 font-medium">Enter a wallet address to view its transactions</p>
                      <p className="text-sm text-gray-500 mt-1">Search for a specific address to see transaction history</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar - spans 4/12 columns on large screens */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Statistics card with consistent styling */}
            <UTRStatsCard />

            {/* Quick stats with consistent styling */}
            <Card className="overflow-hidden border border-gray-800 bg-black/70 backdrop-blur-sm backdrop-filter rounded-xl shadow-md">
              <CardHeader className="bg-gradient-to-b from-gray-900/90 to-gray-900/70 text-white p-4 pb-3 border-b border-gray-800/60">
                <CardTitle className="text-xl font-bold tracking-tight text-shadow-neon bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  <div className="flex items-center">
                    <BarChart4 className="mr-2 h-5 w-5 text-cyan-400" />
                    Network Metrics
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Live PVX chain activity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/40 border border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <span className="text-sm text-gray-300">Pending Txs</span>
                    <span className="font-mono text-yellow-400 font-medium">12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/40 border border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <span className="text-sm text-gray-300">24h Volume</span>
                    <span className="font-mono text-green-400 font-medium">27.3M PVX</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/40 border border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <span className="text-sm text-gray-300">Avg Tx Fee</span>
                    <span className="font-mono text-blue-400 font-medium">0.00021 PVX</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-gray-900/40 border border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <span className="text-sm text-gray-300">Txs Per Block</span>
                    <span className="font-mono text-purple-400 font-medium">~38</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset distribution with consistent styling */}
            <Card className="overflow-hidden border border-gray-800 bg-black/70 backdrop-blur-sm backdrop-filter rounded-xl shadow-md">
              <CardHeader className="bg-gradient-to-b from-gray-900/90 to-gray-900/70 text-white p-4 pb-3 border-b border-gray-800/60">
                <CardTitle className="text-xl font-bold tracking-tight text-shadow-neon bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
                  <div className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5 text-purple-400" />
                    Asset Distribution
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Token volume breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-300 font-medium">PVX</span>
                      <span className="text-sm text-cyan-400 font-mono">78.4%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full shadow-glow-cyan" style={{ width: '78.4%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-300 font-medium">NFTs</span>
                      <span className="text-sm text-pink-400 font-mono">12.2%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-400 h-2.5 rounded-full shadow-glow-pink" style={{ width: '12.2%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-300 font-medium">Thringlets</span>
                      <span className="text-sm text-indigo-400 font-mono">6.8%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2.5 rounded-full shadow-glow-indigo" style={{ width: '6.8%' }}></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-300 font-medium">Governance</span>
                      <span className="text-sm text-orange-400 font-mono">2.6%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-2.5 rounded-full shadow-glow-amber" style={{ width: '2.6%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default UTRDashboardPage;