import { useState, useEffect } from 'react';
import { Badge, BadgeCategory, BadgeRarity } from '@shared/badges';
import { badgeService } from '@/lib/badge-service';

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completedBadges, setCompletedBadges] = useState<Badge[]>([]);
  const [badgesInProgress, setBadgesInProgress] = useState<Badge[]>([]);
  const [totalExperience, setTotalExperience] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState({ currentXp: 0, requiredXp: 1000, percentage: 0 });
  
  // Initialize badges
  useEffect(() => {
    // Load badges
    const allBadges = badgeService.getAllBadges();
    setBadges(allBadges);
    
    // Set completed badges
    setCompletedBadges(badgeService.getCompletedBadges());
    
    // Set badges in progress
    setBadgesInProgress(badgeService.getBadgesInProgress());
    
    // Set experience and level
    setTotalExperience(badgeService.getTotalExperience());
    setUserLevel(badgeService.getUserLevel());
    setLevelProgress(badgeService.getLevelProgress());
  }, []);
  
  // Complete a badge
  const completeBadge = (badgeId: string) => {
    const updatedBadge = badgeService.completeBadge(badgeId);
    if (updatedBadge) {
      // Update badge lists
      const allBadges = badgeService.getAllBadges();
      setBadges(allBadges);
      setCompletedBadges(badgeService.getCompletedBadges());
      setBadgesInProgress(badgeService.getBadgesInProgress());
      
      // Update experience and level
      setTotalExperience(badgeService.getTotalExperience());
      setUserLevel(badgeService.getUserLevel());
      setLevelProgress(badgeService.getLevelProgress());
      
      return updatedBadge;
    }
    return undefined;
  };
  
  // Update badge progress
  const updateBadgeProgress = (badgeId: string, progress: number) => {
    const updatedBadge = badgeService.updateBadgeProgress(badgeId, progress);
    if (updatedBadge) {
      // Update badge lists
      const allBadges = badgeService.getAllBadges();
      setBadges(allBadges);
      setCompletedBadges(badgeService.getCompletedBadges());
      setBadgesInProgress(badgeService.getBadgesInProgress());
      
      // Update experience and level if badge was completed
      if (updatedBadge.completedAt) {
        setTotalExperience(badgeService.getTotalExperience());
        setUserLevel(badgeService.getUserLevel());
        setLevelProgress(badgeService.getLevelProgress());
      }
      
      return updatedBadge;
    }
    return undefined;
  };
  
  // Increment badge progress
  const incrementBadgeProgress = (badgeId: string, amount: number = 1) => {
    const updatedBadge = badgeService.incrementBadgeProgress(badgeId, amount);
    if (updatedBadge) {
      // Update badge lists
      const allBadges = badgeService.getAllBadges();
      setBadges(allBadges);
      setCompletedBadges(badgeService.getCompletedBadges());
      setBadgesInProgress(badgeService.getBadgesInProgress());
      
      // Update experience and level if badge was completed
      if (updatedBadge.completedAt) {
        setTotalExperience(badgeService.getTotalExperience());
        setUserLevel(badgeService.getUserLevel());
        setLevelProgress(badgeService.getLevelProgress());
      }
      
      return updatedBadge;
    }
    return undefined;
  };
  
  // Get badge by ID
  const getBadgeById = (badgeId: string) => {
    return badgeService.getBadgeById(badgeId);
  };
  
  // Get badges by category
  const getBadgesByCategory = (category: BadgeCategory) => {
    return badgeService.getBadgesByCategory(category);
  };
  
  // Get badges by rarity
  const getBadgesByRarity = (rarity: BadgeRarity) => {
    return badgeService.getBadgesByRarity(rarity);
  };
  
  // Reset all badges (useful for development/testing)
  const resetAllBadges = () => {
    badgeService.resetAllBadges();
    
    // Update all states
    const allBadges = badgeService.getAllBadges();
    setBadges(allBadges);
    setCompletedBadges(badgeService.getCompletedBadges());
    setBadgesInProgress(badgeService.getBadgesInProgress());
    setTotalExperience(badgeService.getTotalExperience());
    setUserLevel(badgeService.getUserLevel());
    setLevelProgress(badgeService.getLevelProgress());
  };
  
  return {
    badges,
    completedBadges,
    badgesInProgress,
    totalExperience,
    userLevel,
    levelProgress,
    completeBadge,
    updateBadgeProgress,
    incrementBadgeProgress,
    getBadgeById,
    getBadgesByCategory,
    getBadgesByRarity,
    resetAllBadges
  };
}