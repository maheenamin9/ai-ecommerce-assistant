import express from 'express';
import { createPaymentIntent, handleWebhook } from '../controllers/paymentController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Webhook: raw body required — Stripe uses it to verify the signature
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Create payment intent: protected — user must be logged in
router.post('/create-intent', protect, createPaymentIntent);

export default router;
