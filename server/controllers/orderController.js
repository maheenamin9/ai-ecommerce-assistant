import Order from '../models/Order.js';
import User from '../models/User.js';
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '../services/emailService.js';

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!order.userId.equals(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Admin: list all orders across all users, optionally filtered by status
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const ORDER_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

// Forward-only: can't move backward or out of a terminal state (delivered/cancelled).
// Cancellation is allowed from any non-terminal state.
const isValidTransition = (current, next) => {
  if (current === 'delivered' || current === 'cancelled') return false;
  if (next === 'cancelled') return true;
  const nextIdx = ORDER_FLOW.indexOf(next);
  if (nextIdx === -1) return false;
  return nextIdx > ORDER_FLOW.indexOf(current);
};

// Admin: transition an order's status, optionally attaching tracking info.
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, carrier } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!isValidTransition(order.status, status)) {
      return res.status(400).json({ error: `Cannot transition from "${order.status}" to "${status}"` });
    }
    if (status === 'shipped' && !trackingNumber && !order.trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required to mark an order as shipped' });
    }

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    await order.save();

    if (status === 'shipped' || status === 'delivered') {
      try {
        const user = await User.findById(order.userId);
        if (user) {
          if (status === 'shipped') await sendOrderShippedEmail(user.email, order);
          else await sendOrderDeliveredEmail(user.email, order);
        }
      } catch (error) {
        console.error('Order status email error:', error.message);
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
