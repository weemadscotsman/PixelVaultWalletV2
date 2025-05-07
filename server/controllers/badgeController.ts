import { Request, Response } from 'express';
import { BadgeType, BadgeRarity } from '@shared/types';
import { badgeStorage } from '../storage/badge-storage';
import { customAlphabet } from 'nanoid';

// Generate IDs for badges and user badges
const generateId = customAlphabet('1234567890abcdef', 10);

// Get all badges (visible to users)
export async function getAllBadges(req: Request, res: Response) {
  try {
    const badges = await badgeStorage.getVisibleBadges();
    res.json(badges);
  } catch (error) {
    console.error('Error getting badges:', error);
    res.status(500).json({ error: 'Failed to get badges' });
  }
}

// Get badges by type
export async function getBadgesByType(req: Request, res: Response) {
  try {
    const type = req.params.type as BadgeType;
    
    // Validate badge type
    if (!Object.values(BadgeType).includes(type)) {
      return res.status(400).json({ error: 'Invalid badge type' });
    }
    
    const badges = await badgeStorage.getBadgesByType(type);
    res.json(badges);
  } catch (error) {
    console.error('Error getting badges by type:', error);
    res.status(500).json({ error: 'Failed to get badges' });
  }
}

// Get a single badge by ID
export async function getBadgeById(req: Request, res: Response) {
  try {
    const badgeId = req.params.id;
    const badge = await badgeStorage.getBadge(badgeId);
    
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    res.json(badge);
  } catch (error) {
    console.error('Error getting badge:', error);
    res.status(500).json({ error: 'Failed to get badge' });
  }
}

// Create a new badge (admin only)
export async function createBadge(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      type,
      rarity,
      icon,
      requirement,
      secret
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !type || !rarity || !icon || !requirement) {
      return res.status(400).json({ error: 'Missing required badge fields' });
    }
    
    // Validate badge type and rarity
    if (!Object.values(BadgeType).includes(type)) {
      return res.status(400).json({ error: 'Invalid badge type' });
    }
    
    if (!Object.values(BadgeRarity).includes(rarity)) {
      return res.status(400).json({ error: 'Invalid badge rarity' });
    }
    
    // Create badge with unique ID
    const badge = await badgeStorage.createBadge({
      id: `${type}-${generateId()}`,
      name,
      description,
      type,
      rarity,
      icon,
      requirement,
      secret: !!secret // Convert to boolean
    });
    
    res.status(201).json(badge);
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ error: 'Failed to create badge' });
  }
}

// Get all badges for a user
export async function getUserBadges(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    const badgesWithDetails = await badgeStorage.getUserBadgesWithDetails(userId);
    res.json(badgesWithDetails);
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ error: 'Failed to get user badges' });
  }
}

// Award a badge to a user
export async function awardBadgeToUser(req: Request, res: Response) {
  try {
    const { userId, badgeId } = req.body;
    
    // Validate required fields
    if (!userId || !badgeId) {
      return res.status(400).json({ error: 'User ID and Badge ID are required' });
    }
    
    const userBadge = await badgeStorage.awardBadge(userId, badgeId);
    
    if (!userBadge) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    res.status(201).json(userBadge);
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
}

// Update user badge progress
export async function updateBadgeProgress(req: Request, res: Response) {
  try {
    const { userId, badgeId, progress } = req.body;
    
    // Validate required fields
    if (!userId || !badgeId || typeof progress !== 'number') {
      return res.status(400).json({ error: 'User ID, Badge ID, and progress are required' });
    }
    
    // Validate progress value
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    
    const userBadge = await badgeStorage.updateUserBadgeProgress(userId, badgeId, progress);
    
    if (!userBadge) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    res.json(userBadge);
  } catch (error) {
    console.error('Error updating badge progress:', error);
    res.status(500).json({ error: 'Failed to update badge progress' });
  }
}

// Check if user meets criteria for transaction-related badges
export async function checkTransactionBadges(userId: string, amount: string, txCount: number) {
  try {
    // First transaction badge
    if (txCount === 1) {
      await badgeStorage.awardBadge(userId, 'tx-first');
    }
    
    // Big spender badge (1000+ PVX in a single transaction)
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && amountNum >= 1000) {
      await badgeStorage.awardBadge(userId, 'tx-big-spender');
    }
  } catch (error) {
    console.error('Error checking transaction badges:', error);
  }
}

// Check if user meets criteria for mining-related badges
export async function checkMiningBadges(userId: string, blockCount: number) {
  try {
    // First block mined badge
    if (blockCount === 1) {
      await badgeStorage.awardBadge(userId, 'mining-first');
    }
    
    // Mining master badge (100+ blocks)
    if (blockCount >= 100) {
      await badgeStorage.awardBadge(userId, 'mining-master');
    }
  } catch (error) {
    console.error('Error checking mining badges:', error);
  }
}

// Check if user meets criteria for staking-related badges
export async function checkStakingBadges(userId: string, amount: string, stakeCount: number) {
  try {
    // First stake badge
    if (stakeCount === 1) {
      await badgeStorage.awardBadge(userId, 'stake-first');
    }
    
    // Whale staker badge (10,000+ PVX staked)
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && amountNum >= 10000) {
      await badgeStorage.awardBadge(userId, 'stake-whale');
    }
  } catch (error) {
    console.error('Error checking staking badges:', error);
  }
}

// Check if user meets criteria for thringlet-related badges
export async function checkThringletBadges(userId: string, thringletCount: number, interactionCount: number) {
  try {
    // First thringlet badge
    if (thringletCount === 1) {
      await badgeStorage.awardBadge(userId, 'thringlet-first');
    }
    
    // Thringlet whisperer badge (100+ interactions)
    if (interactionCount >= 100) {
      await badgeStorage.awardBadge(userId, 'thringlet-whisperer');
    }
  } catch (error) {
    console.error('Error checking thringlet badges:', error);
  }
}

// Check if user meets criteria for governance-related badges
export async function checkGovernanceBadges(userId: string, voteCount: number) {
  try {
    // First vote badge
    if (voteCount === 1) {
      await badgeStorage.awardBadge(userId, 'gov-first');
    }
  } catch (error) {
    console.error('Error checking governance badges:', error);
  }
}

// Check early adopter status
export async function checkEarlyAdopterBadge(userId: string, walletCount: number) {
  try {
    // Early adopter badge (first 100 users)
    if (walletCount <= 100) {
      await badgeStorage.awardBadge(userId, 'special-early');
    }
  } catch (error) {
    console.error('Error checking early adopter badge:', error);
  }
}