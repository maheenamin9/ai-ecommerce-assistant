import Reservation from '../models/Reservation.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const RESERVATION_TTL_MS = 15 * 60 * 1000;

// Atomically increment reservedStock only if reservedStock + qty <= stock
const tryAtomicReserve = (productId, quantity) =>
  Product.findOneAndUpdate(
    {
      _id: productId,
      isActive: true,
      $expr: { $lte: [{ $add: ['$reservedStock', quantity] }, '$stock'] },
    },
    { $inc: { reservedStock: quantity } },
    { new: true }
  );

// Recompute reservedStock from actual active Reservation documents.
// Called when atomic reserve fails — fixes stale counts left by TTL-expired reservations.
const recalibrate = async (productId) => {
  const result = await Reservation.aggregate([
    { $match: { expiresAt: { $gt: new Date() } } },
    { $unwind: '$items' },
    { $match: { 'items.product': new mongoose.Types.ObjectId(productId.toString()) } },
    { $group: { _id: null, total: { $sum: '$items.quantity' } } },
  ]);
  const actualReserved = result[0]?.total ?? 0;
  // $min only lowers the counter — never inflates it
  await Product.updateOne({ _id: productId }, { $min: { reservedStock: actualReserved } });
};

// Safe decrement — no-op if reservedStock is already lower than quantity
const decrementReservedStock = (items) =>
  Promise.all(
    items.map(({ product, quantity }) =>
      Product.updateOne(
        { _id: product, reservedStock: { $gte: quantity } },
        { $inc: { reservedStock: -quantity } }
      )
    )
  );

export const reserve = async (req, res) => {
  const { items } = req.body;
  const userId = req.user._id;

  if (!items?.length) return res.status(400).json({ error: 'No items provided' });

  try {
    // Release any existing reservation so its reservedStock doesn't double-count
    const existing = await Reservation.findOneAndDelete({ userId });
    if (existing) await decrementReservedStock(existing.items);

    const unavailable = [];
    const reserved = []; // track successful reserves for rollback if a later item fails

    for (const { product, name, quantity } of items) {
      let updated = await tryAtomicReserve(product, quantity);

      if (!updated) {
        // Atomic check failed — could be stale reservedStock from a TTL-expired reservation
        await recalibrate(product);
        updated = await tryAtomicReserve(product, quantity);
      }

      if (updated) {
        reserved.push({ product, quantity });
      } else {
        const p = await Product.findById(product, 'name stock reservedStock');
        const available = p ? Math.max(0, p.stock - p.reservedStock) : 0;
        unavailable.push({ name: p?.name ?? name, available });
      }
    }

    if (unavailable.length > 0) {
      // Roll back reservedStock increments for items that succeeded in this request
      await decrementReservedStock(reserved);
      return res.status(409).json({ error: 'Some items are no longer available', unavailable });
    }

    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
    await Reservation.create({
      userId,
      items: items.map(({ product, quantity }) => ({ product, quantity })),
      paymentIntentId: null,
      expiresAt,
    });

    res.json({ expiresAt });
  } catch (error) {
    console.error('Reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
};

export const release = async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndDelete({ userId: req.user._id });
    if (reservation) await decrementReservedStock(reservation.items);
    res.json({ released: true });
  } catch (error) {
    console.error('Release error:', error);
    res.status(500).json({ error: 'Failed to release reservation' });
  }
};
