import { Badge, BadgeCategory, BadgeRarity } from '@shared/badges';
import { AchievementBadge } from './AchievementBadge';
import { Badge as UIBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  badgeSize = 'md',
}: BadgeGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'All'>('All');
  const [rarityFilter, setRarityFilter] = useState<BadgeRarity | 'All'>('All');
  
  // Get unique categories
  const categories = Array.from(
    new Set(badges.map((badge) => badge.category))
  ) as BadgeCategory[];
  
  // Get unique rarities
  const rarities = Array.from(
    new Set(badges.map((badge) => badge.rarity))
  ) as BadgeRarity[];
  
  // Sort rarities by precedence
  const rarityOrder = {
    'Common': 1,
    'Uncommon': 2,
    'Rare': 3,
    'Epic': 4,
    'Legendary': 5,
    'Mythic': 6
  };
  
  rarities.sort((a, b) => rarityOrder[a] - rarityOrder[b]);
  
  // Filter badges
  const filteredBadges = badges.filter((badge) => {
    if (categoryFilter !== 'All' && badge.category !== categoryFilter) return false;
    if (rarityFilter !== 'All' && badge.rarity !== rarityFilter) return false;
    return true;
  });
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {showCategories && (
          <div className="flex flex-wrap gap-1.5">
            <UIBadge
              variant={categoryFilter === 'All' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoryFilter('All')}
            >
              All Categories
            </UIBadge>
            
            {categories.map((category) => (
              <UIBadge
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </UIBadge>
            ))}
          </div>
        )}
        
        {showRarities && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            <UIBadge
              variant={rarityFilter === 'All' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setRarityFilter('All')}
            >
              All Rarities
            </UIBadge>
            
            {rarities.map((rarity) => (
              <UIBadge
                key={rarity}
                variant={rarityFilter === rarity ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer',
                  rarity === 'Rare' && 'rare-glow',
                  rarity === 'Epic' && 'epic-glow',
                  rarity === 'Legendary' && 'legendary-glow',
                  rarity === 'Mythic' && 'animate-pulse'
                )}
                onClick={() => setRarityFilter(rarity)}
              >
                {rarity}
              </UIBadge>
            ))}
          </div>
        )}
      </div>
      
      {/* Badge Grid */}
      <div className={cn('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4', className)}>
        {filteredBadges.length > 0 ? (
          filteredBadges.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center">
              <AchievementBadge
                badge={badge}
                size={badgeSize}
                showDetails={showDetails}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No badges match your current filters.
          </div>
        )}
      </div>
    </div>
  );
}