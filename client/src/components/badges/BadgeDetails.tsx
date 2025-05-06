import React from 'react';
import { BadgeData, UserBadge } from './BadgeGrid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Info, Medal, Shield, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BadgeDetailsProps {
  badge: BadgeData | (UserBadge & { badge: BadgeData });
  isOpen: boolean;
  onClose: () => void;
}

const BadgeDetails: React.FC<BadgeDetailsProps> = ({ badge, isOpen, onClose }) => {
  // Determine if this is a user badge (earned) or just a badge (available)
  const isUserBadge = 'badge_id' in badge;
  const badgeData = isUserBadge ? badge.badge : badge;
  
  // Rarity color mappings
  const rarityColors: Record<string, string> = {
    common: 'bg-gray-200 text-gray-800',
    uncommon: 'bg-green-100 text-green-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-purple-100 text-purple-800',
    legendary: 'bg-orange-100 text-orange-800'
  };
  
  // Badge glow mappings for the main image
  const rarityGlow: Record<string, string> = {
    common: '',
    uncommon: 'shadow-[0_0_10px_2px_rgba(34,197,94,0.3)]',
    rare: 'shadow-[0_0_10px_2px_rgba(59,130,246,0.3)]',
    epic: 'shadow-[0_0_15px_3px_rgba(168,85,247,0.4)]',
    legendary: 'shadow-[0_0_20px_5px_rgba(249,115,22,0.5)]'
  };
  
  // Border color for the badge image
  const rarityBorder: Record<string, string> = {
    common: 'border-gray-400',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-orange-500'
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-shadow-neon">
            <Medal className="w-5 h-5" />
            Badge Details
          </DialogTitle>
          <DialogDescription>
            Information about this badge and its requirements
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Badge Image and Basic Info */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={cn(
              "w-28 h-28 rounded-full border-2 p-1",
              rarityBorder[badgeData.rarity],
              rarityGlow[badgeData.rarity]
            )}>
              <img 
                src={badgeData.image_url} 
                alt={badgeData.name}
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold leading-tight">{badgeData.name}</h3>
              <div className="flex justify-center">
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full capitalize font-medium",
                  rarityColors[badgeData.rarity]
                )}>
                  {badgeData.rarity}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{badgeData.description}</p>
            </div>
          </div>
          
          {/* Badge Status */}
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Badge Status
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full font-medium",
                  isUserBadge 
                    ? "bg-green-100 text-green-800" 
                    : "bg-blue-100 text-blue-800"
                )}>
                  {isUserBadge ? "Earned" : "Available"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category:</span>
                <span className="text-sm font-medium capitalize">{badgeData.category}</span>
              </div>
              
              {isUserBadge && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Awarded:</span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(badge.awarded_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {badge.awarded_reason && (
                    <div className="border-t border-border/50 pt-2 mt-2">
                      <span className="text-sm text-muted-foreground block mb-1">Reason:</span>
                      <p className="text-sm">{badge.awarded_reason}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Requirements (if not earned) */}
          {!isUserBadge && badgeData.requirements_json && (
            <div className="bg-card/50 border border-border/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Requirements
              </h4>
              
              <div className="space-y-2">
                {/* In a real app, parse requirements_json and display structured requirements */}
                <p className="text-sm">Complete specific tasks to earn this badge.</p>
                <div className="text-sm">
                  <div className="flex items-start gap-2 text-amber-500">
                    <Clock className="w-4 h-4 mt-0.5" />
                    <span>Requirements are tracked automatically in the system.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* If it's a user badge, show display options */}
          {isUserBadge && (
            <div className="bg-card/50 border border-border/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Display Options
              </h4>
              
              <div className="flex gap-2">
                <Button 
                  variant={badge.is_featured ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  // In a real app, would call API to toggle featured status
                >
                  {badge.is_featured ? "Featured" : "Feature Badge"}
                </Button>
                
                <Button 
                  variant={badge.is_hidden ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  // In a real app, would call API to toggle hidden status
                >
                  {badge.is_hidden ? "Hidden" : "Hide Badge"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeDetails;