import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFICATION_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

const createVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: TOKEN_MAX_AGE_MS,
};

const sendTokenCookie = (res, token) => res.cookie('token', token, cookieOptions);

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const { rawToken, hashedToken } = createVerificationToken();

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hashedToken,
      verificationExpires: Date.now() + VERIFICATION_TOKEN_MAX_AGE_MS,
    });

    await sendVerificationEmail(user.email, rawToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.isVerified)
      return res.status(403).json({ error: 'Please verify your email before logging in' });

    sendTokenCookie(res, signToken(user._id));
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() },
    }).select('+verificationToken +verificationExpires');

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error.message);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    // Same response whether the account exists or not — avoids leaking which emails are registered
    if (!user || user.isVerified) {
      return res.json({ message: 'If that account exists and is unverified, a new email has been sent.' });
    }

    const { rawToken, hashedToken } = createVerificationToken();
    user.verificationToken = hashedToken;
    user.verificationExpires = Date.now() + VERIFICATION_TOKEN_MAX_AGE_MS;
    await user.save();

    await sendVerificationEmail(user.email, rawToken);

    res.json({ message: 'If that account exists and is unverified, a new email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error.message);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    // Same response whether the account exists or not — avoids leaking which emails are registered
    if (user) {
      const { rawToken, hashedToken } = createVerificationToken();
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + RESET_TOKEN_MAX_AGE_MS;
      await user.save();
      await sendPasswordResetEmail(user.email, rawToken);
    }

    res.json({ message: 'If that account exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    user.password = password; // pre('save') hook re-hashes this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const logout = (_req, res) => {
  res.clearCookie('token', cookieOptions);
  res.sendStatus(204);
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
