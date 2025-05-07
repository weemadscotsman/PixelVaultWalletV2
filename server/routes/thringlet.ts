import express from 'express';
import * as thringletController from '../controllers/thringletController';

const router = express.Router();

/**
 * Send input to thringlet emotion engine
 * POST /api/thringlet/input
 */
router.post('/input', thringletController.processInput);

/**
 * Get current thringlet status
 * GET /api/thringlet/status
 */
router.get('/status', thringletController.getStatus);

/**
 * Get thringlet emotion history
 * GET /api/thringlet/emotions/:id
 */
router.get('/emotions/:id', thringletController.getEmotionHistory);

/**
 * Create new thringlet
 * POST /api/thringlet/create
 */
router.post('/create', thringletController.createThringlet);

export default router;