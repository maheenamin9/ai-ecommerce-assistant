import Stripe from 'stripe';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payments/create-intent
 * Creates a Stripe payment intent and a pending Order in DB.
 * Returns { clientSecret, orderId } to the frontend.
 */
export const createPaymentIntent = async (req, res) => {
  const { sessionId, items, shippingAddress } = req.body;

  if (!items?.length || !shippingAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Fetch authoritative prices and stock in one query — client-supplied price is never used
    const productIds = items.map(({ product }) => product);
    const products = await Product.find(
      { _id: { $in: productIds }, isActive: true },
      'name price stock'
    );
    const priceMap = new Map(products.map((p) => [p._id.toString(), p]));

    const missingProduct = items.find(({ product }) => !priceMap.has(product.toString()));
    if (missingProduct) {
      return res.status(400).json({ error: 'One or more products are unavailable' });
    }

    // If user has a valid reservation (created when checkout modal opened), trust it.
    // Otherwise fall back to a direct stock check.
    const reservation = await Reservation.findOne({
      userId: req.user._id,
      expiresAt: { $gt: new Date() },
    });

    if (!reservation) {
      const outOfStock = items.find(
        ({ product, quantity }) => priceMap.get(product.toString()).stock < quantity
      );
      if (outOfStock) {
        return res.status(400).json({
          error: `"${priceMap.get(outOfStock.product.toString()).name}" is out of stock`,
        });
      }
    }

    const serverTotal = items.reduce(
      (sum, { product, quantity }) => sum + priceMap.get(product.toString()).price * quantity,
      0
    );

    // Idempotency: if this sessionId already has a pending order, return it without
    // creating a second Stripe payment intent or orphaned order.
    if (sessionId) {
      const existing = await Order.findOne({ sessionId, userId: req.user._id });
      if (existing) {
        const existingPi = await getStripe().paymentIntents.retrieve(existing.paymentIntentId);
        return res.json({ clientSecret: existingPi.client_secret, orderId: existing._id });
      }
    }

    // Create the Stripe payment intent (amount in cents)
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(serverTotal * 100),
      currency: 'usd',
      metadata: { sessionId },
    });

    // Link the payment intent to the reservation so the webhook can clean it up
    if (reservation) {
      await Reservation.findOneAndUpdate(
        { userId: req.user._id },
        { paymentIntentId: paymentIntent.id }
      );
    }

    // Save a pending order so we can confirm it after payment
    let order;
    try {
      order = await Order.create({
        userId: req.user._id,
        sessionId,
        items,
        totalPrice: serverTotal,
        shippingAddress,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'pending',
        status: 'pending',
      });
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        // Two requests raced past the idempotency check above. Cancel the PI we just
        // created (it's the orphan) and return the order that won the insert.
        await getStripe().paymentIntents.cancel(paymentIntent.id);
        const existing = await Order.findOne({ sessionId, userId: req.user._id });
        const existingPi = await getStripe().paymentIntents.retrieve(existing.paymentIntentId);
        return res.json({ clientSecret: existingPi.client_secret, orderId: existing._id });
      }
      throw dupErr;
    }

    res.json({ clientSecret: paymentIntent.client_secret, orderId: order._id });
  } catch (error) {
    console.error('Create payment intent error:', error.message);
    res.status(500).json({
      error: 'Failed to create payment intent',
      ...(process.env.NODE_ENV === 'development' && { detail: error.message }),
    });
  }
};

/**
 * POST /api/payments/webhook
 * Stripe calls this when a payment event occurs.
 * On success: marks order paid + decrements stock.
 * Requires raw body — registered before express.json() in server.js.
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature error:', error.message);
    return res.status(400).json({ error: `Webhook error: ${error.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (!order) return res.json({ received: true });
    if (order.paymentStatus === 'paid') return res.json({ received: true });

    // Mark order as paid
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();

    // Atomic conditional decrement — if stock ran out between checkout and payment
    // (race condition), the update returns null for that item
    const decrements = await Promise.all(
      order.items.map(({ product, quantity }) =>
        Product.findOneAndUpdate(
          { _id: product, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true }
        )
      )
    );

    const failedItem = decrements.findIndex((p) => !p);
    if (failedItem !== -1) {
      order.status = 'cancelled';
      order.paymentStatus = 'refund_required';
      await order.save();
      await getStripe().refunds.create({ payment_intent: paymentIntent.id });
      return res.json({ received: true });
    }

    // Decrement reservedStock and delete the reservation
    await Promise.all(
      order.items.map(({ product, quantity }) =>
        Product.updateOne(
          { _id: product, reservedStock: { $gte: quantity } },
          { $inc: { reservedStock: -quantity } }
        )
      )
    );
    await Reservation.deleteOne({ paymentIntentId: paymentIntent.id });

    // Best-effort — a failed email shouldn't fail the webhook ack and trigger a Stripe retry
    try {
      const user = await User.findById(order.userId);
      if (user) await sendOrderConfirmationEmail(user.email, order);
    } catch (error) {
      console.error('Order confirmation email error:', error.message);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    await Order.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      { paymentStatus: 'failed', status: 'cancelled' }
    );
  }

  res.json({ received: true });
};
