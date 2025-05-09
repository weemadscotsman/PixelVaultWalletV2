import { Request, Response } from 'express';
import crypto from 'crypto';
import { memBlockchainStorage } from '../mem-blockchain';
import { broadcastTransaction } from '../utils/websocket';
import { PVX_GENESIS_ADDRESS } from '../utils/constants';
import { updateBadgeStatus } from '../services/badge-service';
import { generateRandomHash } from '../utils/crypto';

// Define TransactionType as string literals since the enum is not available
const TransactionType = {
  TRANSFER: 'TRANSFER',
  MINING_REWARD: 'MINING_REWARD',
  STAKING_REWARD: 'STAKING_REWARD',
  AIRDROP: 'AIRDROP',
  NFT_MINT: 'NFT_MINT',
  BADGE_AWARD: 'BADGE_AWARD',
  GOVERNANCE_VOTE: 'GOVERNANCE_VOTE',
  GOVERNANCE_PROPOSAL: 'GOVERNANCE_PROPOSAL'
};

// Learning module interface
interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'quiz' | 'interactive' | 'tutorial' | 'challenge';
  xpReward: number;
  tokenReward: number;
  badgeId?: string;
  questions?: LearningQuestion[];
  completionCriteria?: {
    minScore: number;
    timeLimit?: number;
  };
}

// Learning question interface
interface LearningQuestion {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

// User progress interface
interface UserProgress {
  userId: string;
  moduleId: string;
  completed: boolean;
  score: number;
  attemptsCount: number;
  lastAttemptDate: number;
  rewardsClaimed: boolean;
}

// In-memory storage for learning modules and user progress
const learningModules: LearningModule[] = [
  {
    id: 'mod_blockchain_basics',
    title: 'Blockchain Fundamentals',
    description: 'Learn the core concepts behind blockchain technology and how it works.',
    difficulty: 'beginner',
    type: 'quiz',
    xpReward: 100,
    tokenReward: 50,
    badgeId: 'blockchain_basics',
    questions: [
      {
        id: 'q1',
        text: 'What is a blockchain?',
        options: [
          'A type of database that stores information in blocks that are chained together',
          'A programming language for creating decentralized applications',
          'A digital currency like Bitcoin',
          'A company that mines cryptocurrency'
        ],
        correctOption: 0,
        explanation: 'A blockchain is a distributed ledger technology that stores data in blocks linked together using cryptography.'
      },
      {
        id: 'q2',
        text: 'What is a consensus mechanism?',
        options: [
          'A voting system for blockchain governance',
          'A process for nodes to agree on the state of the blockchain',
          'A way to mine new coins',
          'A security protocol for private keys'
        ],
        correctOption: 1,
        explanation: 'Consensus mechanisms are protocols that ensure all nodes in the network agree on which transactions are valid.'
      },
      {
        id: 'q3',
        text: 'What is a private key in blockchain?',
        options: [
          'A password to log into a blockchain explorer',
          'A unique identifier for a blockchain node',
          'A cryptographic key that gives access to your crypto assets',
          'A key used by miners to unlock new blocks'
        ],
        correctOption: 2,
        explanation: 'A private key is a secure digital code that allows you to access and manage your crypto assets.'
      }
    ],
    completionCriteria: {
      minScore: 70 // Percentage
    }
  },
  {
    id: 'mod_crypto_security',
    title: 'Cryptographic Security',
    description: 'Understand the security principles behind blockchain and best practices for wallet security.',
    difficulty: 'intermediate',
    type: 'quiz',
    xpReward: 150,
    tokenReward: 100,
    badgeId: 'crypto_security',
    questions: [
      {
        id: 'q1',
        text: 'What is a public key used for?',
        options: [
          'Signing transactions',
          'Receiving cryptocurrency',
          'Mining new blocks',
          'Encrypting private messages'
        ],
        correctOption: 1,
        explanation: 'Public keys are used to derive addresses where others can send cryptocurrency to you.'
      },
      {
        id: 'q2',
        text: 'Which of the following is the most secure way to store your private keys?',
        options: [
          'In a text file on your desktop',
          'Written on paper stored in a secure location',
          'In an email draft',
          'Shared with a trusted friend for backup'
        ],
        correctOption: 1,
        explanation: 'Hardware wallets or offline storage (cold storage) such as paper wallets are the most secure options.'
      },
      {
        id: 'q3',
        text: 'What is a seed phrase?',
        options: [
          'A random set of words used to initialize a blockchain',
          'A set of words that can be used to recover your private keys',
          'A password for mining pools',
          'The first block in a new blockchain'
        ],
        correctOption: 1,
        explanation: 'A seed phrase (or recovery phrase) is a list of words that store all the information needed to recover a wallet.'
      }
    ],
    completionCriteria: {
      minScore: 80
    }
  },
  {
    id: 'mod_defi_basics',
    title: 'DeFi Fundamentals',
    description: 'Explore the world of Decentralized Finance and understand concepts like liquidity, staking, and yield farming.',
    difficulty: 'advanced',
    type: 'interactive',
    xpReward: 200,
    tokenReward: 150,
    badgeId: 'defi_explorer',
    completionCriteria: {
      minScore: 85
    }
  }
];

// In-memory storage for user progress
const userProgress: UserProgress[] = [];

/**
 * Get all learning modules
 */
export const getAllModules = async (req: Request, res: Response): Promise<void> => {
  try {
    // Don't send questions to client until they start the module
    const sanitizedModules = learningModules.map(({ questions, ...rest }) => ({
      ...rest,
      questionCount: questions?.length || 0
    }));
    
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
    const module = learningModules.find(m => m.id === moduleId);
    
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    // For quiz modules, send everything except the correct answers
    if (module.type === 'quiz' && module.questions) {
      const sanitizedQuestions = module.questions.map(({ correctOption, explanation, ...rest }) => rest);
      
      const sanitizedModule = {
        ...module,
        questions: sanitizedQuestions
      };
      
      res.status(200).json(sanitizedModule);
    } else {
      res.status(200).json(module);
    }
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
    
    // Check if module exists
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    // Check if user has already completed this module
    const existingProgress = userProgress.find(p => p.userId === userId && p.moduleId === moduleId);
    
    if (existingProgress && existingProgress.completed && existingProgress.rewardsClaimed) {
      res.status(200).json({
        alreadyCompleted: true,
        message: 'You have already completed this module and claimed rewards.',
        progress: existingProgress
      });
      return;
    }
    
    // If there's existing progress but not completed, return that
    if (existingProgress) {
      res.status(200).json({
        message: 'Resuming module',
        progress: existingProgress
      });
      return;
    }
    
    // Create new progress entry
    const newProgress: UserProgress = {
      userId,
      moduleId,
      completed: false,
      score: 0,
      attemptsCount: 0,
      lastAttemptDate: Date.now(),
      rewardsClaimed: false
    };
    
    userProgress.push(newProgress);
    
    res.status(201).json({
      message: 'Module started successfully',
      progress: newProgress
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
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(userId);
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
    let progress = userProgress.find(p => p.userId === userId && p.moduleId === moduleId);
    
    if (!progress) {
      progress = {
        userId,
        moduleId,
        completed: false,
        score: 0,
        attemptsCount: 0,
        lastAttemptDate: Date.now(),
        rewardsClaimed: false
      };
      userProgress.push(progress);
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
    progress.score = Math.max(progress.score, score);  // Keep highest score
    progress.attemptsCount++;
    progress.lastAttemptDate = Date.now();
    
    // Check if passed
    const passed = score >= (module.completionCriteria?.minScore || 70);
    progress.completed = passed;
    
    const response: any = {
      score,
      results,
      passed,
      progress
    };
    
    // If passed, offer to claim rewards
    if (passed && !progress.rewardsClaimed) {
      response.rewards = {
        xp: module.xpReward,
        tokens: module.tokenReward,
        badge: module.badgeId ? { id: module.badgeId } : null
      };
      response.message = 'Congratulations! You passed the module and can claim rewards.';
    } else if (passed) {
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
    
    // Check if module exists
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) {
      res.status(404).json({ error: 'Learning module not found' });
      return;
    }
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    // Find user progress
    const progress = userProgress.find(p => p.userId === userId && p.moduleId === moduleId);
    
    if (!progress) {
      res.status(404).json({ error: 'No progress found for this module' });
      return;
    }
    
    // Check if completed
    if (!progress.completed) {
      res.status(400).json({ error: 'You must complete the module before claiming rewards' });
      return;
    }
    
    // Check if already claimed
    if (progress.rewardsClaimed) {
      res.status(400).json({ error: 'Rewards have already been claimed for this module' });
      return;
    }
    
    // Prepare rewards
    const now = Date.now();
    const rewards = {
      xp: module.xpReward,
      tokens: module.tokenReward,
      badge: module.badgeId
    };
    
    // Mark as claimed
    progress.rewardsClaimed = true;
    
    // Create a transaction for the token reward
    const txHash = crypto.createHash('sha256')
      .update(`learning_reward_${moduleId}_${userId}_${now}`)
      .digest('hex');
    
    const transaction = {
      hash: txHash,
      type: TransactionType.REWARD,
      from: PVX_GENESIS_ADDRESS,
      to: userId,
      amount: module.tokenReward,
      timestamp: now,
      nonce: Math.floor(Math.random() * 100000),
      signature: generateRandomHash(),
      status: 'confirmed',
      metadata: {
        source: 'learning_lab',
        moduleId,
        moduleTitle: module.title
      }
    };
    
    // Add transaction to the blockchain
    await memBlockchainStorage.createTransaction(transaction);
    
    // Update wallet balance
    const newBalance = BigInt(wallet.balance) + BigInt(module.tokenReward);
    wallet.balance = newBalance.toString();
    wallet.lastSynced = new Date(now);
    await memBlockchainStorage.updateWallet(wallet);
    
    // Award badge if applicable
    if (module.badgeId) {
      await updateBadgeStatus(userId, module.badgeId, true);
    }
    
    // Broadcast transaction via WebSocket
    try {
      broadcastTransaction(transaction);
    } catch (err) {
      console.error('Error broadcasting learning reward transaction:', err);
      // Continue even if broadcast fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Rewards claimed successfully',
      rewards,
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
    
    // Check if wallet exists
    const wallet = await memBlockchainStorage.getWalletByAddress(userId);
    if (!wallet) {
      res.status(404).json({ error: 'User wallet not found' });
      return;
    }
    
    // Get user progress for all modules
    const progress = userProgress.filter(p => p.userId === userId);
    
    // Add module info to progress
    const progressWithModuleInfo = progress.map(p => {
      const module = learningModules.find(m => m.id === p.moduleId);
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
    
    // Calculate stats
    const completedModules = progress.filter(p => p.completed).length;
    const totalXP = progress.reduce((sum, p) => {
      if (p.completed && p.rewardsClaimed) {
        const module = learningModules.find(m => m.id === p.moduleId);
        return sum + (module?.xpReward || 0);
      }
      return sum;
    }, 0);
    
    const totalTokensEarned = progress.reduce((sum, p) => {
      if (p.completed && p.rewardsClaimed) {
        const module = learningModules.find(m => m.id === p.moduleId);
        return sum + (module?.tokenReward || 0);
      }
      return sum;
    }, 0);
    
    const stats = {
      userId,
      completedModules,
      totalModules: learningModules.length,
      completionRate: Math.round((completedModules / learningModules.length) * 100),
      totalXP,
      totalTokensEarned,
      badgesEarned: progress.filter(p => {
        if (p.completed && p.rewardsClaimed) {
          const module = learningModules.find(m => m.id === p.moduleId);
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
    // Group progress by user
    const userStats = userProgress.reduce((acc, progress) => {
      if (!acc[progress.userId]) {
        acc[progress.userId] = {
          userId: progress.userId,
          completedModules: 0,
          totalXP: 0,
          totalScore: 0,
          averageScore: 0,
          moduleCount: 0
        };
      }
      
      if (progress.completed) {
        acc[progress.userId].completedModules++;
      }
      
      if (progress.rewardsClaimed) {
        const module = learningModules.find(m => m.id === progress.moduleId);
        if (module) {
          acc[progress.userId].totalXP += module.xpReward;
        }
      }
      
      acc[progress.userId].totalScore += progress.score;
      acc[progress.userId].moduleCount++;
      acc[progress.userId].averageScore = Math.round(acc[progress.userId].totalScore / acc[progress.userId].moduleCount);
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by XP
    const leaderboard = Object.values(userStats).sort((a: any, b: any) => b.totalXP - a.totalXP);
    
    // Add rank and user info
    const leaderboardWithRank = await Promise.all(leaderboard.map(async (entry: any, index: number) => {
      const wallet = await memBlockchainStorage.getWalletByAddress(entry.userId);
      
      return {
        ...entry,
        rank: index + 1,
        username: wallet ? shortenAddress(entry.userId) : 'Unknown User'
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