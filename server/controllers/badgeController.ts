import { Request, Response } from 'express';
import { badgeStorage } from '../storage/badge-storage';
import { BadgeType, TransactionType } from '@shared/types';

// Get all badges (visible ones only)
export const getAllBadges = async (req: Request, res: Response) => {
  try {
    const badges = badgeStorage.getAllVisibleBadges();
    res.json(badges);
  } catch (error: any) {
    console.error('Error getting all badges:', error);
    res.status(500).json({ error: error.message || 'Failed to get badges' });
  }
};

// Get badge by ID
export const getBadgeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const badge = badgeStorage.getBadgeById(id);
    
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    res.json(badge);
  } catch (error: any) {
    console.error('Error getting badge by ID:', error);
    res.status(500).json({ error: error.message || 'Failed to get badge' });
  }
};

// Get badges by type
export const getBadgesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!Object.values(BadgeType).includes(type as BadgeType)) {
      return res.status(400).json({ error: 'Invalid badge type' });
    }
    
    const badges = badgeStorage.getBadgesByType(type as BadgeType);
    res.json(badges);
  } catch (error: any) {
    console.error('Error getting badges by type:', error);
    res.status(500).json({ error: error.message || 'Failed to get badges' });
  }
};

// Get user badges
export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userBadges = badgeStorage.getUserBadgesWithDetails(userId);
    res.json(userBadges);
  } catch (error: any) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ error: error.message || 'Failed to get user badges' });
  }
};

// Award badge to user
export const awardBadgeToUser = async (req: Request, res: Response) => {
  try {
    const { userId, badgeId } = req.body;
    
    if (!userId || !badgeId) {
      return res.status(400).json({ error: 'User ID and Badge ID are required' });
    }
    
    const userBadge = badgeStorage.awardBadgeToUser(userId, badgeId);
    
    if (!userBadge) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    // Get the badge details to include in the response
    const badge = badgeStorage.getBadgeById(badgeId);
    
    res.json({ ...userBadge, badge });
  } catch (error: any) {
    console.error('Error awarding badge to user:', error);
    res.status(500).json({ error: error.message || 'Failed to award badge' });
  }
};

// Update badge progress
export const updateBadgeProgress = async (req: Request, res: Response) => {
  try {
    const { userId, badgeId, progress } = req.body;
    
    if (!userId || !badgeId || progress === undefined) {
      return res.status(400).json({ error: 'User ID, Badge ID and progress are required' });
    }
    
    if (typeof progress !== 'number' || progress < 0) {
      return res.status(400).json({ error: 'Progress must be a non-negative number' });
    }
    
    const result = badgeStorage.updateBadgeProgress(userId, badgeId, progress);
    const badge = badgeStorage.getBadgeById(badgeId);
    
    res.json({
      ...result.userBadge,
      badge,
      newlyEarned: result.newlyEarned
    });
  } catch (error: any) {
    console.error('Error updating badge progress:', error);
    res.status(500).json({ error: error.message || 'Failed to update badge progress' });
  }
};

// Check for mining badges
export const checkMiningBadges = async (userId: string, blockCount: number, consecutiveCount?: number) => {
  try {
    console.log(`Checking mining badges for user ${userId}, blocks: ${blockCount}, consecutive: ${consecutiveCount || 0}`);
    
    // First block mined
    if (blockCount === 1) {
      await badgeStorage.awardBadgeToUser(userId, 'mining-first-block');
      console.log('Awarded first block mined badge');
    }
    
    // Mining enthusiast - 10 blocks
    if (blockCount >= 10) {
      const result = await badgeStorage.updateBadgeProgress(userId, 'mining-10-blocks', 100);
      if (result.newlyEarned) {
        console.log('Awarded 10 blocks mined badge');
      }
    } else if (blockCount > 1) {
      // Update progress
      const progress = Math.floor((blockCount / 10) * 100);
      await badgeStorage.updateBadgeProgress(userId, 'mining-10-blocks', progress);
    }
    
    // Mining expert - 50 blocks
    if (blockCount >= 50) {
      const result = await badgeStorage.updateBadgeProgress(userId, 'mining-50-blocks', 100);
      if (result.newlyEarned) {
        console.log('Awarded 50 blocks mined badge');
      }
    } else if (blockCount > 10) {
      // Update progress
      const progress = Math.floor((blockCount / 50) * 100);
      await badgeStorage.updateBadgeProgress(userId, 'mining-50-blocks', progress);
    }
    
    // Hash king - 10 consecutive blocks
    if (consecutiveCount !== undefined) {
      if (consecutiveCount >= 10) {
        const result = await badgeStorage.updateBadgeProgress(userId, 'mining-hash-king', 100);
        if (result.newlyEarned) {
          console.log('Awarded hash king badge');
        }
      } else if (consecutiveCount > 1) {
        // Update progress
        const progress = Math.floor((consecutiveCount / 10) * 100);
        await badgeStorage.updateBadgeProgress(userId, 'mining-hash-king', progress);
      }
    }
  } catch (error) {
    console.error('Error checking mining badges:', error);
  }
};

// Check for thringlet badges
export const checkThringletBadges = async (userId: string, level: number, evolution: number, count: number) => {
  try {
    console.log(`Checking thringlet badges for user ${userId}, level: ${level}, evolution: ${evolution}, count: ${count}`);
    
    // First thringlet badge
    if (count === 1) {
      await badgeStorage.awardBadgeToUser(userId, 'thringlet-first');
      console.log('Awarded first thringlet badge');
    }
    
    // Evolved thringlet badge
    if (evolution > 0) {
      await badgeStorage.awardBadgeToUser(userId, 'thringlet-evolved');
      console.log('Awarded thringlet evolved badge');
    }
    
    // Max level thringlet badge
    if (level >= 10) { // Assuming level 10 is max
      await badgeStorage.awardBadgeToUser(userId, 'thringlet-max-level');
      console.log('Awarded thringlet maximalist badge');
    }
  } catch (error) {
    console.error('Error checking thringlet badges:', error);
  }
};

// Check for staking badges
export const checkStakingBadges = async (userId: string, amount: string, duration: number, totalStaked?: string) => {
  try {
    console.log(`Checking staking badges for user ${userId}, amount: ${amount}, duration: ${duration}, totalStaked: ${totalStaked || 'N/A'}`);
    
    // First staking badge (already handled in transaction badges, but keeping it here as a backup)
    await badgeStorage.awardBadgeToUser(userId, 'staking-first');
    
    // Long-term staker badge
    if (duration >= 30) { // 30-day staking
      await badgeStorage.awardBadgeToUser(userId, 'staking-long-term');
      console.log('Awarded long-term staker badge');
    }
    
    // Check large stake amount badges
    const amountNum = parseFloat(amount);
    if (amountNum >= 1000) {
      await badgeStorage.awardBadgeToUser(userId, 'staking-whale');
      console.log('Awarded staking whale badge');
    }
    
    // Check total staked amount badges
    if (totalStaked) {
      const totalStakedNum = parseFloat(totalStaked);
      
      // Staking enthusiast - 5000 PVX total staked
      if (totalStakedNum >= 5000) {
        await badgeStorage.awardBadgeToUser(userId, 'staking-enthusiast');
        console.log('Awarded staking enthusiast badge');
      }
    }
  } catch (error) {
    console.error('Error checking staking badges:', error);
  }
};

// Check for transaction badges
export const checkTransactionBadges = async (userId: string, txType: TransactionType, txCount?: number) => {
  try {
    console.log(`Checking transaction badges for user ${userId}, type ${txType}`);
    
    // If we don't have the transaction count, we can't check count-based badges
    if (!txCount && txType !== TransactionType.GOVERNANCE) {
      console.log('No transaction count provided, skipping count-based badges');
      return;
    }
    
    // Check for first transaction badge
    if (txType === TransactionType.TRANSFER && txCount === 1) {
      await badgeStorage.awardBadgeToUser(userId, 'tx-first');
      console.log('Awarded first transaction badge');
    }
    
    // Check for transaction count badges
    if (txType === TransactionType.TRANSFER && txCount !== undefined) {
      if (txCount >= 10) {
        const result = await badgeStorage.updateBadgeProgress(userId, 'tx-10', 100);
        if (result.newlyEarned) {
          console.log('Awarded 10 transactions badge');
        }
      }
      
      if (txCount >= 100) {
        const result = await badgeStorage.updateBadgeProgress(userId, 'tx-100', 100);
        if (result.newlyEarned) {
          console.log('Awarded 100 transactions badge');
        }
      } else if (txCount > 10) {
        // Update progress for 100 transactions badge
        const progress = Math.floor((txCount / 100) * 100);
        await badgeStorage.updateBadgeProgress(userId, 'tx-100', progress);
      }
    }
    
    // Check for first staking badge
    if (txType === TransactionType.STAKE) {
      await badgeStorage.awardBadgeToUser(userId, 'staking-first');
      console.log('Awarded first staking badge');
    }
    
    // Check for governance badges
    if (txType === TransactionType.GOVERNANCE) {
      await badgeStorage.awardBadgeToUser(userId, 'gov-first-vote');
      console.log('Awarded governance voter badge');
    }
    
  } catch (error) {
    console.error('Error checking transaction badges:', error);
  }
};