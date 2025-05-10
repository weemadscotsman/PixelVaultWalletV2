import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { HashlordGame } from '@/components/learning/HashlordGame';
import { GasEscapeGame } from '@/components/learning/GasEscapeGame';
import { GraduationCap, Zap, Fuel, Wallet } from 'lucide-react';

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState('hashlord');
  
  return (
    <PageLayout isConnected={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-300 text-shadow-neon">Learning Lab</h1>
          <div className="flex items-center gap-2 bg-blue-900/20 px-3 py-1 rounded border border-blue-900/50">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Learning Mode: Active</span>
          </div>
        </div>
        
        <Card className="bg-black/70 border-blue-900/50 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6 bg-blue-950/30">
              <TabsTrigger value="hashlord" className="data-[state=active]:bg-blue-900/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Hashlord Game</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="gasescape" className="data-[state=active]:bg-blue-900/30">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  <span>Gas Escape</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="stakingwars" className="data-[state=active]:bg-blue-900/30">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <span>Staking Wars</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hashlord">
              <HashlordGame 
                onComplete={(score, difficulty) => {
                  console.log(`Completed with score: ${score} at difficulty: ${difficulty}`);
                }}
                walletAddress="0x7f5c764cbc14f9669b88837ca1490cca17c31607"
              />
            </TabsContent>
            
            <TabsContent value="gasescape">
              <GasEscapeGame />
            </TabsContent>
            
            <TabsContent value="stakingwars">
              <div className="flex flex-col items-center justify-center h-64">
                <Wallet className="w-16 h-16 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-blue-300">Staking Wars Game</h3>
                <p className="text-gray-400 max-w-md text-center mt-2">
                  Coming soon! Compete with others to earn the most rewards by optimizing your staking strategy.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </PageLayout>
  );
}