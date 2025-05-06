import React from 'react';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface BadgeProps {
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
  isLocked?: boolean;
  awardedReason?: string | null;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  name,
  description,
  imageUrl,
  rarity,
  size = 'md',
  isLocked = false,
  awardedReason,
  onClick
}) => {
  // Size classes for different badge sizes
  const sizeClasses = {
    sm: 'w-12 h-12 border-[2px]',
    md: 'w-16 h-16 border-[2px]',
    lg: 'w-24 h-24 border-[3px]'
  };
  
  // Color classes for different badge rarities
  const rarityColors = {
    common: 'border-gray-400 bg-gray-800/90',
    uncommon: 'border-green-500 bg-green-950/90',
    rare: 'border-blue-500 bg-blue-950/90',
    epic: 'border-purple-500 bg-purple-950/90',
    legendary: 'border-orange-500 bg-orange-950/90'
  };
  
  // Glow effects for different badge rarities
  const rarityGlow = {
    common: '',
    uncommon: 'shadow-sm shadow-green-500/30',
    rare: 'shadow-md shadow-blue-500/40',
    epic: 'shadow-lg shadow-purple-500/50',
    legendary: 'shadow-xl shadow-orange-500/60'
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'relative flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 transform hover:scale-110',
              sizeClasses[size],
              isLocked ? 'border-gray-600 bg-gray-800/50' : rarityColors[rarity],
              !isLocked && rarityGlow[rarity],
              !isLocked && rarity !== 'common' && 'animate-pulse-slow'
            )}
            onClick={onClick}
          >
            {isLocked ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <Lock className="w-1/2 h-1/2 text-gray-400" />
              </div>
            ) : (
              <img 
                src={imageUrl} 
                alt={name} 
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="w-56 p-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div 
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  rarity === 'common' ? 'bg-gray-400' :
                  rarity === 'uncommon' ? 'bg-green-500' :
                  rarity === 'rare' ? 'bg-blue-500' :
                  rarity === 'epic' ? 'bg-purple-500' :
                  'bg-orange-500'
                )}
              />
              <p className="font-medium text-sm">
                {name} 
                <span className="ml-1 text-xs opacity-70 capitalize">({rarity})</span>
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground">{description}</p>

            {awardedReason && (
              <div className="mt-1.5 pt-1.5 border-t border-border/50">
                <p className="text-xs font-medium text-emerald-500">Awarded: {awardedReason}</p>
              </div>
            )}
            
            {isLocked && (
              <div className="mt-1.5 pt-1.5 border-t border-border/50">
                <p className="text-xs font-medium text-amber-500">Locked - Complete requirements to unlock</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Badge;