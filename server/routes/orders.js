import express from 'express';
import { getOrders, getOrder } from '../controllers/orderController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrder);

export default router;
