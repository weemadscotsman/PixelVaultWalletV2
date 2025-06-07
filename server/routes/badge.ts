import { Router } from 'express';
import * as badgeController from '../controllers/badgeController';

const router = Router();

// Get all visible badges
router.get('/', async (req, res) => {
  await badgeController.getAllBadges(req, res);
});

// Get badges by type
router.get('/type/:type', async (req, res) => {
  await badgeController.getBadgesByType(req, res);
});

// Get a single badge by ID
router.get('/:id', async (req, res) => {
  await badgeController.getBadgeById(req, res);
});

// Get all badges for a user
router.get('/user/:userId', async (req, res) => {
  await badgeController.getUserBadges(req, res);
});

// Get badge progress for a user
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = {
      totalBadges: 25,
      earnedBadges: 8,
      completionRate: 32,
      recentBadges: [
        { id: 1, name: "First Mining", earnedAt: new Date() },
        { id: 2, name: "50 Blocks Mined", earnedAt: new Date(Date.now() - 86400000) }
      ]
    };
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badge progress' });
  }
});

// Get badge leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = [
      { rank: 1, address: "PVX_1295b5490224b2eb64e9724dc091795a", badges: 15, points: 2400 },
      { rank: 2, address: "PVX_a7b034989738e2f0f9e4bf53358dc79f", badges: 8, points: 1200 },
      { rank: 3, address: "PVX_c1989203fab278dff8ef2cb0def8678d", badges: 6, points: 900 }
    ];
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch badge leaderboard' });
  }
});

// Award a badge to a user
router.post('/award', async (req, res) => {
  await badgeController.awardBadgeToUser(req, res);
});

// Update badge progress
router.post('/progress', async (req, res) => {
  await badgeController.updateBadgeProgress(req, res);
});

export default router;