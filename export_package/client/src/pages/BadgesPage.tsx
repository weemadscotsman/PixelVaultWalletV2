import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Award, Filter, Search, Loader2, Shield, Zap, Share2, Heart, Vote, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, BadgeType, BadgeRarity } from '@shared/types';
import { useBadges } from '@/hooks/use-badges';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useWallet } from '@/hooks/use-wallet';

// Badge type to icon mapping
const badgeTypeIcons: Record<BadgeType, React.ReactNode> = {
  [BadgeType.TRANSACTION]: <Shield className="h-4 w-4" />,
  [BadgeType.MINING]: <Zap className="h-4 w-4" />,
  [BadgeType.STAKING]: <Share2 className="h-4 w-4" />,
  [BadgeType.GOVERNANCE]: <Vote className="h-4 w-4" />,
  [BadgeType.THRINGLET]: <Heart className="h-4 w-4" />,
  [BadgeType.SPECIAL]: <Crown className="h-4 w-4" />
};

// Badge rarity to color mapping
const rarityColors: Record<BadgeRarity, string> = {
  [BadgeRarity.COMMON]: 'border-gray-600 bg-gray-900/60',
  [BadgeRarity.UNCOMMON]: 'border-green-600 bg-green-900/30',
  [BadgeRarity.RARE]: 'border-blue-600 bg-blue-900/30',
  [BadgeRarity.EPIC]: 'border-purple-600 bg-purple-900/30',
  [BadgeRarity.LEGENDARY]: 'border-yellow-600 bg-yellow-900/30',
  [BadgeRarity.MYTHIC]: 'border-pink-600 bg-pink-900/30'
};

// Badge rarity to animation class mapping
const rarityAnimations: Record<BadgeRarity, string> = {
  [BadgeRarity.COMMON]: '',
  [BadgeRarity.UNCOMMON]: 'badge-pulse-slow',
  [BadgeRarity.RARE]: 'badge-pulse-medium',
  [BadgeRarity.EPIC]: 'badge-pulse-fast',
  [BadgeRarity.LEGENDARY]: 'badge-glow',
  [BadgeRarity.MYTHIC]: 'badge-mythic-pulse'
};

// Badge component
const BadgeCard: React.FC<{ badge: Badge & { earnedAt?: number; progress?: number } }> = ({ badge }) => {
  const earned = !!badge.earnedAt;
  const isLocked = !earned && !badge.secret;
  const isSecret = !earned && badge.secret;
  
  return (
    <div 
      className={`relative p-4 rounded-lg ${rarityColors[badge.rarity]} border ${earned ? 'border-opacity-100' : 'border-opacity-30'} ${earned ? rarityAnimations[badge.rarity] : ''}`}
    >
      {isLocked && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-400">Locked Badge</p>
            <p className="text-xs text-gray-500 mt-1">{badge.requirement}</p>
          </div>
        </div>
      )}
      
      {isSecret && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-2">
              <Award className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-400">Secret Badge</p>
            <p className="text-xs text-gray-500 mt-1">Keep participating to discover secret achievements</p>
          </div>
        </div>
      )}
      
      <div className={`${(isLocked || isSecret) ? 'opacity-10' : 'opacity-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border border-current">
            {badgeTypeIcons[badge.type]}
          </div>
          <div className="px-2 py-1 rounded text-xs font-medium" style={{ 
            backgroundColor: `var(--${badge.rarity}-badge-bg)`,
            color: `var(--${badge.rarity}-badge-text)` 
          }}>
            {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
          </div>
        </div>
        
        <h3 className="text-sm font-bold mb-1">{badge.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{badge.description}</p>
        
        {earned && (
          <div className="text-xs text-gray-500">
            Earned {new Date(badge.earnedAt!).toLocaleDateString()}
          </div>
        )}
        
        {badge.progress !== undefined && badge.progress < 100 && (
          <div className="mt-2">
            <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-current transition-all duration-500"
                style={{ width: `${badge.progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">{badge.progress}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function BadgesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<BadgeType | 'all'>('all');
  const { activeWallet, wallet } = useWallet();
  
  // Get badges data
  const { 
    getUserBadges,
    getAllBadges,
    isLoading 
  } = useBadges();
  
  // Use wallet address from activeWallet if available
  const walletAddress = wallet?.address || activeWallet || '';
  const { data: userBadges = [] } = getUserBadges(walletAddress);
  const { data: allBadges = [] } = getAllBadges();
  
  // Combine user badges with all badges
  const combinedBadges = allBadges.map(badge => {
    const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
    return {
      ...badge,
      earnedAt: userBadge?.earnedAt,
      progress: userBadge?.progress
    };
  });
  
  // Filter badges based on search and type
  const filteredBadges = combinedBadges.filter(badge => {
    const matchesSearch = 
      searchQuery === '' || 
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || badge.type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Sort badges: earned first, then by rarity
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    // First sort by earned status
    if (a.earnedAt && !b.earnedAt) return -1;
    if (!a.earnedAt && b.earnedAt) return 1;
    
    // Then sort by rarity (using the order in the enum)
    const rarityOrder = Object.values(BadgeRarity);
    const aRarityIndex = rarityOrder.indexOf(a.rarity);
    const bRarityIndex = rarityOrder.indexOf(b.rarity);
    
    return bRarityIndex - aRarityIndex; // Higher rarity first
  });
  
  // Calculate badge stats
  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;
  const progress = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
  
  // Type options for the filter
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: BadgeType.TRANSACTION, label: 'Transaction' },
    { value: BadgeType.MINING, label: 'Mining' },
    { value: BadgeType.STAKING, label: 'Staking' },
    { value: BadgeType.GOVERNANCE, label: 'Governance' },
    { value: BadgeType.THRINGLET, label: 'Thringlet' },
    { value: BadgeType.SPECIAL, label: 'Special' }
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 text-shadow-neon">
            <Award className="inline-block mr-2 h-6 w-6" /> 
            Achievement Badges
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/70 border-blue-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-950/30 p-2 rounded-full">
                  <Award className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Badges Earned</p>
                  {isLoading ? (
                    <p className="text-xl font-bold text-blue-300"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading...</p>
                  ) : (
                    <p className="text-xl font-bold text-blue-300">{earnedCount} / {totalCount}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-900/50 md:col-span-2">
            <CardContent className="p-4">
              <div className="w-full bg-gray-900/50 h-4 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-700 to-blue-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">Achievement Progress</p>
                <p className="text-xs text-blue-400">{progress}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-black/70 border border-blue-900/50 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search badges..."
                className="pl-9 bg-gray-900/30 border-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <Tabs defaultValue="all" value={selectedType} onValueChange={(value) => setSelectedType(value as BadgeType | 'all')}>
                <TabsList className="bg-gray-900/30">
                  {typeOptions.map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.value !== 'all' && (
                        <span className="mr-1">{badgeTypeIcons[option.value as BadgeType]}</span>
                      )}
                      <span className="hidden sm:inline">{option.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : sortedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Award className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No badges found</p>
              {searchQuery && (
                <p className="text-gray-600 text-sm mt-1">Try a different search term</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}