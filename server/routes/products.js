import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  seedProducts,
} from '../controllers/productController.js';
import protect, { requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/', protect, requireAdmin, createProduct);
router.post('/seed', protect, requireAdmin, seedProducts);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

export default router;
