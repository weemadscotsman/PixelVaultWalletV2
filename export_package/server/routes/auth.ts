import express from 'express';
import * as authController from '../controllers/authController';

const router = express.Router();

/**
 * Login to account
 * POST /api/auth/login
 */
router.post('/login', authController.login);

/**
 * Register a new account
 * POST /api/auth/register
 */
router.post('/register', authController.register);

/**
 * Logout from account
 * POST /api/auth/logout
 */
router.post('/logout', authController.logout);

/**
 * Get current user info
 * GET /api/auth/user
 */
router.get('/user', authController.getCurrentUser);

export default router;