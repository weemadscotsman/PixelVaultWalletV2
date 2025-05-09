import { eq, and, or } from 'drizzle-orm';
import { db } from './index';
import { badges, userBadges } from './schema';
import { Badge, UserBadge } from '@shared/types';

/**
 * Data access object for badges
 */
export class BadgeDao {
  /**
   * Create a new badge
   * @param badge Badge to create
   * @returns Created badge
   */
  async createBadge(badge: Badge): Promise<Badge> {
    try {
      // Convert badge to database format
      const dbBadge = {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl,
        tier: badge.tier,
        category: badge.category,
        requirements: badge.requirements,
        dateAdded: BigInt(badge.dateAdded)
      };

      // Insert badge
      await db.insert(badges).values(dbBadge);
      
      // Return original badge
      return badge;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw new Error('Failed to create badge');
    }
  }

  /**
   * Get badge by ID
   * @param id Badge ID
   * @returns Badge or undefined if not found
   */
  async getBadgeById(id: string): Promise<Badge | undefined> {
    try {
      const result = await db.select()
        .from(badges)
        .where(eq(badges.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to Badge
      const dbBadge = result[0];
      return {
        id: dbBadge.id,
        name: dbBadge.name,
        description: dbBadge.description,
        imageUrl: dbBadge.imageUrl,
        tier: dbBadge.tier,
        category: dbBadge.category,
        requirements: dbBadge.requirements,
        dateAdded: Number(dbBadge.dateAdded)
      };
    } catch (error) {
      console.error('Error getting badge by ID:', error);
      throw new Error('Failed to get badge');
    }
  }

  /**
   * Get all badges
   * @returns Array of badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      const result = await db.select().from(badges);
      
      // Convert database format to Badge[]
      return result.map(dbBadge => ({
        id: dbBadge.id,
        name: dbBadge.name,
        description: dbBadge.description,
        imageUrl: dbBadge.imageUrl,
        tier: dbBadge.tier,
        category: dbBadge.category,
        requirements: dbBadge.requirements,
        dateAdded: Number(dbBadge.dateAdded)
      }));
    } catch (error) {
      console.error('Error getting all badges:', error);
      throw new Error('Failed to get badges');
    }
  }

  /**
   * Get badges by category
   * @param category Badge category
   * @returns Array of badges
   */
  async getBadgesByCategory(category: string): Promise<Badge[]> {
    try {
      const result = await db.select()
        .from(badges)
        .where(eq(badges.category, category));
      
      // Convert database format to Badge[]
      return result.map(dbBadge => ({
        id: dbBadge.id,
        name: dbBadge.name,
        description: dbBadge.description,
        imageUrl: dbBadge.imageUrl,
        tier: dbBadge.tier,
        category: dbBadge.category,
        requirements: dbBadge.requirements,
        dateAdded: Number(dbBadge.dateAdded)
      }));
    } catch (error) {
      console.error('Error getting badges by category:', error);
      throw new Error('Failed to get badges');
    }
  }

  /**
   * Update a badge
   * @param badge Badge to update
   * @returns Updated badge
   */
  async updateBadge(badge: Badge): Promise<Badge> {
    try {
      // Check if badge exists
      const existingBadge = await this.getBadgeById(badge.id);
      if (!existingBadge) {
        return this.createBadge(badge);
      }
      
      // Convert badge to database format
      const dbBadge = {
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl,
        tier: badge.tier,
        category: badge.category,
        requirements: badge.requirements
      };

      // Update badge
      await db.update(badges)
        .set(dbBadge)
        .where(eq(badges.id, badge.id));
      
      // Return updated badge
      return badge;
    } catch (error) {
      console.error('Error updating badge:', error);
      throw new Error('Failed to update badge');
    }
  }

  /**
   * Delete a badge
   * @param id Badge ID
   * @returns Success status
   */
  async deleteBadge(id: string): Promise<boolean> {
    try {
      await db.delete(badges)
        .where(eq(badges.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting badge:', error);
      throw new Error('Failed to delete badge');
    }
  }

  /**
   * Get user badge
   * @param userId User ID
   * @param badgeId Badge ID
   * @returns User badge or undefined if not found
   */
  async getUserBadge(userId: string, badgeId: string): Promise<UserBadge | undefined> {
    try {
      const result = await db.select()
        .from(userBadges)
        .where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeId, badgeId)
          )
        )
        .limit(1);
      
      if (result.length === 0) {
        return undefined;
      }
      
      // Convert database format to UserBadge
      const dbUserBadge = result[0];
      return {
        userId: dbUserBadge.userId,
        badgeId: dbUserBadge.badgeId,
        obtained: dbUserBadge.obtained,
        dateObtained: dbUserBadge.dateObtained ? Number(dbUserBadge.dateObtained) : undefined,
        progress: dbUserBadge.progress ?? 0
      };
    } catch (error) {
      console.error('Error getting user badge:', error);
      throw new Error('Failed to get user badge');
    }
  }

  /**
   * Get all badges for a user
   * @param userId User ID
   * @returns Array of user badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const result = await db.select()
        .from(userBadges)
        .where(eq(userBadges.userId, userId));
      
      // Convert database format to UserBadge[]
      return result.map(dbUserBadge => ({
        userId: dbUserBadge.userId,
        badgeId: dbUserBadge.badgeId,
        obtained: dbUserBadge.obtained,
        dateObtained: dbUserBadge.dateObtained ? Number(dbUserBadge.dateObtained) : undefined,
        progress: dbUserBadge.progress ?? 0
      }));
    } catch (error) {
      console.error('Error getting user badges:', error);
      throw new Error('Failed to get user badges');
    }
  }

  /**
   * Create or update user badge
   * @param userBadge User badge to create or update
   * @returns Created or updated user badge
   */
  async createOrUpdateUserBadge(userBadge: UserBadge): Promise<UserBadge> {
    try {
      // Check if user badge exists
      const existingUserBadge = await this.getUserBadge(userBadge.userId, userBadge.badgeId);
      
      // Convert user badge to database format
      const dbUserBadge = {
        userId: userBadge.userId,
        badgeId: userBadge.badgeId,
        obtained: userBadge.obtained,
        dateObtained: userBadge.dateObtained ? BigInt(userBadge.dateObtained) : null,
        progress: userBadge.progress
      };

      if (!existingUserBadge) {
        // Insert user badge
        await db.insert(userBadges).values(dbUserBadge);
      } else {
        // Update user badge
        await db.update(userBadges)
          .set(dbUserBadge)
          .where(
            and(
              eq(userBadges.userId, userBadge.userId),
              eq(userBadges.badgeId, userBadge.badgeId)
            )
          );
      }
      
      // Return user badge
      return userBadge;
    } catch (error) {
      console.error('Error creating or updating user badge:', error);
      throw new Error('Failed to create or update user badge');
    }
  }

  /**
   * Get obtained badges for a user
   * @param userId User ID
   * @returns Array of user badges that have been obtained
   */
  async getObtainedBadges(userId: string): Promise<UserBadge[]> {
    try {
      const result = await db.select()
        .from(userBadges)
        .where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.obtained, true)
          )
        );
      
      // Convert database format to UserBadge[]
      return result.map(dbUserBadge => ({
        userId: dbUserBadge.userId,
        badgeId: dbUserBadge.badgeId,
        obtained: dbUserBadge.obtained,
        dateObtained: dbUserBadge.dateObtained ? Number(dbUserBadge.dateObtained) : undefined,
        progress: dbUserBadge.progress ?? 0
      }));
    } catch (error) {
      console.error('Error getting obtained badges:', error);
      throw new Error('Failed to get obtained badges');
    }
  }

  /**
   * Check if a user has a specific badge
   * @param userId User ID
   * @param badgeId Badge ID
   * @returns True if the user has obtained the badge, false otherwise
   */
  async hasUserObtainedBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const userBadge = await this.getUserBadge(userId, badgeId);
      return userBadge?.obtained ?? false;
    } catch (error) {
      console.error('Error checking if user has badge:', error);
      throw new Error('Failed to check if user has badge');
    }
  }

  /**
   * Update user badge progress
   * @param userId User ID
   * @param badgeId Badge ID
   * @param progress New progress value
   * @returns Updated user badge
   */
  async updateBadgeProgress(userId: string, badgeId: string, progress: number): Promise<UserBadge> {
    try {
      // Get or create user badge
      let userBadge = await this.getUserBadge(userId, badgeId);
      if (!userBadge) {
        userBadge = {
          userId,
          badgeId,
          obtained: false,
          progress: 0
        };
      }
      
      // Update progress
      userBadge.progress = progress;
      
      // Check if badge should be obtained
      if (progress >= 100 && !userBadge.obtained) {
        userBadge.obtained = true;
        userBadge.dateObtained = Date.now();
      }
      
      // Save user badge
      return await this.createOrUpdateUserBadge(userBadge);
    } catch (error) {
      console.error('Error updating badge progress:', error);
      throw new Error('Failed to update badge progress');
    }
  }

  /**
   * Award a badge to a user
   * @param userId User ID
   * @param badgeId Badge ID
   * @returns Updated user badge
   */
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
    try {
      // Get or create user badge
      let userBadge = await this.getUserBadge(userId, badgeId);
      if (!userBadge) {
        userBadge = {
          userId,
          badgeId,
          obtained: false,
          progress: 0
        };
      }
      
      // Award badge
      userBadge.obtained = true;
      userBadge.dateObtained = Date.now();
      userBadge.progress = 100;
      
      // Save user badge
      return await this.createOrUpdateUserBadge(userBadge);
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw new Error('Failed to award badge');
    }
  }
}

// Create a singleton instance
export const badgeDao = new BadgeDao();