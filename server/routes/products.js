import express from 'express';
import { getProducts, getProduct, createProduct, getCategories, seedProducts } from '../controllers/productController.js';
import protect, { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/', protect, requireAdmin, createProduct);
router.post('/seed', protect, requireAdmin, seedProducts);

export default router;
