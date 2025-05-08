import { useState } from 'react';
import { Badge } from '@shared/badges';
import { cn } from '@/lib/utils';
import { LucideProps } from 'lucide-react';
import { 
  Award, Lock, HelpCircle, Power, Stamp, BarChart, Bot, 
  Shield, Flame, Medal, Trophy, Star, 
  FileText, Database, Server, Archive, GraduationCap, EyeOff 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// Map of badge icon names to Lucide components (use only icons available in lucide-react)
const IconMap: Record<string, React.ComponentType<LucideProps>> = {
  Award,
  Lock,
  HelpCircle,
  Power,
  Stamp,
  BarChart,
  Bot,
  Shield,
  Flame,
  Medal,
  Trophy,
  Star,
  FileText,
  Diamond: Database, // Use Database icon as substitute for Diamond
  Server,
  Archive,
  GraduationCap,
  EyeOff,
  Pickaxe: Trophy // Use Trophy as substitute for Pickaxe
};

interface AchievementBadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showDetails?: boolean;
}

// Helper function to get color classes based on rarity
function getRarityClasses(rarity: string): string {
  switch (rarity) {
    case 'Common':
      return 'border-gray-400 bg-gray-800';
    case 'Uncommon':
      return 'border-emerald-500 bg-emerald-900/30';
    case 'Rare':
      return 'border-blue-500 bg-blue-900/30 rare-glow';
    case 'Epic':
      return 'border-purple-500 bg-purple-900/30 epic-glow';
    case 'Legendary':
      return 'border-amber-500 bg-amber-900/30 legendary-glow';
    case 'Mythic':
      return 'border-pink-500 bg-pink-900/30 animate-pulse';
    default:
      return 'border-gray-400 bg-gray-800';
  }
}

// Helper function to get size classes
function getSizeClasses(size: string): string {
  switch (size) {
    case 'sm':
      return 'w-12 h-12 text-xs';
    case 'md':
      return 'w-16 h-16 text-sm';
    case 'lg':
      return 'w-20 h-20 text-base';
    case 'xl':
      return 'w-24 h-24 text-lg';
    default:
      return 'w-16 h-16 text-sm';
  }
}

export function AchievementBadge({ 
  badge, 
  size = 'md', 
  className,
  showDetails = false
}: AchievementBadgeProps) {
  const [open, setOpen] = useState(false);
  
  // Get the icon component from our map, fallback to Award if not found
  const IconComponent = IconMap[badge.icon] || Award;
  
  // Format timestamp
  const formatDate = (timestamp: number | undefined | null) => {
    if (!timestamp) return 'Not achieved';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const isLocked = badge.locked || (!badge.completedAt && !badge.secret);
  const isSecret = badge.secret && !badge.completedAt;
  const isCompleted = !!badge.completedAt;
  
  // Calculate progress percentage
  const progressPercent = badge.progressMax && badge.progress !== undefined 
    ? Math.min(100, (badge.progress / badge.progressMax) * 100) 
    : isCompleted ? 100 : 0;
  
  return (
    <>
      <div 
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105',
          getSizeClasses(size),
          isLocked ? 'border-gray-600 bg-gray-900 opacity-50' : getRarityClasses(badge.rarity),
          isSecret ? 'border-gray-500 bg-gray-900/80 opacity-70' : '',
          className
        )}
        style={{ color: isLocked ? '#888' : badge.color }}
        onClick={() => setOpen(true)}
        title={isSecret ? 'Secret Badge' : badge.name}
      >
        {isLocked ? (
          <Lock className="w-1/2 h-1/2 opacity-60" />
        ) : isSecret ? (
          <HelpCircle className="w-1/2 h-1/2 opacity-60" />
        ) : (
          <IconComponent className="w-1/2 h-1/2" />
        )}
        
        {badge.progressMax && badge.progress !== undefined && !isCompleted && !isLocked && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4">
            <Progress value={progressPercent} className="h-1.5 bg-black/50" />
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-2 text-center">
          <p className="font-semibold" style={{ color: isLocked ? '#888' : badge.color }}>
            {isSecret ? '???' : badge.name}
          </p>
          {!isLocked && !isSecret && (
            <p className="text-xs text-muted-foreground">
              {badge.rarity}
            </p>
          )}
        </div>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border border-border/80 bg-card/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className={cn(
                  'rounded-full p-2 border-2',
                  isLocked ? 'border-gray-600 bg-gray-900/50' : getRarityClasses(badge.rarity)
                )}
                style={{ color: isLocked ? '#888' : badge.color }}
              >
                {isLocked ? (
                  <Lock className="w-5 h-5 opacity-60" />
                ) : isSecret ? (
                  <HelpCircle className="w-5 h-5 opacity-60" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </div>
              <span>
                {isSecret && !isCompleted ? 'Secret Badge' : badge.name}
              </span>
              <div className="ml-auto text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                {badge.rarity}
              </div>
            </DialogTitle>
            
            <DialogDescription className="pt-2">
              {isSecret && !isCompleted 
                ? 'This badge is hidden until you achieve it. Keep exploring the platform to discover it!'
                : badge.description
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!isSecret && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{badge.category}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Experience Points:</span>
                  <span className="font-medium">{badge.experience} XP</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criteria:</span>
                  <span className="font-medium text-right">{badge.criteria}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={cn(
                    'font-medium',
                    isCompleted ? 'text-green-400' : 'text-amber-400'
                  )}>
                    {isCompleted ? 'Achieved' : 'In Progress'}
                  </span>
                </div>
                
                {isCompleted && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Achieved On:</span>
                    <span className="font-medium">{formatDate(badge.completedAt)}</span>
                  </div>
                )}
                
                {badge.progressMax && badge.progress !== undefined && !isCompleted && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="font-medium">{badge.progress} / {badge.progressMax}</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}