import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
    },
  ],
  paymentIntentId: { type: String, default: null },
  expiresAt: { type: Date, required: true },
});

// MongoDB auto-deletes documents when expiresAt is reached
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
reservationSchema.index({ 'items.product': 1 });
reservationSchema.index({ paymentIntentId: 1 }, { sparse: true });

export default mongoose.model('Reservation', reservationSchema);
