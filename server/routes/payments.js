import express from 'express';
import { createPaymentIntent, createCodOrder, handleWebhook } from '../controllers/paymentController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Webhook: raw body required — Stripe uses it to verify the signature
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Create payment intent: protected — user must be logged in
router.post('/create-intent', protect, createPaymentIntent);

// Cash on delivery: no Stripe involved, order is confirmed immediately
router.post('/cod', protect, createCodOrder);

export default router;
