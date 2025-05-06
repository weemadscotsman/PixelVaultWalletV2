import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HashlordGame } from './HashlordGame';
import { Cpu, BarChart2, Zap, Network, Shield, AlertTriangle } from 'lucide-react';
import { GameType } from '@/lib/game-engine';

export function LearningTerminal() {
  const [activeTab, setActiveTab] = useState<string>(GameType.HASHLORD);
  
  return (
    <Card className="bg-card/90 backdrop-blur-sm border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-shadow-neon flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              INTERACTIVE BLOCKCHAIN LEARNING
            </CardTitle>
            <CardDescription>
              Learn how blockchain works through immersive, playable simulations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 bg-background/60 border border-gray-800 mb-4">
            <TabsTrigger 
              value={GameType.HASHLORD} 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs"
            >
              <div className="flex flex-col items-center gap-1 py-1">
                <BarChart2 className="h-4 w-4" />
                <span>Hashlord</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value={GameType.GAS_ESCAPE} 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs"
            >
              <div className="flex flex-col items-center gap-1 py-1">
                <Zap className="h-4 w-4" />
                <span>Gas Escape</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value={GameType.STAKING_WARS} 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs"
              disabled
            >
              <div className="flex flex-col items-center gap-1 py-1">
                <Shield className="h-4 w-4" />
                <span>Staking Wars</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value={GameType.PACKET_PANIC} 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs"
              disabled
            >
              <div className="flex flex-col items-center gap-1 py-1">
                <Network className="h-4 w-4" />
                <span>Packet Panic</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value={GameType.RUG_GAME} 
              className="data-[state=active]:bg-primary-dark/30 data-[state=active]:text-primary-light data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs"
              disabled
            >
              <div className="flex flex-col items-center gap-1 py-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Rug Game</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={GameType.HASHLORD} className="mt-0">
            <HashlordGame />
          </TabsContent>
          
          <TabsContent value={GameType.GAS_ESCAPE} className="mt-0">
            <Card className="border-gray-800 bg-background/70 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-800 pb-3">
                <CardTitle className="text-shadow-neon flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>GAS ESCAPE</span>
                </CardTitle>
                <CardDescription>Transaction Fee Simulator · Coming Soon</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 pb-8">
                <div className="text-center py-12 space-y-4">
                  <div className="font-mono text-primary-light text-xl">GAME UNDER DEVELOPMENT</div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This simulation will teach you how gas fees work in blockchain networks
                    by dodging spikes and mining blocks to get your transaction through.
                  </p>
                  <div className="text-xs text-muted-foreground/60 mt-8">
                    Check back soon - this feature is being deployed in the next update
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value={GameType.STAKING_WARS} className="mt-0">
            <Card className="border-gray-800 bg-background/70 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-800 pb-3">
                <CardTitle className="text-shadow-neon flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>STAKING WARS</span>
                </CardTitle>
                <CardDescription>Validator Simulation · Coming Soon</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 pb-8">
                <div className="text-center py-12 space-y-4">
                  <div className="font-mono text-primary-light text-xl">GAME UNDER DEVELOPMENT</div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This simulation will teach you how Proof-of-Stake governance works
                    by competing with other validators to participate in blockchain consensus.
                  </p>
                  <div className="text-xs text-muted-foreground/60 mt-8">
                    Check back soon - this feature is being deployed in the next update
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value={GameType.PACKET_PANIC} className="mt-0">
            <Card className="border-gray-800 bg-background/70 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-800 pb-3">
                <CardTitle className="text-shadow-neon flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  <span>PACKET PANIC</span>
                </CardTitle>
                <CardDescription>Network Mempool Simulation · Coming Soon</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 pb-8">
                <div className="text-center py-12 space-y-4">
                  <div className="font-mono text-primary-light text-xl">GAME UNDER DEVELOPMENT</div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This simulation will teach you how blockchain networks process transactions
                    by routing through congested nodes during high network activity.
                  </p>
                  <div className="text-xs text-muted-foreground/60 mt-8">
                    Check back soon - this feature is being deployed in the next update
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value={GameType.RUG_GAME} className="mt-0">
            <Card className="border-gray-800 bg-background/70 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-800 pb-3">
                <CardTitle className="text-shadow-neon flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <span>THE RUG GAME</span>
                </CardTitle>
                <CardDescription>Wallet Security Simulator · Coming Soon</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 pb-8">
                <div className="text-center py-12 space-y-4">
                  <div className="font-mono text-primary-light text-xl">GAME UNDER DEVELOPMENT</div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This simulation will teach you how to avoid malicious smart contracts
                    by identifying red flags in suspicious airdrops and contract interactions.
                  </p>
                  <div className="text-xs text-muted-foreground/60 mt-8">
                    Check back soon - this feature is being deployed in the next update
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-xs text-center text-muted-foreground/60 mt-4 italic">
          You learn by playing. You retain by surviving. You remember because it was fun AND terrifying.
        </div>
      </CardContent>
    </Card>
  );
}