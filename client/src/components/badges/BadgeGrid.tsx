import { useState, useMemo } from 'react';
import { AchievementBadge } from './AchievementBadge';
import { Badge, BadgeCategory, BadgeRarity } from '@shared/badges';
import { cn } from '@/lib/utils';

interface BadgeGridProps {
  badges: Badge[];
  className?: string;
  showDetails?: boolean;
  showCategories?: boolean;
  showRarities?: boolean;
  badgeSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BadgeGrid({
  badges,
  className,
  showDetails = false,
  showCategories = false,
  showRarities = false,
  badgeSize = 'md'
}: BadgeGridProps) {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
  const [activeRarity, setActiveRarity] = useState<BadgeRarity | 'all'>('all');
  
  // Get unique categories from badges
  const categories = useMemo(() => {
    const categorySet = new Set<BadgeCategory>();
    badges.forEach(badge => categorySet.add(badge.category));
    return Array.from(categorySet);
  }, [badges]);
  
  // Get unique rarities from badges
  const rarities = useMemo(() => {
    const raritySet = new Set<BadgeRarity>();
    badges.forEach(badge => raritySet.add(badge.rarity));
    return Array.from(raritySet);
  }, [badges]);
  
  // Filter badges based on selected category and rarity
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      const matchesCategory = activeCategory === 'all' || badge.category === activeCategory;
      const matchesRarity = activeRarity === 'all' || badge.rarity === activeRarity;
      return matchesCategory && matchesRarity;
    });
  }, [badges, activeCategory, activeRarity]);
  
  // Sort badges by completion status and rarity
  const sortedBadges = useMemo(() => {
    return [...filteredBadges].sort((a, b) => {
      // First sort by completion status
      if (a.completedAt && !b.completedAt) return -1;
      if (!a.completedAt && b.completedAt) return 1;
      
      // Next sort by rarity
      const rarityOrder = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
      const aRarityIndex = rarityOrder.indexOf(a.rarity);
      const bRarityIndex = rarityOrder.indexOf(b.rarity);
      
      return aRarityIndex - bRarityIndex;
    });
  }, [filteredBadges]);
  
  return (
    <div className={className}>
      {/* Filter options */}
      <div className="mb-4 space-y-3">
        {/* Category filters */}
        {showCategories && categories.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">Filter by Category:</p>
            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  "text-xs px-3 py-1 rounded-full transition-colors",
                  activeCategory === 'all' 
                    ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                    : "bg-gray-900/50 text-gray-400 border border-gray-800 hover:bg-gray-800/50"
                )}
                onClick={() => setActiveCategory('all')}
              >
                All Categories
              </button>
              
              {categories.map(category => (
                <button
                  key={category}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full transition-colors",
                    activeCategory === category 
                      ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                      : "bg-gray-900/50 text-gray-400 border border-gray-800 hover:bg-gray-800/50"
                  )}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Rarity filters */}
        {showRarities && rarities.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">Filter by Rarity:</p>
            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  "text-xs px-3 py-1 rounded-full transition-colors",
                  activeRarity === 'all' 
                    ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                    : "bg-gray-900/50 text-gray-400 border border-gray-800 hover:bg-gray-800/50"
                )}
                onClick={() => setActiveRarity('all')}
              >
                All Rarities
              </button>
              
              {rarities.map(rarity => (
                <button
                  key={rarity}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full transition-colors",
                    activeRarity === rarity 
                      ? "bg-purple-900/50 text-purple-300 border border-purple-700"
                      : "bg-gray-900/50 text-gray-400 border border-gray-800 hover:bg-gray-800/50"
                  )}
                  onClick={() => setActiveRarity(rarity)}
                >
                  {rarity}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedBadges.map(badge => (
          <div key={badge.id} className="flex flex-col items-center">
            <AchievementBadge 
              badge={badge} 
              size={badgeSize} 
              showDetails={showDetails}
            />
          </div>
        ))}
      </div>
      
      {sortedBadges.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No badges found with the selected filters.</p>
        </div>
      )}
    </div>
  );
}