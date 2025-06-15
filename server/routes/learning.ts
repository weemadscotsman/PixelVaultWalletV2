import express from 'express';
import { 
  getAllModules,
  getModuleById,
  startModule,
  submitModuleAnswers,
  claimModuleRewards,
  getUserProgress,
  // getUserProgress, // Removed duplicate
  getLeaderboard,
  getUserLearningStats // Import the new controller function
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
router.get('/stats/:userId', getUserLearningStats); // Use the new controller function

// Get learning leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;
// Removed extraneous lines below