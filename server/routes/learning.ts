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
    const stats = {
      completedModules: 5,
      totalModules: 12,
      currentStreak: 7,
      totalPoints: 2400,
      leaderboardRank: 2,
      achievements: [
        { id: 1, name: "Quick Learner", earnedAt: new Date() },
        { id: 2, name: "Consistency King", earnedAt: new Date(Date.now() - 86400000) }
      ]
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning stats' });
  }
});

// Get learning leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;