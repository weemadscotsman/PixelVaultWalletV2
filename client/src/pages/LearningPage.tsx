import React, { useState } from 'react';
import { HashlordGame } from '@/components/learning/HashlordGame';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookText, Zap, Gauge, Package, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function LearningPage() {
  const [wallet, setWallet] = useState({
    address: '0x7f2331b84e5a65c772e21c66af6fb53bea39367a',
    balance: 1250000 // μPVX
  });
  
  const handleLearningComplete = (game: string, score: number, difficulty: number) => {
    // Award based on score and difficulty
    const reward = score * 100;
    
    setWallet(prev => ({
      ...prev,
      balance: prev.balance + reward
    }));
    
    toast({
      title: `Learning Complete: ${game}`,
      description: `You've earned ${reward.toLocaleString()} μPVX!`,
      variant: "success",
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <Card className="bg-black/95 border-blue-900/50 p-6 h-full">
            <h2 className="text-xl font-bold text-blue-300 mb-4">Learning Center</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Master blockchain concepts through interactive games and earn μPVX rewards!
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-md border border-blue-900/50">
                <h3 className="text-md font-semibold text-blue-400 mb-2">Your Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Wallet:</span>
                    <span className="text-blue-300 font-mono text-xs">
                      {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Balance:</span>
                    <span className="text-green-300 font-mono">{wallet.balance.toLocaleString()} μPVX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Games Completed:</span>
                    <span className="text-blue-300 font-mono">1/5</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-md border border-blue-900/50">
                <h3 className="text-md font-semibold text-blue-400 mb-2">Learning Paths</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-300">Mining & Consensus</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-gray-400">Transactions & Fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-gray-400">Smart Contracts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span className="text-gray-400">Blockchain Security</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:w-3/4">
          <Tabs defaultValue="hashlord" className="w-full">
            <TabsList className="bg-black/90 border border-blue-900/40 p-1 mb-6">
              <TabsTrigger value="hashlord" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Hashlord</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="gas-escape" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  <span>Gas Escape</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="staking-wars" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Staking Wars</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="rug-game" className="data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Rug Game</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hashlord">
              <HashlordGame 
                onComplete={(score, difficulty) => handleLearningComplete('Hashlord', score, difficulty)}
                walletAddress={wallet.address}
              />
              
              <div className="mt-8">
                <Card className="bg-black/90 border-blue-900/50 p-6">
                  <div className="flex items-start gap-4">
                    <BookText className="h-8 w-8 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-300 mb-2">About Mining & Hash Functions</h3>
                      <div className="space-y-4 text-gray-300 text-sm">
                        <p>
                          Mining is the process by which new blocks are added to a blockchain. Miners compete to solve a computational puzzle,
                          and the first one to find a solution gets to add the next block and earn a reward.
                        </p>
                        <p>
                          The puzzle involves finding a number (nonce) that, when combined with the block data and hashed,
                          produces a result with a specific number of leading zeros. This is known as Proof of Work.
                        </p>
                        <p>
                          Hash functions like SHA-256 are one-way functions - easy to compute but extremely difficult to reverse.
                          This property makes them perfect for securing blockchain networks, as finding a valid hash requires
                          computational work (hence "Proof of Work").
                        </p>
                        <p>
                          In the PVX blockchain, miners earn μPVX rewards for successfully adding blocks to the chain,
                          with the difficulty adjusting automatically to ensure blocks are produced at a consistent rate.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="gas-escape">
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Gauge className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Coming Soon</h3>
                  <p className="text-gray-400 max-w-md">
                    The Gas Escape game is currently in development. 
                    Check back soon to learn about gas fees and transaction prioritization!
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="staking-wars">
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Coming Soon</h3>
                  <p className="text-gray-400 max-w-md">
                    The Staking Wars game is currently in development. 
                    Check back soon to learn about Proof of Stake and validator economics!
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rug-game">
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Coming Soon</h3>
                  <p className="text-gray-400 max-w-md">
                    The Rug Game is currently in development. 
                    Check back soon to learn about security threats and how to identify scams!
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}