import { Request, Response } from 'express';
import { badgeStorage } from '../storage/badge-storage';
import { BadgeType, TransactionType } from '../types';

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
    
    // First block mined - "Block Pioneer" badge
    if (blockCount === 1) {
      await badgeStorage.awardBadgeToUser(userId, 'mining-first');
      console.log('Awarded first block mined badge');
    }
    
    // 100 blocks badge - "Mining Master" badge
    if (blockCount >= 100) {
      const result = await badgeStorage.updateBadgeProgress(userId, 'mining-master', 100);
      if (result.newlyEarned) {
        console.log('Awarded 100 blocks mined badge');
      }
    } else if (blockCount > 1) {
      // Update progress towards 100 blocks
      const progress = Math.floor((blockCount / 100) * 100);
      await badgeStorage.updateBadgeProgress(userId, 'mining-master', progress);
    }
  } catch (error) {
    console.error('Error checking mining badges:', error);
  }
};

// Check for thringlet badges
export const checkThringletBadges = async (userId: string, level: number, evolution: number, count: number) => {
  try {
    console.log(`Checking thringlet badges for user ${userId}, level: ${level}, evolution: ${evolution}, count: ${count}`);
    
    // First thringlet badge - "Thringlet Parent" badge
    if (count === 1) {
      await badgeStorage.awardBadgeToUser(userId, 'thringlet-first');
      console.log('Awarded first thringlet badge');
    }
    
    // Thringlet interactions - "Thringlet Whisperer" badge
    // Track number of interactions with Thringlets
    const totalInteractions = level * 10; // Simple approximation of interactions
    if (totalInteractions >= 100) {
      await badgeStorage.awardBadgeToUser(userId, 'thringlet-whisperer');
      console.log('Awarded thringlet whisperer badge');
    } else {
      const progress = Math.floor((totalInteractions / 100) * 100);
      await badgeStorage.updateBadgeProgress(userId, 'thringlet-whisperer', progress);
    }
  } catch (error) {
    console.error('Error checking thringlet badges:', error);
  }
};

// Check for staking badges
export const checkStakingBadges = async (userId: string, amount: string, duration: number, totalStaked?: string) => {
  try {
    console.log(`Checking staking badges for user ${userId}, amount: ${amount}, duration: ${duration}, totalStaked: ${totalStaked || 'N/A'}`);
    
    // First staking badge - "Stake Initiate" badge
    await badgeStorage.awardBadgeToUser(userId, 'stake-first');
    console.log('Awarded stake initiate badge');
    
    // "Whale Staker" badge - Staked more than 10,000 PVX in a single pool
    const amountNum = parseFloat(amount);
    if (amountNum >= 10000) {
      await badgeStorage.awardBadgeToUser(userId, 'stake-whale');
      console.log('Awarded whale staker badge');
    } else {
      // Update progress toward whale badge
      const progress = Math.min(100, Math.floor((amountNum / 10000) * 100));
      await badgeStorage.updateBadgeProgress(userId, 'stake-whale', progress);
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
    
    // Check for first transaction badge - "First Transaction" badge
    if (txType === TransactionType.TRANSFER && txCount === 1) {
      await badgeStorage.awardBadgeToUser(userId, 'tx-first');
      console.log('Awarded first transaction badge');
    }
    
    // Check for big spender badge - "Big Spender" badge
    // This would normally check transaction amount, but as a workaround we'll use count
    // as a proxy for transaction volume
    if (txType === TransactionType.TRANSFER && txCount !== undefined && txCount >= 5) {
      await badgeStorage.awardBadgeToUser(userId, 'tx-big-spender');
      console.log('Awarded big spender badge');
    }
    
    // Check for first staking badge - "Stake Initiate" badge
    if (txType === TransactionType.STAKE) {
      await badgeStorage.awardBadgeToUser(userId, 'stake-first');
      console.log('Awarded stake initiate badge');
    }
    
    // Check for governance badges - "Governance Participant" badge
    if (txType === TransactionType.GOVERNANCE) {
      await badgeStorage.awardBadgeToUser(userId, 'gov-first');
      console.log('Awarded governance participant badge');
    }
    
  } catch (error) {
    console.error('Error checking transaction badges:', error);
  }
};