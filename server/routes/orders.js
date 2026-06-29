import express from 'express';
import { getOrders, getOrder, getAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import protect, { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getOrders);
router.get('/admin', requireAdmin, getAllOrders);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.get('/:id', getOrder);

export default router;
