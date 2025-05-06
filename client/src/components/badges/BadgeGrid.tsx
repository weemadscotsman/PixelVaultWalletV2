import React from 'react';
import Badge from './Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { mockBadges, mockUserBadges } from '@/data/mockBadges';

export interface BadgeData {
  id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  requirements_json: string | null;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  awarded_at: string;
  awarded_reason: string | null;
  is_featured: boolean;
  is_hidden: boolean;
  badge: BadgeData;
}

interface BadgeGridProps {
  title: string;
  description?: string;
  userId?: number; // If provided, loads user badges
  category?: string; // If provided, filters by category
  showLocked?: boolean; // If true, shows locked badges
  size?: 'sm' | 'md' | 'lg';
  maxBadgesToShow?: number;
  onBadgeClick?: (badge: BadgeData | UserBadge) => void;
}

const BadgeGrid: React.FC<BadgeGridProps> = ({
  title,
  description,
  userId,
  category,
  showLocked = false,
  size = 'md',
  maxBadgesToShow,
  onBadgeClick
}) => {
  // Define query key based on props
  const queryKey = userId 
    ? ['/api/users', userId, 'badges', ...(category ? [category] : [])] 
    : ['/api/badges', ...(category ? [category] : [])];
  
  // Fetch badges based on the query key
  const { data: badgesData, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      // Using mock data for development
      try {
        if (userId) {
          let filteredUserBadges = mockUserBadges;
          
          // Filter by category if provided
          if (category) {
            filteredUserBadges = mockUserBadges.filter(ub => 
              ub.badge.category === category
            );
          }
          
          return filteredUserBadges;
        } else {
          let filteredBadges = mockBadges;
          
          // Filter by category if provided
          if (category) {
            filteredBadges = mockBadges.filter(b => 
              b.category === category
            );
          }
          
          return filteredBadges;
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
        throw new Error('Failed to fetch badges');
      }
      
      // In production, would use the API:
      /*
      let url;
      if (userId) {
        url = `/api/users/${userId}/badges`;
        if (category) url += `?category=${category}`;
      } else if (category) {
        url = `/api/badges/category/${category}`;
      } else {
        url = '/api/badges';
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      
      return response.json();
      */
    }
  });
  
  const badges = badgesData?.slice(0, maxBadgesToShow);
  
  // Handler for badge click
  const handleBadgeClick = (badge: BadgeData | UserBadge) => {
    if (onBadgeClick) {
      onBadgeClick(badge);
    }
  };
  
  return (
    <Card className="w-full border-border/50 dark:bg-slate-900/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold mb-1 text-shadow-neon">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-t-primary rounded-full"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-4 text-red-500">Failed to load badges</div>
        ) : badges && badges.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 py-2">
            {badges.map((badgeItem: any) => {
              // Handle both user badges and regular badges
              const badge = 'badge' in badgeItem ? badgeItem.badge : badgeItem;
              const userBadge = 'badge' in badgeItem ? badgeItem : null;
              
              return (
                <div key={badge.id} className="flex justify-center">
                  <Badge
                    name={badge.name}
                    description={badge.description}
                    imageUrl={badge.image_url}
                    rarity={badge.rarity as any}
                    size={size}
                    isLocked={userBadge === null && showLocked}
                    awardedReason={userBadge?.awarded_reason}
                    onClick={() => handleBadgeClick(badgeItem)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No badges found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeGrid;