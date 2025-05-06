import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import BadgeGrid from '@/components/badges/BadgeGrid';
import { BadgeData, UserBadge } from '@/components/badges/BadgeGrid';
import { Info, Award, ShieldCheck, Trophy, Cpu, Rocket, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function BadgesPage() {
  const { user } = useAuth();
  const userId = user?.id || undefined;
  
  const badgeCategories = [
    { id: 'achievements', name: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
    { id: 'mining', name: 'Mining', icon: <Cpu className="w-4 h-4" /> },
    { id: 'governance', name: 'Governance', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'staking', name: 'Staking', icon: <Award className="w-4 h-4" /> },
    { id: 'thringlets', name: 'Thringlets', icon: <Rocket className="w-4 h-4" /> },
    { id: 'community', name: 'Community', icon: <Users className="w-4 h-4" /> },
    { id: 'security', name: 'Security', icon: <ShieldCheck className="w-4 h-4" /> }
  ];
  
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | UserBadge | null>(null);
  const [showBadgeDetails, setShowBadgeDetails] = useState(false);
  const [badgeStats, setBadgeStats] = useState({
    total: 0,
    earned: 0,
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  });
  
  useEffect(() => {
    // Get badge stats - in a real app this would be an API call
    setTimeout(() => {
      setBadgeStats({
        total: 12,
        earned: 3,
        common: 1,
        uncommon: 1,
        rare: 0,
        epic: 0,
        legendary: 1
      });
    }, 500);
  }, [userId]);
  
  const handleBadgeClick = (badge: BadgeData | UserBadge) => {
    setSelectedBadge(badge);
    setShowBadgeDetails(true);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Badges Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Badge Stats */}
          <Card className="bg-black/80 border-blue-900/40 shadow-blue-900/10 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-400 font-bold text-shadow-neon flex items-center gap-2">
                <Award className="w-5 h-5" />
                Badge Collection
              </CardTitle>
              <CardDescription>Your achievements and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                <div className="flex items-center gap-3">
                  <ProgressCircle 
                    value={badgeStats.total > 0 ? (badgeStats.earned / badgeStats.total) * 100 : 0} 
                    size="lg" 
                    className="text-blue-500"
                    strokeWidth={8}
                  >
                    <span className="text-lg font-bold">
                      {badgeStats.total > 0 ? Math.round((badgeStats.earned / badgeStats.total) * 100) : 0}%
                    </span>
                  </ProgressCircle>
                  <div>
                    <p className="text-sm text-muted-foreground">Collected</p>
                    <p className="text-xl font-bold">
                      {badgeStats.earned} <span className="text-sm text-muted-foreground">/ {badgeStats.total}</span>
                    </p>
                  </div>
                </div>
                
                <div className="col-span-2 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="px-2 py-1 border-gray-500 bg-gray-900/50 text-gray-300">
                      {badgeStats.common}
                    </Badge>
                    <span className="text-xs mt-1 text-gray-400">Common</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="px-2 py-1 border-green-600 bg-green-900/30 text-green-400">
                      {badgeStats.uncommon}
                    </Badge>
                    <span className="text-xs mt-1 text-gray-400">Uncommon</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="px-2 py-1 border-blue-600 bg-blue-900/30 text-blue-400">
                      {badgeStats.rare}
                    </Badge>
                    <span className="text-xs mt-1 text-gray-400">Rare</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="px-2 py-1 border-purple-600 bg-purple-900/30 text-purple-400">
                      {badgeStats.epic}
                    </Badge>
                    <span className="text-xs mt-1 text-gray-400">Epic</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Badge variant="outline" className="px-2 py-1 border-orange-500 bg-orange-900/30 text-orange-400">
                      {badgeStats.legendary}
                    </Badge>
                    <span className="text-xs mt-1 text-gray-400">Legendary</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Featured Badges */}
          <Card className="bg-black/80 border-blue-900/40 shadow-blue-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-400 font-bold text-shadow-neon flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Featured Badges
              </CardTitle>
              <CardDescription>Your showcase</CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeGrid
                title=""
                description=""
                userId={userId}
                featuredOnly={true}
                size="sm"
                maxBadgesToShow={4}
                onBadgeClick={handleBadgeClick}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Badge Categories */}
        <Tabs defaultValue="achievements" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5" />
              Badge Categories
            </h3>
            <TabsList className="bg-blue-950/30">
              {badgeCategories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300"
                >
                  <span className="flex items-center gap-1.5">
                    {category.icon}
                    <span className="hidden sm:inline">{category.name}</span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {badgeCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <BadgeGrid
                title={`${category.name} Badges`}
                description={`Badges earned through ${category.name.toLowerCase()} activities`}
                category={category.id}
                showLocked={true}
                onBadgeClick={handleBadgeClick}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Badge Details Dialog */}
      <Dialog open={showBadgeDetails} onOpenChange={setShowBadgeDetails}>
        <DialogContent className="bg-black/95 border-blue-900/40 text-blue-100">
          <DialogHeader>
            <DialogTitle className="text-blue-400 font-bold text-center text-xl">
              Badge Details
            </DialogTitle>
            <DialogDescription className="text-center text-blue-300/70">
              Information and requirements
            </DialogDescription>
          </DialogHeader>
          
          {selectedBadge && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24">
                  <img 
                    src={(selectedBadge as any).image_url || (selectedBadge as any).badge?.image_url} 
                    alt={(selectedBadge as any).name || (selectedBadge as any).badge?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center
                    ${(selectedBadge as any).rarity === 'common' || (selectedBadge as any).badge?.rarity === 'common' ? 'bg-gray-600' :
                    (selectedBadge as any).rarity === 'uncommon' || (selectedBadge as any).badge?.rarity === 'uncommon' ? 'bg-green-600' :
                    (selectedBadge as any).rarity === 'rare' || (selectedBadge as any).badge?.rarity === 'rare' ? 'bg-blue-600' :
                    (selectedBadge as any).rarity === 'epic' || (selectedBadge as any).badge?.rarity === 'epic' ? 'bg-purple-600' :
                    'bg-orange-500'}`}
                  >
                    <span className="text-xs font-bold text-white">
                      {(selectedBadge as any).rarity?.charAt(0).toUpperCase() || (selectedBadge as any).badge?.rarity?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    {(selectedBadge as any).name || (selectedBadge as any).badge?.name}
                  </h3>
                  <p className="text-sm text-blue-300/70 capitalize">
                    {(selectedBadge as any).rarity || (selectedBadge as any).badge?.rarity} Badge
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 bg-blue-950/20 p-4 rounded-md">
                <div>
                  <h4 className="text-sm font-medium text-blue-400">Description</h4>
                  <p className="text-sm mt-1">
                    {(selectedBadge as any).description || (selectedBadge as any).badge?.description}
                  </p>
                </div>
                
                {(selectedBadge as UserBadge)?.awarded_reason && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">How You Earned It</h4>
                    <p className="text-sm mt-1 text-green-400">
                      {(selectedBadge as UserBadge).awarded_reason}
                    </p>
                  </div>
                )}
                
                {(selectedBadge as BadgeData)?.requirements_json && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">Requirements</h4>
                    <div className="text-sm mt-1 space-y-1">
                      {Object.entries(JSON.parse((selectedBadge as BadgeData).requirements_json!)).map(([key, value]) => (
                        <p key={key} className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-400" />
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>: <span className="font-medium">{value}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-blue-400">Category</h4>
                  <p className="text-sm mt-1 capitalize">
                    {(selectedBadge as any).category || (selectedBadge as any).badge?.category}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-blue-400">Date Added</h4>
                  <p className="text-sm mt-1">
                    {new Date((selectedBadge as any).created_at || (selectedBadge as any).badge?.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {(selectedBadge as UserBadge)?.awarded_at && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">Date Earned</h4>
                    <p className="text-sm mt-1">
                      {new Date((selectedBadge as UserBadge).awarded_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setShowBadgeDetails(false)} 
                  variant="outline" 
                  className="border-blue-900/60 text-blue-400 hover:bg-blue-900/20"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}