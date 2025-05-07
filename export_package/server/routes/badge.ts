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

// Award a badge to a user
router.post('/award', async (req, res) => {
  await badgeController.awardBadgeToUser(req, res);
});

// Update badge progress
router.post('/progress', async (req, res) => {
  await badgeController.updateBadgeProgress(req, res);
});

export default router;