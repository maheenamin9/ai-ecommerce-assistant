import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import reservationRoutes from './routes/reservations.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// Stripe webhook needs raw body BEFORE express.json() parses it
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rate limiters ---
// Auth route has its own per-action limiters (see routes/auth.js) since /me, /verify,
// and /resend-verification are called far more often than login/register and shouldn't
// share that strict 20-per-15min budget.

// Chat: protects OpenAI bill — 30 messages per minute per user
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many messages, please slow down.' },
});

// General API: broad protection for products, orders etc.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/products', generalLimiter, productRoutes);
app.use('/api/orders', generalLimiter, orderRoutes);
app.use('/api/payments', generalLimiter, paymentRoutes);
app.use('/api/reservations', generalLimiter, reservationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
