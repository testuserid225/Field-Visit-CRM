import express from 'express';
import { login, verify2FA, reset2FA, getMe, getUsers, toggleDuty } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/reset-2fa', reset2FA);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);
router.patch('/users/:userId/duty', protect, toggleDuty);

export default router;
