import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Heart, 
  Sparkles,
  Shield,
  Zap,
  Flame,
  Brain,
  Star,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Example thringlets data
const thringletsData = {
  owned: 3,
  rarity: {
    common: 1,
    rare: 1,
    legendary: 1
  },
  emotions: {
    joyful: 2,
    curious: 1
  },
  thringlets: [
    { 
      id: 'thr-001',
      name: 'Nebula',
      rarity: 'Legendary',
      emotion: 'Curious',
      powerLevel: 92,
      abilities: ['Encryption Boost', 'Hash Mining'],
      appearance: {
        color: 'bg-gradient-to-r from-purple-500 to-blue-500',
        icon: <Sparkles className="h-8 w-8" />
      },
      bondLevel: 78,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    { 
      id: 'thr-002',
      name: 'Flare',
      rarity: 'Rare',
      emotion: 'Joyful',
      powerLevel: 76,
      abilities: ['Transaction Boost', 'Market Analysis'],
      appearance: {
        color: 'bg-gradient-to-r from-red-500 to-orange-500',
        icon: <Flame className="h-8 w-8" />
      },
      bondLevel: 65,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 12)
    },
    { 
      id: 'thr-003',
      name: 'Byte',
      rarity: 'Common',
      emotion: 'Joyful',
      powerLevel: 63,
      abilities: ['Data Analysis', 'Minor Encryption'],
      appearance: {
        color: 'bg-gradient-to-r from-blue-500 to-green-500',
        icon: <Brain className="h-8 w-8" />
      },
      bondLevel: 42,
      lastInteraction: new Date(Date.now() - 1000 * 60 * 60 * 18)
    }
  ]
};

export default function ThringletsPage() {
  const [selectedThringlet, setSelectedThringlet] = useState(thringletsData.thringlets[0]);
  
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
  
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
      case 'rare':
        return 'bg-purple-500/20 text-purple-300 border-purple-600/30';
      case 'common':
        return 'bg-blue-500/20 text-blue-300 border-blue-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    }
  };
  
  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'joyful':
        return 'bg-green-500/20 text-green-300 border-green-600/30';
      case 'curious':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Heart className="inline-block mr-2 h-6 w-6" /> 
            Thringlet Collection
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <CardTitle className="text-blue-300">Your Thringlets</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {thringletsData.thringlets.map((thringlet) => (
                    <div 
                      key={thringlet.id} 
                      className={`p-4 rounded border border-blue-900/30 cursor-pointer transition-all hover:border-blue-400/50 ${selectedThringlet.id === thringlet.id ? 'bg-blue-950/30 border-blue-400/70' : 'bg-gray-900/30'}`}
                      onClick={() => setSelectedThringlet(thringlet)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${thringlet.appearance.color} h-12 w-12 rounded-xl flex items-center justify-center text-white`}>
                          {thringlet.appearance.icon}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-300">{thringlet.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className={getRarityColor(thringlet.rarity)}>
                              {thringlet.rarity}
                            </Badge>
                            <Badge variant="outline" className={getEmotionColor(thringlet.emotion)}>
                              {thringlet.emotion}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                <Button className="w-full bg-blue-700 hover:bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Get New Thringlet
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card className="bg-black/70 border-blue-900/50 h-full">
              <CardHeader className={`${selectedThringlet.appearance.color} border-b border-blue-900/30`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-white/70">Thringlet Details</p>
                    <CardTitle className="text-white flex items-center">
                      {selectedThringlet.name}
                      <Star className="h-4 w-4 ml-2 text-yellow-300 fill-yellow-300" />
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-black/30 text-white border-white/20">
                      ID: {selectedThringlet.id}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Power Level</p>
                        <p className="text-2xl font-bold text-blue-300">{selectedThringlet.powerLevel}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-400">Last Interaction</p>
                        <p className="text-sm text-gray-300">{formatTimeAgo(selectedThringlet.lastInteraction)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm text-gray-400">Bond Level</p>
                        <p className="text-sm text-blue-300">{selectedThringlet.bondLevel}%</p>
                      </div>
                      <Progress value={selectedThringlet.bondLevel} className="h-2" />
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Abilities</p>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedThringlet.abilities.map((ability, index) => (
                          <div key={index} className="bg-blue-950/20 p-3 rounded border border-blue-900/30 flex items-center gap-2">
                            {index === 0 ? (
                              <Shield className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Zap className="h-4 w-4 text-blue-400" />
                            )}
                            <p className="text-sm text-gray-300">{ability}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="bg-gray-900/30 p-4 rounded border border-blue-900/30 mb-4">
                      <p className="text-sm text-gray-400 mb-2">Rarity & Emotion</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded ${getRarityColor(selectedThringlet.rarity)}`}>
                          <p className="text-xs opacity-70">Rarity</p>
                          <p className="text-lg font-bold">{selectedThringlet.rarity}</p>
                        </div>
                        <div className={`p-3 rounded ${getEmotionColor(selectedThringlet.emotion)}`}>
                          <p className="text-xs opacity-70">Emotion</p>
                          <p className="text-lg font-bold">{selectedThringlet.emotion}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-950/20 p-4 rounded border border-blue-900/30 flex-1">
                      <p className="text-sm text-gray-400 mb-3">Thringlet Visualization</p>
                      <div className={`${selectedThringlet.appearance.color} rounded-xl h-40 w-full flex items-center justify-center text-white shadow-lg`}>
                        <div className="text-8xl">
                          {selectedThringlet.appearance.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4">
                <div className="w-full grid grid-cols-3 gap-4">
                  <Button variant="outline" className="border-blue-900/50 text-blue-300">
                    Feed
                  </Button>
                  <Button variant="outline" className="border-blue-900/50 text-blue-300">
                    Train
                  </Button>
                  <Button className="bg-blue-700 hover:bg-blue-600 text-white">
                    Interact
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}