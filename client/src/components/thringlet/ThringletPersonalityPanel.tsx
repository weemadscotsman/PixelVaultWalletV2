import React, { useState } from 'react';
import { useThringletPersonality } from '@/hooks/use-thringlet-personality';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, Brain, Zap, BarChart2, Lock, Coins, Shuffle, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

type ThringletPersonalityPanelProps = {
  thringletId: string;
};

export function ThringletPersonalityPanel({ thringletId }: ThringletPersonalityPanelProps) {
  const [userInput, setUserInput] = useState('');
  const {
    personality,
    isLoadingPersonality,
    updatePersonality,
    isUpdatingPersonality,
    personalizedResponse,
    getPersonalizedResponse,
    isGettingResponse,
    getTraitColor,
    getAffinityColor,
  } = useThringletPersonality(thringletId);

  if (isLoadingPersonality) {
    return (
      <Card className="p-4 shadow-md bg-zinc-900/50 border-zinc-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-full rounded-md" />
          </div>
        </div>
      </Card>
    );
  }

  if (!personality) {
    return (
      <Card className="p-4 shadow-md bg-zinc-900/50 border-zinc-700">
        <div className="text-center">
          <p className="text-zinc-400">No personality data available</p>
          <Button 
            variant="outline" 
            onClick={() => updatePersonality(thringletId)}
            className="mt-2"
            disabled={isUpdatingPersonality}
          >
            {isUpdatingPersonality ? 'Generating...' : 'Generate Personality'}
          </Button>
        </div>
      </Card>
    );
  }

  const handleInteract = () => {
    if (userInput.trim()) {
      getPersonalizedResponse(thringletId, userInput);
    }
  };

  return (
    <Card className="p-4 shadow-md bg-zinc-900/50 border-zinc-700">
      <Tabs defaultValue="traits" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3 w-auto">
            <TabsTrigger value="traits" className="text-xs">
              <Brain className="w-3 h-3 mr-1" /> Traits
            </TabsTrigger>
            <TabsTrigger value="affinities" className="text-xs">
              <BarChart2 className="w-3 h-3 mr-1" /> Affinities
            </TabsTrigger>
            <TabsTrigger value="interact" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" /> Interact
            </TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updatePersonality(thringletId)}
            disabled={isUpdatingPersonality}
            className="text-xs"
          >
            <Shuffle className="w-3 h-3 mr-1" />
            {isUpdatingPersonality ? 'Updating...' : 'Update'}
          </Button>
        </div>
        
        {/* Traits Tab */}
        <TabsContent value="traits" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Dominant Trait</h3>
              <Badge className={`${getTraitColor(personality.dominantTrait)} text-white`}>
                {personality.dominantTrait}
              </Badge>
            </div>
            
            <h3 className="text-sm font-medium mt-4 mb-2">Personality Traits</h3>
            <div className="space-y-2">
              {Object.entries(personality.traitIntensity).map(([trait, intensity]) => (
                <div key={trait} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">{trait}</span>
                    <span className="text-zinc-300">{intensity}%</span>
                  </div>
                  <Progress value={intensity} max={100} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        {/* Affinities Tab */}
        <TabsContent value="affinities" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Dominant Affinity</h3>
              <Badge className={`${getAffinityColor(personality.dominantAffinity)} text-white`}>
                {personality.dominantAffinity}
              </Badge>
            </div>
            
            <h3 className="text-sm font-medium mt-4 mb-2">Blockchain Affinities</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {personality.blockchainAffinities.map(affinity => (
                <Badge key={affinity} className={`${getAffinityColor(affinity)} text-white`}>
                  {affinity}
                </Badge>
              ))}
            </div>
            
            <h3 className="text-sm font-medium mt-4 mb-2">Activity Influences</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-md">
                <Zap className="w-4 h-4 text-amber-500" />
                <div className="flex-1">
                  <p className="text-xs">Mining</p>
                  <Progress 
                    value={personality.miningInfluence + 100} 
                    max={200} 
                    className="h-1.5" 
                  />
                </div>
                <span className="text-xs font-mono">{personality.miningInfluence}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-md">
                <Lock className="w-4 h-4 text-teal-500" />
                <div className="flex-1">
                  <p className="text-xs">Staking</p>
                  <Progress 
                    value={personality.stakingInfluence + 100} 
                    max={200} 
                    className="h-1.5" 
                  />
                </div>
                <span className="text-xs font-mono">{personality.stakingInfluence}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-md">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <div className="flex-1">
                  <p className="text-xs">Trading</p>
                  <Progress 
                    value={personality.tradingInfluence + 100} 
                    max={200} 
                    className="h-1.5" 
                  />
                </div>
                <span className="text-xs font-mono">{personality.tradingInfluence}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-md">
                <Coins className="w-4 h-4 text-purple-500" />
                <div className="flex-1">
                  <p className="text-xs">Governance</p>
                  <Progress 
                    value={personality.governanceInfluence + 100} 
                    max={200} 
                    className="h-1.5" 
                  />
                </div>
                <span className="text-xs font-mono">{personality.governanceInfluence}</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Interact Tab */}
        <TabsContent value="interact" className="space-y-4">
          <div>
            <Textarea
              placeholder="Ask your Thringlet something or mention a blockchain activity..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="h-20 resize-none"
            />
            
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleInteract} 
                disabled={isGettingResponse || !userInput.trim()}
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {isGettingResponse ? 'Thinking...' : 'Interact'}
              </Button>
            </div>
            
            {personalizedResponse && (
              <div className="mt-4 p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getTraitColor(personality.dominantTrait)} text-white text-xs`}>
                    {personality.dominantTrait}
                  </Badge>
                  <Badge className={`${getAffinityColor(personality.dominantAffinity)} text-white text-xs`}>
                    {personality.dominantAffinity}
                  </Badge>
                </div>
                <p className="text-zinc-300 text-sm">{personalizedResponse}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}