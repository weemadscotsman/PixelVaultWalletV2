import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Droplets, 
  Gift,
  Clock,
  Lock,
  Sparkles,
  QrCode,
  Shield,
  Skull,
  Zap,
  SearchIcon,
  CheckCircle,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Example drops data
const dropsData = {
  available: 2,
  totalClaimed: 5,
  claimRate: 87,
  securityLevel: 'High',
  activeDrops: [
    { 
      id: 'pvx-matrix-001',
      name: 'Matrix Pill',
      rarity: 'Rare',
      securityScore: 86,
      type: 'NFT',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      claimCode: 'MTRX-9321',
      description: 'A rare Matrix-themed digital collectible. Grants access to exclusive Matrix-themed content in the PVX ecosystem.',
      rewards: ['500 μPVX', 'Matrix Pill NFT', 'Access to Neo\'s Terminal'],
      claimable: true,
      image: 'bg-gradient-to-r from-green-500 to-emerald-700'
    },
    { 
      id: 'pvx-quantum-002',
      name: 'Quantum Key',
      rarity: 'Epic',
      securityScore: 92,
      type: 'Utility',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      claimCode: 'QNTM-7532',
      description: 'An epic utility item that provides enhanced encryption capabilities for your PVX transactions.',
      rewards: ['1000 μPVX', 'Quantum Key Utility', '2x Staking Power (7 days)'],
      claimable: true,
      image: 'bg-gradient-to-r from-purple-600 to-blue-500'
    }
  ],
  upcomingDrops: [
    { 
      id: 'pvx-cyber-003',
      name: 'Cyber Implant',
      rarity: 'Legendary',
      releaseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8),
      teaser: 'Enhance your digital capabilities with this legendary cyber implant.',
      type: 'Hybrid',
      image: 'bg-gradient-to-r from-red-500 to-orange-500'
    }
  ],
  claimedDrops: [
    { 
      id: 'pvx-genesis-000',
      name: 'Genesis Seed',
      rarity: 'Legendary',
      dateClaimed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      type: 'Foundational',
      rewards: ['5000 μPVX', 'Genesis Seed NFT', 'Early Adopter Badge'],
      image: 'bg-gradient-to-r from-yellow-400 to-amber-600'
    },
    { 
      id: 'pvx-glitch-001',
      name: 'Glitch Fragment',
      rarity: 'Epic',
      dateClaimed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      type: 'NFT',
      rewards: ['750 μPVX', 'Glitch Fragment NFT', 'Animated PFP Border'],
      image: 'bg-gradient-to-r from-indigo-500 to-purple-500'
    }
  ]
};

export default function DropsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'claimed'>('active');
  const [selectedDrop, setSelectedDrop] = useState(dropsData.activeDrops[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Expired';
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30';
      case 'epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-600/30';
      case 'rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-600/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-600/30';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'nft':
        return <Sparkles className="h-4 w-4" />;
      case 'utility':
        return <Zap className="h-4 w-4" />;
      case 'hybrid':
        return <Shield className="h-4 w-4" />;
      case 'foundational':
        return <Skull className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Droplets className="inline-block mr-2 h-6 w-6" /> 
            Secret Drops
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search drops..." 
                className="pl-9 bg-gray-900/50 border-blue-900/40 w-52 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white h-9 px-4 flex items-center gap-2 shadow-md"
              size="sm"
            >
              <Gift className="h-4 w-4" />
              <span>Claim Drop</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <Card className="bg-black/70 border-blue-900/50">
              <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                <div className="flex flex-col gap-3">
                  <CardTitle className="text-blue-300">Available Drops</CardTitle>
                  <div className="flex h-8 items-center justify-center rounded-md bg-blue-900/20 p-0.5 text-blue-300 w-full">
                    <button
                      className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        activeTab === 'active' 
                          ? 'bg-blue-800 text-white shadow-sm' 
                          : 'text-blue-300 hover:bg-blue-800/20'
                      }`}
                      onClick={() => setActiveTab('active')}
                    >
                      <Gift className="mr-1.5 h-3 w-3" />
                      Active
                    </button>
                    <button
                      className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        activeTab === 'upcoming' 
                          ? 'bg-blue-800 text-white shadow-sm' 
                          : 'text-blue-300 hover:bg-blue-800/20'
                      }`}
                      onClick={() => setActiveTab('upcoming')}
                    >
                      <Clock className="mr-1.5 h-3 w-3" />
                      Upcoming
                    </button>
                    <button
                      className={`flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        activeTab === 'claimed' 
                          ? 'bg-blue-800 text-white shadow-sm' 
                          : 'text-blue-300 hover:bg-blue-800/20'
                      }`}
                      onClick={() => setActiveTab('claimed')}
                    >
                      <CheckCircle className="mr-1.5 h-3 w-3" />
                      Claimed
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {activeTab === 'active' && dropsData.activeDrops.map((drop) => (
                    <div 
                      key={drop.id} 
                      className={`p-4 rounded border cursor-pointer transition-all hover:border-blue-400/50 ${selectedDrop.id === drop.id ? 'bg-blue-950/30 border-blue-400/70' : 'bg-gray-900/30 border-blue-900/30'}`}
                      onClick={() => setSelectedDrop(drop)}
                    >
                      <div className="flex gap-4">
                        <div className={`${drop.image} h-14 w-14 rounded-lg flex items-center justify-center shadow-lg`}>
                          <Gift className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-blue-300">{drop.name}</p>
                            <Badge variant="outline" className={getRarityColor(drop.rarity)}>
                              {drop.rarity}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatTimeRemaining(drop.expiryDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeTab === 'upcoming' && dropsData.upcomingDrops.map((drop) => (
                    <div 
                      key={drop.id} 
                      className="p-4 rounded border border-blue-900/30 bg-gray-900/30"
                    >
                      <div className="flex gap-4">
                        <div className={`${drop.image} h-14 w-14 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Lock className="h-7 w-7 text-gray-300" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-blue-300">{drop.name}</p>
                            <Badge variant="outline" className={getRarityColor(drop.rarity)}>
                              {drop.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-1">{drop.teaser}</p>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Releases {formatDate(drop.releaseDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeTab === 'claimed' && dropsData.claimedDrops.map((drop) => (
                    <div 
                      key={drop.id} 
                      className="p-4 rounded border border-blue-900/30 bg-gray-900/30"
                    >
                      <div className="flex gap-4">
                        <div className={`${drop.image} h-14 w-14 rounded-lg flex items-center justify-center shadow-lg`}>
                          <Gift className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-blue-300">{drop.name}</p>
                            <Badge variant="outline" className={getRarityColor(drop.rarity)}>
                              {drop.rarity}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Claimed on {formatDate(drop.dateClaimed)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {activeTab === 'active' && selectedDrop && (
              <Card className="bg-black/70 border-blue-900/50 h-full">
                <CardHeader className={`${selectedDrop.image} border-b border-blue-900/30`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-white/70">Secret Drop Details</p>
                      <CardTitle className="text-white flex items-center">
                        {selectedDrop.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getRarityColor(selectedDrop.rarity)}>
                        {selectedDrop.rarity}
                      </Badge>
                      <Badge variant="outline" className="bg-black/30 text-white border-white/20">
                        {selectedDrop.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-400 mb-1">Security Score</p>
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-green-400 mr-2" />
                          <p className="text-xl font-bold text-green-400">{selectedDrop.securityScore}/100</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 mb-1">Expiry Date</p>
                        <div className="flex items-center justify-end">
                          <Clock className="h-5 w-5 text-blue-400 mr-2" />
                          <p className="text-lg font-semibold text-blue-300">{formatDate(selectedDrop.expiryDate)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-2">Drop Description</p>
                      <p className="text-gray-300 bg-gray-900/40 p-4 rounded border border-blue-900/30">
                        {selectedDrop.description}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 mb-3">Rewards</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {selectedDrop.rewards.map((reward, index) => (
                          <div key={index} className="bg-blue-950/20 p-3 rounded border border-blue-900/30 flex items-center">
                            <Gift className="h-5 w-5 text-blue-400 mr-2" />
                            <p className="text-sm text-blue-300">{reward}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-900/30 p-4 rounded border border-blue-900/30">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-gray-400">Claim Code</p>
                        <Badge variant="outline" className="bg-blue-800/30 text-blue-300 border-blue-700/30">
                          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                          <span>Verified</span>
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-blue-950/20 p-3 rounded-md border border-blue-900/30 flex items-center justify-between">
                          <p className="text-lg font-mono text-blue-300">{selectedDrop.claimCode}</p>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-blue-700/20">
                              <Copy className="h-4 w-4 text-blue-400" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-blue-700/20">
                              <QrCode className="h-4 w-4 text-blue-400" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Button 
                            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white h-10 w-full sm:w-auto px-6 flex items-center justify-center gap-2 shadow-md font-medium"
                          >
                            <Gift className="h-4 w-4" />
                            <span>Claim Drop</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'upcoming' && (
              <Card className="bg-black/70 border-blue-900/50 h-full flex flex-col items-center justify-center p-10">
                <Lock className="h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-blue-300 mb-2">Coming Soon</h3>
                <p className="text-gray-400 text-center mb-6 max-w-md">
                  Upcoming drops are locked until their release date. Check back later to claim these exclusive items.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                  {dropsData.upcomingDrops.map((drop) => (
                    <div key={drop.id} className="bg-gray-900/30 p-4 rounded border border-blue-900/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${drop.image} h-10 w-10 rounded-lg flex items-center justify-center relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-gray-300" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-blue-300">{drop.name}</p>
                          <Badge variant="outline" className={getRarityColor(drop.rarity)}>
                            {drop.rarity}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{drop.teaser}</p>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Releases {formatDate(drop.releaseDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {activeTab === 'claimed' && (
              <Card className="bg-black/70 border-blue-900/50 h-full">
                <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
                  <CardTitle className="text-blue-300">Previously Claimed Drops</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dropsData.claimedDrops.map((drop) => (
                      <div key={drop.id} className="bg-gray-900/30 p-4 rounded border border-blue-900/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${drop.image} h-12 w-12 rounded-lg flex items-center justify-center`}>
                            {getTypeIcon(drop.type)}
                          </div>
                          <div>
                            <p className="font-bold text-blue-300">{drop.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getRarityColor(drop.rarity)}>
                                {drop.rarity}
                              </Badge>
                              <span className="text-xs text-gray-400">Claimed on {formatDate(drop.dateClaimed)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Rewards Received</p>
                          <div className="grid grid-cols-1 gap-2">
                            {drop.rewards.map((reward, index) => (
                              <div key={index} className="bg-blue-950/20 p-2 rounded border border-blue-900/30 flex items-center">
                                <Gift className="h-4 w-4 text-blue-400 mr-2" />
                                <p className="text-xs text-blue-300">{reward}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}