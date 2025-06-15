import { Request, Response } from 'express';
import crypto from 'crypto'; // Needed for claimModuleRewards tx hash
// import { memBlockchainStorage } from '../mem-blockchain'; // REMOVED
import { broadcastTransaction } from '../utils/websocket';
import { PVX_GENESIS_ADDRESS } from '../utils/constants';
import { updateBadgeStatus } from '../services/badge-service';
import { generateRandomHash } from '../utils/crypto';
import { learningDao } from '../database/learningDao'; // IMPORT learningDao
import {
  LearningModule as SharedLearningModule,
  LearningQuestion as SharedLearningQuestion,
  UserLearningProgress as SharedUserLearningProgress, // Import shared UserLearningProgress
  Transaction as SharedTransaction // For claimModuleRewards
} from '@shared/types';
import { walletDao } from '../database/walletDao'; // Import walletDao
import { transactionDao } from '../database/transactionDao'; // For claimModuleRewards

// Define TransactionType as string literals since the enum is not available
const LocalTransactionType = { // Renamed to avoid conflict
  TRANSFER: 'TRANSFER' as SharedTransaction['type'],
  MINING_REWARD: 'MINING_REWARD' as SharedTransaction['type'],
  STAKING_REWARD: 'STAKING_REWARD' as SharedTransaction['type'],
  AIRDROP: 'AIRDROP' as SharedTransaction['type'],
  NFT_MINT: 'NFT_MINT' as SharedTransaction['type'],
  BADGE_AWARD: 'BADGE_AWARD' as SharedTransaction['type'],
  GOVERNANCE_VOTE: 'GOVERNANCE_VOTE' as SharedTransaction['type'],
  GOVERNANCE_PROPOSAL: 'GOVERNANCE_PROPOSAL' as SharedTransaction['type'],
  REWARD: 'REWARD' as SharedTransaction['type'] // Added for claimModuleRewards
};

// Remove local interfaces and in-memory storage
// interface LearningModule { ... }
// interface LearningQuestion { ... }
// interface UserProgress { ... }
// const learningModules: LearningModule[] = [ ... ];
// const userProgress: UserProgress[] = [];

/**
 * Get all learning modules
 */
export const getAllModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const modulesFromDao = await learningDao.getAllLearningModules();

    const sanitizedModules = modulesFromDao.map(module => {
      const { questions, ...restOfModule } = module;
      return {
        ...restOfModule,
        questionCount: questions?.length || 0,
        // Questions are not sent in the list view, only their count.
        // If questions were to be sent, they'd be sanitized here.
      };
    });
    
    res.status(200).json(sanitizedModules);
  } catch (error) {
    console.error('Error getting learning modules:', error);
    res.status(500).json({ error: 'Failed to fetch learning modules' });
  }
};

/**
 * Get a specific module by ID
 */
export const getModuleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const moduleWithQuestions = await learningDao.getLearningModuleById(moduleId);
    
    if (!moduleWithQuestions) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    // Sanitize questions by removing correctOption and explanation for client response
    let sanitizedQuestionsData;
    if (moduleWithQuestions.questions && moduleWithQuestions.type === 'quiz') {
      sanitizedQuestionsData = moduleWithQuestions.questions.map(q => {
        const { correctOption, explanation, ...restOfQuestion } = q;
        return restOfQuestion;
      });
    } else if (moduleWithQuestions.questions) { // For non-quiz types, maybe send questions without sanitization or don't send
        sanitizedQuestionsData = moduleWithQuestions.questions; // Or an empty array if they shouldn't be sent
    }

    const responseModule = {
      ...moduleWithQuestions,
      questions: sanitizedQuestionsData, // Attach sanitized or original questions
    };

    res.status(200).json(responseModule);
  } catch (error) {
    console.error('Error getting module by ID:', error);
    res.status(500).json({ error: 'Failed to fetch learning module' });
  }
};

/**
 * Start a learning module for a user
 */
export const startModule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const { userId } = req.body;
    
    const module = await learningDao.getLearningModuleById(moduleId);
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    const wallet = await walletDao.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    let progress = await learningDao.getUserProgressByModuleId(userId, moduleId);
    
    if (progress && progress.completed && progress.rewardsClaimed) {
      res.status(200).json({
        alreadyCompleted: true,
        message: 'You have already completed this module and claimed rewards.',
        progress
      });
      return;
    }
    
    if (progress) {
      res.status(200).json({
        message: 'Resuming module',
        progress
      });
      return;
    }
    
    const newProgressData: SharedUserLearningProgress = {
      userId,
      moduleId,
      completed: false,
      score: 0,
      attemptsCount: 0,
      lastAttemptDate: Date.now(),
      rewardsClaimed: false
    };
    
    const createdProgress = await learningDao.createOrUpdateUserProgress(newProgressData);
    
    res.status(201).json({
      message: 'Module started successfully',
      progress: createdProgress
    });
  } catch (error) {
    console.error('Error starting learning module:', error);
    res.status(500).json({ error: 'Failed to start learning module' });
  }
};

/**
 * Submit answers for a learning module
 */
export const submitModuleAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const { userId, answers } = req.body;
    
    // Check if module exists
    const module = await learningDao.getLearningModuleById(moduleId);
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await walletDao.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    // Check if this is a quiz module
    if (module.type !== 'quiz' || !module.questions) {
      res.status(400).json({ error: 'This module does not support answer submission' });
      return;
    }
    
    // Find existing progress or create new
    let progress = await learningDao.getUserProgressByModuleId(userId, moduleId);
    
    if (!progress) {
      const newProgressData: SharedUserLearningProgress = {
        userId,
        moduleId,
        completed: false,
        score: 0,
        attemptsCount: 0, // Will be incremented below
        lastAttemptDate: Date.now(),
        rewardsClaimed: false
      };
      // Create it first so attemptsCount can be incremented properly
      progress = await learningDao.createOrUpdateUserProgress(newProgressData);
    }
    
    // Calculate score
    let correctAnswers = 0;
    const results = [];
    
    for (const answer of answers) {
      const question = module.questions.find(q => q.id === answer.questionId);
      if (!question) continue;
      
      const isCorrect = answer.selectedOption === question.correctOption;
      if (isCorrect) correctAnswers++;
      
      results.push({
        questionId: answer.questionId,
        isCorrect,
        correctOption: question.correctOption,
        explanation: question.explanation
      });
    }
    
    const score = Math.round((correctAnswers / module.questions.length) * 100);
    
    // Update progress
    const updatedProgressData: SharedUserLearningProgress = {
      ...progress,
      score: Math.max(progress.score, score),  // Keep highest score
      attemptsCount: progress.attemptsCount + 1,
      lastAttemptDate: Date.now(),
      completed: progress.completed || (score >= (module.completionCriteria?.minScore || 70))
    };
    
    const savedProgress = await learningDao.createOrUpdateUserProgress(updatedProgressData);
    
    const response: any = {
      score,
      results,
      passed: savedProgress.completed,
      progress: savedProgress
    };
    
    if (savedProgress.completed && !savedProgress.rewardsClaimed) {
      response.rewards = {
        xp: module.xpReward,
        tokens: module.tokenReward,
        badge: module.badgeId ? { id: module.badgeId } : null
      };
      response.message = 'Congratulations! You passed the module and can claim rewards.';
    } else if (savedProgress.completed) {
      response.message = 'Congratulations! You passed the module again.';
    } else {
      response.message = `You scored ${score}%. You need ${module.completionCriteria?.minScore || 70}% to pass.`;
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error submitting module answers:', error);
    res.status(500).json({ error: 'Failed to submit answers' });
  }
};

/**
 * Claim rewards for completing a learning module
 */
export const claimModuleRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const { userId } = req.body;
    
    const module = await learningDao.getLearningModuleById(moduleId);
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    const wallet = await walletDao.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    const progress = await learningDao.getUserProgressByModuleId(userId, moduleId);
    if (!progress) {
      res.status(404).json({ error: 'No progress found for this module' });
      return;
    }
    
    if (!progress.completed) {
      res.status(400).json({ error: 'You must complete the module before claiming rewards' });
      return;
    }
    
    if (progress.rewardsClaimed) {
      res.status(400).json({ error: 'Rewards have already been claimed for this module' });
      return;
    }
    
    const now = Date.now();
    const rewardsToClaim = {
      xp: module.xpReward,
      tokens: module.tokenReward,
      badgeId: module.badgeId // Use badgeId consistent with SharedLearningModule
    };
    
    progress.rewardsClaimed = true;
    await learningDao.createOrUpdateUserProgress(progress);
    
    const txHash = crypto.createHash('sha256')
      .update(`learning_reward_${moduleId}_${userId}_${now}`)
      .digest('hex');
    
    const transaction: SharedTransaction = {
      hash: txHash,
      type: LocalTransactionType.REWARD,
      from: PVX_GENESIS_ADDRESS,
      to: userId,
      amount: module.tokenReward, // This is number from shared type
      timestamp: now,
      nonce: wallet.nonce ? wallet.nonce + 1 : 1, // Example nonce handling
      signature: generateRandomHash(), // Placeholder
      status: 'confirmed', // Or 'pending'
      metadata: {
        source: 'learning_lab',
        moduleId,
        moduleTitle: module.title
      }
    };
    
    await transactionDao.createTransaction(transaction);
    
    const newBalance = BigInt(wallet.balance) + BigInt(module.tokenReward);
    await walletDao.updateWallet({ ...wallet, balance: newBalance.toString(), lastUpdated: new Date(now) });
    // Potentially update wallet nonce if that's handled centrally after tx creation

    if (rewardsToClaim.badgeId) {
      await updateBadgeStatus(userId, rewardsToClaim.badgeId, true);
    }
    
    try {
      broadcastTransaction(transaction);
    } catch (err) {
      console.error('Error broadcasting learning reward transaction:', err);
    }
    
    res.status(200).json({
      success: true,
      message: 'Rewards claimed successfully',
      rewards: rewardsToClaim,
      transactionHash: txHash
    });
  } catch (error) {
    console.error('Error claiming module rewards:', error);
    res.status(500).json({ error: 'Failed to claim rewards' });
  }
};

/**
 * Get user learning progress
 */
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const wallet = await walletDao.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    const progressRecords = await learningDao.getAllUserProgress(userId);
    const allModules = await learningDao.getAllLearningModules();
    const modulesMap = new Map(allModules.map(m => [m.id, m]));

    const progressWithModuleInfo = progressRecords.map(p => {
      const module = modulesMap.get(p.moduleId);
      return {
        ...p,
        moduleTitle: module?.title || 'Unknown Module',
        moduleDifficulty: module?.difficulty || 'unknown',
        moduleType: module?.type || 'unknown',
        rewards: {
          xp: module?.xpReward || 0,
          tokens: module?.tokenReward || 0,
          badge: module?.badgeId
        }
      };
    });
    
    const completedModulesCount = progressRecords.filter(p => p.completed).length;
    const totalXP = progressRecords.reduce((sum, p) => {
      if (p.completed && p.rewardsClaimed) {
        const module = modulesMap.get(p.moduleId);
        return sum + (module?.xpReward || 0);
      }
      return sum;
    }, 0);
    
    const totalTokensEarned = progressRecords.reduce((sum, p) => {
      if (p.completed && p.rewardsClaimed) {
        const module = modulesMap.get(p.moduleId);
        return sum + (module?.tokenReward || 0);
      }
      return sum;
    }, 0);
    
    const totalSystemModules = allModules.length;
    const completionRate = totalSystemModules > 0 ? Math.round((completedModulesCount / totalSystemModules) * 100) : 0;

    const stats = {
      userId,
      completedModules: completedModulesCount,
      totalModules: totalSystemModules,
      completionRate,
      totalXP,
      totalTokensEarned,
      badgesEarned: progressRecords.filter(p => {
        if (p.completed && p.rewardsClaimed) {
          const module = modulesMap.get(p.moduleId);
          return !!module?.badgeId;
        }
        return false;
      }).length
    };
    
    res.status(200).json({
      stats,
      progress: progressWithModuleInfo
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
};

/**
 * Get learning leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const allProgressRecords = await learningDao.getAllUserProgressRecordsGlobally();
    const allModules = await learningDao.getAllLearningModules();
    const modulesMap = new Map(allModules.map(m => [m.id, m]));

    const userStatsAggregated: Record<string, {
      userId: string;
      completedModules: number;
      totalXP: number;
      totalScore: number;
      moduleCount: number;
      averageScore?: number; // Make optional as it's calculated
    }> = {};

    for (const progress of allProgressRecords) {
      if (!userStatsAggregated[progress.userId]) {
        userStatsAggregated[progress.userId] = {
          userId: progress.userId,
          completedModules: 0,
          totalXP: 0,
          totalScore: 0,
          moduleCount: 0
        };
      }
      
      const userAgg = userStatsAggregated[progress.userId];
      if (progress.completed) {
        userAgg.completedModules++;
      }
      
      if (progress.completed && progress.rewardsClaimed) {
        const module = modulesMap.get(progress.moduleId);
        if (module) {
          userAgg.totalXP += module.xpReward || 0;
        }
      }
      userAgg.totalScore += progress.score || 0;
      userAgg.moduleCount++;
    }
    
    const leaderboard = Object.values(userStatsAggregated).map(userAgg => ({
      ...userAgg,
      averageScore: userAgg.moduleCount > 0 ? Math.round(userAgg.totalScore / userAgg.moduleCount) : 0
    })).sort((a, b) => b.totalXP - a.totalXP); // Sort by XP
    
    const leaderboardWithRank = await Promise.all(leaderboard.map(async (entry, index) => {
      const wallet = await walletDao.getWalletByAddress(entry.userId);
      return {
        ...entry,
        rank: index + 1,
        username: wallet ? shortenAddress(entry.userId) : 'Unknown User',
        address: entry.userId // Added for clarity, though userId is the address
      };
    }));
    
    res.status(200).json(leaderboardWithRank);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

// Helper function to shorten addresses for display
function shortenAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Get user learning statistics
 */
export const getUserLearningStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const wallet = await walletDao.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }

    const allUserProgress = await learningDao.getAllUserProgress(userId);
    const allModules = await learningDao.getAllLearningModules(); // Fetch all modules to map details
    const modulesMap = new Map(allModules.map(m => [m.id, m]));

    let completedModules = 0;
    let totalXP = 0;
    let totalScoreSum = 0;
    let modulesAttemptedCount = 0;
    let lastActivityTimestamp = 0;
    const earnedBadgeIds = new Set<string>();

    for (const progress of allUserProgress) {
      if (progress.completed) {
        completedModules++;
        const module = modulesMap.get(progress.moduleId);
        if (module) {
          if (progress.rewardsClaimed) {
            totalXP += module.xpReward || 0;
          }
          if (module.badgeId) {
            earnedBadgeIds.add(module.badgeId);
          }
        }
      }
      if (progress.attemptsCount > 0) { // Consider only attempted modules for avgScore
          totalScoreSum += progress.score || 0;
          modulesAttemptedCount++;
      }
      if (progress.lastAttemptDate > lastActivityTimestamp) {
        lastActivityTimestamp = progress.lastAttemptDate;
      }
    }

    const avgScore = modulesAttemptedCount > 0 ? Math.round(totalScoreSum / modulesAttemptedCount) : 0;

    // Leaderboard Rank calculation
    const allGlobalProgress = await learningDao.getAllUserProgressRecordsGlobally();
    const userXpMap: Record<string, number> = {};
    for (const prog of allGlobalProgress) {
        if (prog.completed && prog.rewardsClaimed) {
            const module = modulesMap.get(prog.moduleId); // Use the same modulesMap
            if (module) {
                userXpMap[prog.userId] = (userXpMap[prog.userId] || 0) + (module.xpReward || 0);
            }
        }
    }
    const sortedUsersByXp = Object.entries(userXpMap).sort((a, b) => b[1] - a[1]);
    let leaderboardRank = -1;
    const userRankIndex = sortedUsersByXp.findIndex(entry => entry[0] === userId);
    if (userRankIndex !== -1) {
        leaderboardRank = userRankIndex + 1;
    }

    const currentStreak = 0; // Mocked: Needs dedicated tracking
    const timeSpent = 0; // Mocked: in minutes, needs dedicated tracking
    const recentProgress = { // Mocked: Needs more specific definition or tracking
        modulesThisWeek: 0,
        pointsThisWeek: 0,
        perfectScores: 0
    };

    const achievements = Array.from(earnedBadgeIds).map(badgeId => {
        const module = allModules.find(m => m.badgeId === badgeId);
        return {
            id: badgeId,
            name: module?.title ? `${module.title} Badge` : badgeId,
            earnedAt: new Date(), // Placeholder: actual earnedAt would need to be stored
            chainVerified: true // Placeholder
        };
    });

    res.status(200).json({
      userId,
      completedModules,
      totalModules: allModules.length,
      currentStreak,
      totalPoints: totalXP,
      leaderboardRank: leaderboardRank > 0 ? leaderboardRank : "N/A",
      timeSpent,
      avgScore,
      lastActivity: lastActivityTimestamp > 0 ? new Date(lastActivityTimestamp).toISOString() : "N/A",
      achievements,
      recentProgress,
    });

  } catch (error) {
    console.error('Error getting user learning stats:', error);
    res.status(500).json({ error: 'Failed to fetch user learning stats' });
  }
};