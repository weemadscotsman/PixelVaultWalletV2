import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  ArrowLeftRight, 
  Droplet, 
  BarChart, 
  History, 
  Wallet
} from 'lucide-react';
import SwapInterface from '@/components/dex/SwapInterface';
import LiquidityPoolInterface from '@/components/dex/LiquidityPoolInterface';
import { useWallet } from '@/hooks/use-wallet';
import { useUserSwaps, useSwaps } from '@/hooks/use-dex';
import { formatTokenAmount, formatDate, shortenAddress } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DEXPage() {
  const [activeTab, setActiveTab] = useState('swap');
  const { wallet } = useWallet();
  
  // Get all swaps and user-specific swaps
  const { data: recentSwaps, isLoading: isLoadingSwaps } = useSwaps(10);
  const { data: userSwaps, isLoading: isLoadingUserSwaps } = useUserSwaps(
    wallet?.address || '',
    5
  );
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column: Main interface */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
              PVX DEX
            </h1>
            <p className="text-gray-400">
              Swap tokens and provide liquidity in the PixelVault ecosystem
            </p>
          </div>
          
          <Tabs 
            defaultValue="swap" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-900 p-1 rounded-lg">
              <TabsTrigger 
                value="swap"
                className={`flex items-center gap-2 ${activeTab === 'swap' ? 'data-[state=active]:bg-blue-600' : ''}`}
                onClick={() => setActiveTab('swap')}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Swap</span>
              </TabsTrigger>
              <TabsTrigger 
                value="liquidity"
                className={`flex items-center gap-2 ${activeTab === 'liquidity' ? 'data-[state=active]:bg-blue-600' : ''}`}
                onClick={() => setActiveTab('liquidity')}
              >
                <Droplet className="h-4 w-4" />
                <span>Liquidity</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="swap" className="mt-4">
              <SwapInterface />
            </TabsContent>
            
            <TabsContent value="liquidity" className="mt-4">
              <LiquidityPoolInterface />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column: Analytics and transactions */}
        <div className="w-full md:w-1/2 space-y-6">
          {/* Wallet Balances Card */}
          <Card className="bg-black/80 backdrop-blur-lg border-slate-800 shadow-lg shadow-blue-500/10">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Your Balances</CardTitle>
                <Wallet className="h-5 w-5 text-gray-400" />
              </div>
              <CardDescription>
                {wallet ? 
                  `Connected: ${shortenAddress(wallet.address)}` : 
                  "Not connected"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!wallet ? (
                <div className="text-center py-6 text-gray-500">
                  Connect your wallet to view balances
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold">
                        PVX
                      </div>
                      <div>
                        <div className="font-medium">PixelVault</div>
                        <div className="text-xs text-gray-500">Native Token</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl">{formatTokenAmount(wallet.balance, 6)}</div>
                      <div className="text-xs text-gray-500">≈ $333.33</div>
                    </div>
                  </div>
                  
                  {/* Sample other token balances */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center text-white font-bold text-xs">
                        USDC
                      </div>
                      <div>
                        <div className="font-medium">USD Coin</div>
                        <div className="text-xs text-gray-500">Stablecoin</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">0.00</div>
                      <div className="text-xs text-gray-500">≈ $0.00</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">
                        PXEN
                      </div>
                      <div>
                        <div className="font-medium">PX Energy</div>
                        <div className="text-xs text-gray-500">Utility Token</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">0.00</div>
                      <div className="text-xs text-gray-500">≈ $0.00</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Your Transactions Card */}
          <Card className="bg-black/80 backdrop-blur-lg border-slate-800 shadow-lg shadow-blue-500/10">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Your Transactions</CardTitle>
                <History className="h-5 w-5 text-gray-400" />
              </div>
              <CardDescription>
                Recent DEX activity from your wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!wallet ? (
                <div className="text-center py-6 text-gray-500">
                  Connect your wallet to view your transactions
                </div>
              ) : isLoadingUserSwaps ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-12 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : userSwaps?.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  You haven't made any swaps yet
                </div>
              ) : (
                <div className="space-y-3">
                  {userSwaps?.map((swap) => (
                    <div key={swap.id} className="flex justify-between items-center p-3 rounded-md bg-slate-900/40 border border-slate-800/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          Swapped {formatTokenAmount(swap.amount_in, 6)} → {formatTokenAmount(swap.amount_out, 6)}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(swap.timestamp, true)}</span>
                      </div>
                      <Badge variant="outline">{(Number(swap.price_impact_percent) > 1 ? "High Impact" : "Low Impact")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Swaps Card */}
          <Card className="bg-black/80 backdrop-blur-lg border-slate-800 shadow-lg shadow-blue-500/10">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">Recent Swaps</CardTitle>
                <BarChart className="h-5 w-5 text-gray-400" />
              </div>
              <CardDescription>
                Latest activity across all pools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              {isLoadingSwaps ? (
                <div className="space-y-3 px-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-12 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : recentSwaps?.length === 0 ? (
                <div className="text-center py-6 text-gray-500 px-6">
                  No swaps recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-800">
                      <TableHead>Transaction</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Account</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSwaps?.map((swap) => (
                      <TableRow key={swap.id} className="border-slate-800">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">Swap</span>
                            <span className="text-xs text-gray-500">Pool #{swap.pool_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatTokenAmount(swap.amount_in, 6)}</span>
                            <span className="text-xs text-gray-500">→ {formatTokenAmount(swap.amount_out, 6)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm">{shortenAddress(swap.trader_address)}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {new Date(swap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}