import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Badge from '@/components/badges/Badge';
import { Info } from 'lucide-react';

export interface BadgeData {
  id: number;
  name: string;
  description: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  requirements_json?: string | null;
  created_at: string;
  progress?: number;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  awarded_at: string;
  awarded_reason: string | null;
  is_featured: boolean;
  badge: BadgeData;
}

interface BadgeGridProps {
  title: string;
  description: string;
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
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  
  // Mock data for badges
  const mockBadges: BadgeData[] = [
    {
      id: 1,
      name: 'Early Explorer',
      description: 'One of the first to explore the PVX ecosystem',
      image_url: 'https://via.placeholder.com/100?text=Explorer',
      rarity: 'common',
      category: 'achievements',
      requirements_json: JSON.stringify({ days_since_joining: 1 }),
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Miner Apprentice',
      description: 'Mined your first PVX block',
      image_url: 'https://via.placeholder.com/100?text=Miner',
      rarity: 'uncommon',
      category: 'mining',
      requirements_json: JSON.stringify({ blocks_mined: 1 }),
      created_at: '2025-01-02T00:00:00Z'
    },
    {
      id: 3,
      name: 'Governance Pioneer',
      description: 'Participated in your first governance vote',
      image_url: 'https://via.placeholder.com/100?text=Gov',
      rarity: 'rare',
      category: 'governance',
      requirements_json: JSON.stringify({ votes_cast: 1 }),
      created_at: '2025-01-03T00:00:00Z'
    },
    {
      id: 4,
      name: 'Master Staker',
      description: 'Staked PVX for more than 30 days',
      image_url: 'https://via.placeholder.com/100?text=Staker',
      rarity: 'epic',
      category: 'staking',
      requirements_json: JSON.stringify({ days_staked: 30 }),
      created_at: '2025-01-04T00:00:00Z'
    },
    {
      id: 5,
      name: 'Thringlet Whisperer',
      description: 'Bonded with your Thringlet to level 10',
      image_url: 'https://via.placeholder.com/100?text=Thringlet',
      rarity: 'legendary',
      category: 'thringlets',
      requirements_json: JSON.stringify({ thringlet_bond_level: 10 }),
      created_at: '2025-01-05T00:00:00Z'
    },
    {
      id: 6,
      name: 'Community Contributor',
      description: 'Contributed to the PVX community discussion',
      image_url: 'https://via.placeholder.com/100?text=Community',
      rarity: 'uncommon',
      category: 'community',
      requirements_json: JSON.stringify({ forum_posts: 5 }),
      created_at: '2025-01-06T00:00:00Z'
    },
    {
      id: 7,
      name: 'Security Guardian',
      description: 'Enabled all security features on your account',
      image_url: 'https://via.placeholder.com/100?text=Security',
      rarity: 'rare',
      category: 'security',
      requirements_json: JSON.stringify({ security_features_enabled: 3 }),
      created_at: '2025-01-07T00:00:00Z'
    },
    {
      id: 8,
      name: 'PVX Master',
      description: 'Accumulated more than 1000 PVX in your wallet',
      image_url: 'https://via.placeholder.com/100?text=Master',
      rarity: 'epic',
      category: 'achievements',
      requirements_json: JSON.stringify({ pvx_balance: 1000 }),
      created_at: '2025-01-08T00:00:00Z'
    },
    {
      id: 9,
      name: 'Drop Hunter',
      description: 'Found and claimed a secret drop',
      image_url: 'https://via.placeholder.com/100?text=Hunter',
      rarity: 'rare',
      category: 'achievements',
      requirements_json: JSON.stringify({ drops_claimed: 1 }),
      created_at: '2025-01-09T00:00:00Z'
    },
    {
      id: 10,
      name: 'Mining Legend',
      description: 'Mined more than 100 blocks',
      image_url: 'https://via.placeholder.com/100?text=MiningLegend',
      rarity: 'legendary',
      category: 'mining',
      requirements_json: JSON.stringify({ blocks_mined: 100 }),
      created_at: '2025-01-10T00:00:00Z'
    }
  ];
  
  // Mock data for user badges
  const mockUserBadges: UserBadge[] = [
    {
      id: 1,
      user_id: 1,
      badge_id: 1,
      awarded_at: '2025-03-01T00:00:00Z',
      awarded_reason: 'Joined the PVX ecosystem on launch day',
      is_featured: true,
      badge: mockBadges[0]
    },
    {
      id: 2,
      user_id: 1,
      badge_id: 2,
      awarded_at: '2025-03-15T00:00:00Z',
      awarded_reason: 'Successfully mined your first block',
      is_featured: true,
      badge: mockBadges[1]
    },
    {
      id: 3,
      user_id: 1,
      badge_id: 5,
      awarded_at: '2025-04-20T00:00:00Z',
      awarded_reason: 'Raised your Thringlet bond to level 10',
      is_featured: true,
      badge: mockBadges[4]
    }
  ];
  
  useEffect(() => {
    // Simulate API call to fetch badges
    const fetchBadges = async () => {
      setLoading(true);
      
      // In a real app, this would be an API call
      setTimeout(() => {
        if (userId) {
          let filteredUserBadges = mockUserBadges;
          
          if (featuredOnly) {
            filteredUserBadges = filteredUserBadges.filter(ub => ub.is_featured);
          }
          
          setUserBadges(filteredUserBadges);
        }
        
        let filteredBadges = mockBadges;
        
        if (category) {
          filteredBadges = filteredBadges.filter(badge => badge.category === category);
        }
        
        if (maxBadgesToShow) {
          filteredBadges = filteredBadges.slice(0, maxBadgesToShow);
        }
        
        setBadges(filteredBadges);
        setLoading(false);
      }, 300);
    };
    
    fetchBadges();
  }, [category, userId, featuredOnly, maxBadgesToShow]);
  
  // Get a list of badge IDs the user has earned
  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  
  return (
    <Card className="bg-black/80 border-blue-900/40 shadow-blue-900/10">
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && (
            <CardTitle className="text-blue-400 font-bold">{title}</CardTitle>
          )}
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : userId ? (
          // Display user badges if userId is provided
          userBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {userBadges.map(userBadge => (
                <div key={userBadge.id} className="flex flex-col items-center text-center">
                  <Badge 
                    name={userBadge.badge.name}
                    description={userBadge.badge.description}
                    imageUrl={userBadge.badge.image_url}
                    rarity={userBadge.badge.rarity}
                    size={size}
                    awardedReason={userBadge.awarded_reason}
                    onClick={() => onBadgeClick && onBadgeClick(userBadge)}
                  />
                  <div className="mt-2">
                    <p className="text-xs font-medium truncate max-w-full">{userBadge.badge.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Info className="w-8 h-8 text-blue-500/60 mb-2" />
              <p className="text-sm text-muted-foreground">No badges earned yet</p>
            </div>
          )
        ) : (
          // Display all badges if userId is not provided
          badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {badges.map(badge => {
                const isLocked = !earnedBadgeIds.includes(badge.id);
                
                // Skip locked badges if showLocked is false
                if (isLocked && !showLocked) return null;
                
                return (
                  <div key={badge.id} className="flex flex-col items-center text-center">
                    <Badge 
                      name={badge.name}
                      description={badge.description}
                      imageUrl={badge.image_url}
                      rarity={badge.rarity}
                      size={size}
                      isLocked={isLocked}
                      onClick={() => onBadgeClick && onBadgeClick(badge)}
                    />
                    <div className="mt-2">
                      <p className="text-xs font-medium truncate max-w-full">{badge.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Info className="w-8 h-8 text-blue-500/60 mb-2" />
              <p className="text-sm text-muted-foreground">No badges available in this category</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeGrid;