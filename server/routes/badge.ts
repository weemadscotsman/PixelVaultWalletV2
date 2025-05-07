import express from 'express';
import * as badgeController from '../controllers/badgeController';

const router = express.Router();

// Get all visible badges
router.get('/badges', badgeController.getAllBadges);

// Get badges by type
router.get('/badges/type/:type', badgeController.getBadgesByType);

// Get badge by ID
router.get('/badges/:id', badgeController.getBadgeById);

// Create a new badge (admin only)
router.post('/badges', badgeController.createBadge);

// Get badges for a specific user
router.get('/user-badges/:userId', badgeController.getUserBadges);

// Award a badge to a user
router.post('/award-badge', badgeController.awardBadgeToUser);

// Update badge progress
router.post('/update-progress', badgeController.updateBadgeProgress);

export default router;