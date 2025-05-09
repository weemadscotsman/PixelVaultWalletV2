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
    
    // First block mined - "Block Miner" badge
    if (blockCount === 1) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'mining-first-block');
        console.log('Awarded first block mined badge');
      } catch (err) {
        console.warn('Error awarding first block badge:', err);
      }
    }
    
    // 50 blocks badge - "Mining Expert" badge
    if (blockCount >= 50) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'mining-50-blocks');
        console.log('Awarded 50 blocks mined badge');
      } catch (err) {
        console.warn('Error awarding 50 blocks badge:', err);
      }
    } 
    // 10 blocks badge - "Mining Enthusiast" badge
    else if (blockCount >= 10) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'mining-10-blocks');
        console.log('Awarded 10 blocks mined badge');
      } catch (err) {
        console.warn('Error awarding 10 blocks badge:', err);
      }
    }
    
    // Check consecutive mining - "Hash King" badge
    if (consecutiveCount && consecutiveCount >= 10) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'mining-hash-king');
        console.log('Awarded Hash King badge for consecutive mining');
      } catch (err) {
        console.warn('Error awarding hash king badge:', err);
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
    
    // First thringlet badge - "Thringlet Owner" badge
    if (count === 1) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'thringlet-first');
        console.log('Awarded first thringlet badge');
      } catch (err) {
        console.warn('Error awarding first thringlet badge:', err);
      }
    }
    
    // Check for evolved badge
    if (evolution > 0) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'thringlet-evolved');
        console.log('Awarded thringlet evolved badge');
      } catch (err) {
        console.warn('Error awarding thringlet evolved badge:', err);
      }
    }
    
    // Check for max level badge
    if (level >= 10) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'thringlet-max-level');
        console.log('Awarded thringlet maximalist badge');
      } catch (err) {
        console.warn('Error awarding thringlet maximalist badge:', err);
      }
    }
  } catch (error) {
    console.error('Error checking thringlet badges:', error);
  }
};

// Check for staking badges
export const checkStakingBadges = async (userId: string, amount: string, duration: number, totalStaked?: string) => {
  try {
    console.log(`Checking staking badges for user ${userId}, amount: ${amount}, duration: ${duration}, totalStaked: ${totalStaked || 'N/A'}`);
    
    // First staking badge - "Stake Novice" badge
    try {
      await badgeStorage.awardBadgeToUser(userId, 'staking-first');
      console.log('Awarded stake novice badge');
    } catch (err) {
      console.warn('Error awarding staking first badge:', err);
    }
    
    // "Whale Staker" badge - Staked over 1000 PVX at once
    const amountNum = parseFloat(amount);
    if (amountNum >= 1000) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'staking-1000pvx');
        console.log('Awarded whale staker badge');
      } catch (err) {
        console.warn('Error awarding whale staker badge:', err);
      }
    }
    
    // "Stake Holder" badge - Maintained a stake for 30 days
    if (duration >= 30) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'staking-30days');
        console.log('Awarded stake holder badge');
      } catch (err) {
        console.warn('Error awarding stake holder badge:', err);
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
    
    // Check for first transaction badge - "First Transaction" badge
    if (txType === TransactionType.TRANSFER && txCount === 1) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'tx-first');
        console.log('Awarded first transaction badge');
      } catch (err) {
        console.warn('Error awarding first transaction badge:', err);
      }
    }
    
    // Check for transaction adept badge - 10 transactions
    if (txType === TransactionType.TRANSFER && txCount !== undefined && txCount >= 10) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'tx-10');
        console.log('Awarded transaction adept badge');
      } catch (err) {
        console.warn('Error awarding transaction adept badge:', err);
      }
    }
    
    // Check for transaction master badge - 100 transactions
    if (txType === TransactionType.TRANSFER && txCount !== undefined && txCount >= 100) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'tx-100');
        console.log('Awarded transaction master badge');
      } catch (err) {
        console.warn('Error awarding transaction master badge:', err);
      }
    }
    
    // Check for big spender badge - "Big Spender" badge
    if (txType === TransactionType.TRANSFER && txCount !== undefined && txCount >= 5) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'tx-big-spender');
        console.log('Awarded big spender badge');
      } catch (err) {
        console.warn('Error awarding big spender badge:', err);
      }
    }
    
    // Check for first staking badge - "Stake Novice" badge
    if (txType === TransactionType.STAKE) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'staking-first');
        console.log('Awarded stake novice badge');
      } catch (err) {
        console.warn('Error awarding stake novice badge:', err);
      }
    }
    
    // Check for governance badges - "Governance Voter" badge
    if (txType === TransactionType.GOVERNANCE) {
      try {
        await badgeStorage.awardBadgeToUser(userId, 'gov-first-vote');
        console.log('Awarded governance voter badge');
      } catch (err) {
        console.warn('Error awarding governance voter badge:', err);
      }
    }
    
  } catch (error) {
    console.error('Error checking transaction badges:', error);
  }
};