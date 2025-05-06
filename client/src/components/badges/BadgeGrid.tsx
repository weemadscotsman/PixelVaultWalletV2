import React, { useState, useEffect } from 'react';
import Badge from './Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// This would ideally come from your schema.ts
export interface BadgeData {
  id: number;
  name: string;
  description: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  requirements_json?: string;
  created_at: Date;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  is_featured: boolean;
  is_hidden: boolean;
  awarded_at: Date;
  awarded_reason: string | null;
  badge: BadgeData;
}

// Mock data - would be replaced by actual API calls in production
const mockBadges: BadgeData[] = [
  {
    id: 1,
    name: 'Blockchain Pioneer',
    description: 'Early adopter of the PVX blockchain wallet.',
    image_url: 'https://via.placeholder.com/200/7B68EE/FFFFFF?text=PVX',
    rarity: 'uncommon',
    category: 'achievements',
    created_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'First Transaction',
    description: 'Successfully completed your first PVX transaction.',
    image_url: 'https://via.placeholder.com/200/32CD32/FFFFFF?text=TX',
    rarity: 'common',
    category: 'achievements',
    created_at: new Date('2024-01-01')
  },
  {
    id: 3,
    name: 'Master Miner',
    description: 'Mined over 100 blocks on the PVX network.',
    image_url: 'https://via.placeholder.com/200/FFD700/000000?text=MM',
    rarity: 'epic',
    category: 'mining',
    requirements_json: '{"blocks_mined": 100}',
    created_at: new Date('2024-01-01')
  },
  {
    id: 4,
    name: 'Governance Guardian',
    description: 'Participated in 10 governance proposals.',
    image_url: 'https://via.placeholder.com/200/1E90FF/FFFFFF?text=GG',
    rarity: 'rare',
    category: 'governance',
    requirements_json: '{"proposals_voted": 10}',
    created_at: new Date('2024-01-01')
  },
  {
    id: 5,
    name: 'Diamond Hands',
    description: 'Staked PVX tokens for over 90 days.',
    image_url: 'https://via.placeholder.com/200/9370DB/FFFFFF?text=DH',
    rarity: 'rare',
    category: 'staking',
    requirements_json: '{"staking_days": 90}',
    created_at: new Date('2024-01-01')
  },
  {
    id: 6,
    name: 'Thringlet Whisperer',
    description: 'Bonded with your Thringlet to level 10.',
    image_url: 'https://via.placeholder.com/200/FF8C00/FFFFFF?text=TW',
    rarity: 'legendary',
    category: 'thringlets',
    requirements_json: '{"thringlet_level": 10}',
    created_at: new Date('2024-01-01')
  },
  {
    id: 7,
    name: 'Community Contributor',
    description: 'Actively participated in the PVX community forums.',
    image_url: 'https://via.placeholder.com/200/20B2AA/FFFFFF?text=CC',
    rarity: 'uncommon',
    category: 'community',
    created_at: new Date('2024-01-01')
  },
  {
    id: 8,
    name: 'Security Sentinel',
    description: 'Maintained all security features active for 30 days.',
    image_url: 'https://via.placeholder.com/200/DC143C/FFFFFF?text=SS',
    rarity: 'rare',
    category: 'security',
    requirements_json: '{"security_days": 30}',
    created_at: new Date('2024-01-01')
  },
  {
    id: 9,
    name: 'Hash Cracker',
    description: 'Successfully completed all levels of the Hash Mining game.',
    image_url: 'https://via.placeholder.com/200/00BFFF/FFFFFF?text=HC',
    rarity: 'epic',
    category: 'achievements',
    created_at: new Date('2024-01-01')
  },
  {
    id: 10,
    name: 'Secret Finder',
    description: 'Discovered 5 secret drops in the ecosystem.',
    image_url: 'https://via.placeholder.com/200/FF6347/FFFFFF?text=SF',
    rarity: 'rare',
    category: 'achievements',
    requirements_json: '{"secret_drops_found": 5}',
    created_at: new Date('2024-01-01')
  },
  {
    id: 11,
    name: 'Quantum Security',
    description: 'Activated quantum-resistant encryption on your wallet.',
    image_url: 'https://via.placeholder.com/200/4682B4/FFFFFF?text=QS',
    rarity: 'legendary',
    category: 'security',
    created_at: new Date('2024-01-01')
  },
  {
    id: 12,
    name: 'Veto Guardian',
    description: 'Appointed as a veto guardian for the community.',
    image_url: 'https://via.placeholder.com/200/8A2BE2/FFFFFF?text=VG',
    rarity: 'legendary',
    category: 'governance',
    created_at: new Date('2024-01-01')
  }
];

// Mock user badges - would be replaced by actual user data in a real app
const mockUserBadges: UserBadge[] = [
  {
    id: 1,
    user_id: 1,
    badge_id: 1,
    is_featured: true,
    is_hidden: false,
    awarded_at: new Date('2024-04-20'),
    awarded_reason: 'Early access account creation',
    badge: mockBadges[0]
  },
  {
    id: 2,
    user_id: 1,
    badge_id: 2,
    is_featured: false,
    is_hidden: false,
    awarded_at: new Date('2024-04-21'),
    awarded_reason: 'First transaction of 100 PVX',
    badge: mockBadges[1]
  },
  {
    id: 3,
    user_id: 1,
    badge_id: 7,
    is_featured: true,
    is_hidden: false,
    awarded_at: new Date('2024-04-25'),
    awarded_reason: '10+ forum posts & 5+ replies',
    badge: mockBadges[6]
  }
];

interface BadgeGridProps {
  title: string;
  description?: string;
  category?: string;
  userId?: number;
  featuredOnly?: boolean;
  showLocked?: boolean;
  maxBadgesToShow?: number;
  size?: 'sm' | 'md' | 'lg';
  onBadgeClick?: (badge: BadgeData | UserBadge) => void;
}

const BadgeGrid: React.FC<BadgeGridProps> = ({
  title,
  description,
  category,
  userId,
  featuredOnly = false,
  showLocked = false,
  maxBadgesToShow,
  size = 'md',
  onBadgeClick
}) => {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [showAll, setShowAll] = useState(false);
  
  // In a real app, these would be API calls using React Query
  useEffect(() => {
    // Simulate API call for badges
    setTimeout(() => {
      // Filter badges based on category if provided
      let filteredBadges = [...mockBadges];
      if (category) {
        filteredBadges = filteredBadges.filter(badge => badge.category === category);
      }
      setBadges(filteredBadges);
      
      // If userId is provided, get user's badges
      if (userId) {
        let filteredUserBadges = [...mockUserBadges].filter(ub => ub.user_id === userId);
        if (featuredOnly) {
          filteredUserBadges = filteredUserBadges.filter(ub => ub.is_featured);
        }
        setUserBadges(filteredUserBadges);
      }
    }, 200);
  }, [category, userId, featuredOnly]);
  
  // Determine what badges to display
  const displayBadges = userId
    ? userBadges.map(ub => ({
        ...ub.badge,
        isOwned: true,
        userBadgeId: ub.id,
        isFeatured: ub.is_featured,
        awardedAt: ub.awarded_at,
        awardedReason: ub.awarded_reason
      }))
    : badges;
  
  // Limit the number of badges if maxBadgesToShow is specified
  const limitedBadges = showAll || !maxBadgesToShow
    ? displayBadges
    : displayBadges.slice(0, maxBadgesToShow);
  
  // Add "locked" badges to display if showing all badges in a category
  const badgesToRender = !userId && showLocked && category
    ? [
        ...limitedBadges,
        // Show locked badge placeholders for badges the user hasn't earned yet
        ...mockBadges
          .filter(b => 
            b.category === category && 
            !userBadges.some(ub => ub.badge_id === b.id)
          )
          .map(b => ({ ...b, isLocked: true }))
      ]
    : limitedBadges;
  
  // Handle badge click
  const handleBadgeClick = (badge: any) => {
    if (onBadgeClick) {
      if (badge.userBadgeId) {
        // It's a user badge, find the original user badge object
        const userBadge = userBadges.find(ub => ub.id === badge.userBadgeId);
        if (userBadge) {
          onBadgeClick(userBadge);
          return;
        }
      }
      // It's a regular badge
      onBadgeClick(badge);
    }
  };
  
  return (
    <Card className="bg-black/80 border-blue-900/40 shadow-blue-900/10">
      <CardHeader>
        <CardTitle className="text-blue-400 font-bold text-shadow-neon">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {badgesToRender.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No badges found
          </div>
        ) : (
          <>
            <div className={cn(
              "grid gap-6",
              size === 'sm' ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8' :
              size === 'md' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
              'grid-cols-2 sm:grid-cols-3'
            )}>
              {badgesToRender.map((badge: any) => (
                <div 
                  key={`${badge.id}${badge.userBadgeId || ''}`}
                  className="flex flex-col items-center gap-2"
                >
                  <Badge
                    name={badge.name}
                    description={badge.description}
                    imageUrl={badge.image_url}
                    rarity={badge.rarity}
                    size={size}
                    isLocked={badge.isLocked}
                    awardedReason={badge.awardedReason}
                    onClick={() => handleBadgeClick(badge)}
                  />
                  <span className="text-xs text-center font-medium text-blue-300/80 line-clamp-1">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
            
            {maxBadgesToShow && displayBadges.length > maxBadgesToShow && !showAll && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="text-blue-400 border-blue-900/60 hover:bg-blue-900/20"
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeGrid;