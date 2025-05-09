import express from 'express';
import * as authController from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

/**
 * Login to account
 * POST /api/auth/login
 */
router.post('/login', authController.login);

/**
 * Logout from account
 * POST /api/auth/logout
 */
router.post('/logout', authController.logout);

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 */
router.post('/refresh', authenticateJWT, authController.refreshToken);

export default router;