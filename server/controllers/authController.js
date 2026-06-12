import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

    const user = await User.create({ name, email, password });
    sendTokenCookie(res, signToken(user._id));

    res.status(201).json({ user });
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

    sendTokenCookie(res, signToken(user._id));
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const logout = (_req, res) => {
  res.clearCookie('token', cookieOptions);
  res.sendStatus(204);
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
