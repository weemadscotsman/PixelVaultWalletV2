import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge, BadgeCategory } from '@shared/badges';
import { useBadges } from '@/hooks/use-badges';
import { BadgeGrid } from '@/components/badges/BadgeGrid';
import { Award, Search, Loader2 } from 'lucide-react';

// Category icon map
const categoryIcons: Record<string, React.ReactNode> = {
  'Blockchain': <Award className="h-4 w-4" />,
  'Wallet': <Award className="h-4 w-4" />,
  'Mining': <Award className="h-4 w-4" />,
  'Staking': <Award className="h-4 w-4" />,
  'Thringlet': <Award className="h-4 w-4" />,
  'System': <Award className="h-4 w-4" />
};

export default function BadgesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  
  // Get badges data
  const { 
    badges,
    completedBadges,
    badgesInProgress,
    totalExperience,
    userLevel,
    levelProgress
  } = useBadges();
  
  // Filter badges based on search and category
  const filteredBadges = badges.filter(badge => {
    const matchesSearch = 
      searchQuery === '' || 
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Category options for the filter
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Blockchain', label: 'Blockchain' },
    { value: 'Wallet', label: 'Wallet' },
    { value: 'Mining', label: 'Mining' },
    { value: 'Staking', label: 'Staking' },
    { value: 'Thringlet', label: 'Thringlet' },
    { value: 'System', label: 'System' }
  ];
  
  return (
    <PageLayout>
      <div className="container space-y-6 pt-6 pb-16">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-300 text-shadow-neon">
            <Award className="inline-block mr-2 h-7 w-7" /> 
            Achievement Badges
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/60 border-blue-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Badges Earned</p>
                  <p className="text-xl font-bold text-blue-300">
                    {completedBadges.length} / {badges.length}
                  </p>
                </div>
                <div className="bg-blue-950/30 p-3 rounded-full">
                  <Award className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/60 border-blue-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Experience Level</p>
                  <p className="text-xl font-bold text-purple-300">
                    {userLevel} <span className="text-sm text-gray-500">{totalExperience} XP</span>
                  </p>
                </div>
                <div className="bg-purple-950/30 p-3 rounded-full">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-3">
                <Progress value={levelProgress.percentage} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Level {userLevel}</span>
                  <span>{levelProgress.currentXp}/{levelProgress.requiredXp} XP</span>
                  <span>Level {userLevel + 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/60 border-blue-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">In Progress</p>
                  <p className="text-xl font-bold text-amber-300">
                    {badgesInProgress.length} Badges
                  </p>
                </div>
                <div className="bg-amber-950/30 p-3 rounded-full">
                  <Award className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-black/60 border border-blue-900/30 backdrop-blur-md rounded-lg p-4">
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
              <Tabs 
                defaultValue="all" 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value as BadgeCategory | 'all')}
              >
                <TabsList className="bg-gray-900/30">
                  {categoryOptions.map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.value !== 'all' && (
                        <span className="mr-1">{categoryIcons[option.value] || <Award className="h-4 w-4" />}</span>
                      )}
                      <span>{option.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {filteredBadges.length > 0 ? (
            <BadgeGrid 
              badges={filteredBadges} 
              showCategories 
              showRarities 
              badgeSize="lg" 
              showDetails
            />
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
    </PageLayout>
  );
}