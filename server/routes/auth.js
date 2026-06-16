import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Strict — prevents brute force on login/register only
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
});

// Looser — verifying a link or requesting a resend isn't a credential guess
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again in 15 minutes.' },
});

router.post('/register', credentialsLimiter, register);
router.post('/login', credentialsLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/verify/:token', verificationLimiter, verifyEmail);
router.post('/resend-verification', verificationLimiter, resendVerification);
router.post('/forgot-password', verificationLimiter, forgotPassword);
router.post('/reset-password', credentialsLimiter, resetPassword);

export default router;
