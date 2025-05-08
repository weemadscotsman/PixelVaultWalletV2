import { Badge, badgeRegistry, BadgeCategory, BadgeRarity } from '@shared/badges';

/**
 * Badge Service - Manages user achievements and progress
 */
class BadgeService {
  private userBadges: Badge[] = [];
  private initialized = false;
  
  constructor() {
    this.loadBadges();
  }
  
  /**
   * Load badges from localStorage or initialize with defaults
   */
  private loadBadges(): void {
    try {
      const savedBadges = localStorage.getItem('pvx_user_badges');
      if (savedBadges) {
        this.userBadges = JSON.parse(savedBadges);
        // Make sure we have all new badges from registry
        this.syncWithRegistry();
      } else {
        // Initialize with all badges from registry
        this.userBadges = [...badgeRegistry];
        // Mark Genesis Node badge as completed for new users
        this.completeBadge('genesis_node');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load badges:', error);
      // Reset to defaults
      this.userBadges = [...badgeRegistry];
      this.initialized = true;
    }
  }
  
  /**
   * Make sure all badges from registry are present in user badges
   */
  private syncWithRegistry(): void {
    const userBadgeIds = new Set(this.userBadges.map(badge => badge.id));
    
    // Add any new badges from registry
    for (const badge of badgeRegistry) {
      if (!userBadgeIds.has(badge.id)) {
        this.userBadges.push({ ...badge });
      }
    }
    
    // Save the updated badges
    this.saveBadges();
  }
  
  /**
   * Save badges to localStorage
   */
  private saveBadges(): void {
    if (!this.initialized) return;
    
    try {
      localStorage.setItem('pvx_user_badges', JSON.stringify(this.userBadges));
    } catch (error) {
      console.error('Failed to save badges:', error);
    }
  }
  
  /**
   * Get all user badges
   */
  getAllBadges(): Badge[] {
    return this.userBadges;
  }
  
  /**
   * Get badges by category
   */
  getBadgesByCategory(category: BadgeCategory): Badge[] {
    return this.userBadges.filter(badge => badge.category === category);
  }
  
  /**
   * Get badges by rarity
   */
  getBadgesByRarity(rarity: BadgeRarity): Badge[] {
    return this.userBadges.filter(badge => badge.rarity === rarity);
  }
  
  /**
   * Get badges by completion status
   */
  getCompletedBadges(): Badge[] {
    return this.userBadges.filter(badge => !!badge.completedAt);
  }
  
  /**
   * Get badges in progress
   */
  getBadgesInProgress(): Badge[] {
    return this.userBadges.filter(badge => !badge.completedAt && badge.progress && !badge.locked);
  }
  
  /**
   * Get a badge by ID
   */
  getBadgeById(id: string): Badge | undefined {
    return this.userBadges.find(badge => badge.id === id);
  }
  
  /**
   * Mark a badge as completed
   */
  completeBadge(id: string): Badge | undefined {
    const badge = this.getBadgeById(id);
    if (!badge) return undefined;
    
    badge.completedAt = Date.now();
    if (badge.progressMax) {
      badge.progress = badge.progressMax;
    }
    
    this.saveBadges();
    return badge;
  }
  
  /**
   * Update badge progress
   */
  updateBadgeProgress(id: string, progress: number): Badge | undefined {
    const badge = this.getBadgeById(id);
    if (!badge) return undefined;
    
    badge.progress = progress;
    
    // Auto-complete if progress meets or exceeds max
    if (badge.progressMax && progress >= badge.progressMax) {
      badge.completedAt = Date.now();
      badge.progress = badge.progressMax;
    }
    
    this.saveBadges();
    return badge;
  }
  
  /**
   * Increment badge progress
   */
  incrementBadgeProgress(id: string, amount: number = 1): Badge | undefined {
    const badge = this.getBadgeById(id);
    if (!badge) return undefined;
    
    const currentProgress = badge.progress || 0;
    return this.updateBadgeProgress(id, currentProgress + amount);
  }
  
  /**
   * Lock or unlock a badge
   */
  setBadgeLocked(id: string, locked: boolean): Badge | undefined {
    const badge = this.getBadgeById(id);
    if (!badge) return undefined;
    
    badge.locked = locked;
    this.saveBadges();
    return badge;
  }
  
  /**
   * Reset all badges to default state
   */
  resetAllBadges(): void {
    this.userBadges = [...badgeRegistry];
    this.saveBadges();
  }
  
  /**
   * Get total experience from completed badges
   */
  getTotalExperience(): number {
    return this.userBadges
      .filter(badge => !!badge.completedAt)
      .reduce((sum, badge) => sum + badge.experience, 0);
  }
  
  /**
   * Get user level based on experience
   */
  getUserLevel(): number {
    const xp = this.getTotalExperience();
    // Simple level formula: Each level requires 1000 * level XP
    let level = 1;
    let xpRequired = 1000;
    
    while (xp >= xpRequired) {
      level++;
      xpRequired += 1000 * level;
    }
    
    return level;
  }
  
  /**
   * Get XP progress towards next level
   */
  getLevelProgress(): { currentXp: number, requiredXp: number, percentage: number } {
    const xp = this.getTotalExperience();
    const level = this.getUserLevel();
    
    // Calculate XP threshold for current level
    let previousLevelXp = 0;
    for (let i = 1; i < level; i++) {
      previousLevelXp += 1000 * i;
    }
    
    // Calculate XP needed for next level
    const nextLevelXp = 1000 * level;
    const currentLevelXp = xp - previousLevelXp;
    const percentage = Math.min(100, Math.floor((currentLevelXp / nextLevelXp) * 100));
    
    return {
      currentXp: currentLevelXp,
      requiredXp: nextLevelXp,
      percentage
    };
  }
}

// Export singleton instance
export const badgeService = new BadgeService();