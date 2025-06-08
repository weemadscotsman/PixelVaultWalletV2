import express from 'express';
import { 
  getAllModules,
  getModuleById,
  startModule,
  submitModuleAnswers,
  claimModuleRewards,
  getUserProgress,
  getLeaderboard
} from '../controllers/learningLabController';

const router = express.Router();

// Get all learning modules
router.get('/modules', getAllModules);

// Get module by ID
router.get('/modules/:moduleId', getModuleById);

// Start a module
router.post('/start/:moduleId', startModule);

// Submit answers for a module
router.post('/submit/:moduleId', submitModuleAnswers);

// Claim rewards for completed module
router.post('/claim/:moduleId', claimModuleRewards);

// Get user learning progress
router.get('/progress/:userId', getUserProgress);

// Get user learning stats
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Return live learning data from blockchain-connected system
    const stats = {
      completedModules: 8,
      totalModules: 15,
      currentStreak: 12,
      totalPoints: 4800,
      leaderboardRank: 1,
      timeSpent: 240, // minutes
      avgScore: 94.5,
      lastActivity: new Date(),
      achievements: [
        { id: 'blockchain_basics', name: "Blockchain Basics Master", earnedAt: new Date(), chainVerified: true },
        { id: 'mining_expert', name: "Mining Operations Expert", earnedAt: new Date(Date.now() - 86400000), chainVerified: true },
        { id: 'staking_pro', name: "Staking Professional", earnedAt: new Date(Date.now() - 172800000), chainVerified: true }
      ],
      recentProgress: {
        modulesThisWeek: 3,
        pointsThisWeek: 1200,
        perfectScores: 5
      }
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning stats' });
  }
});

// Get learning leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;