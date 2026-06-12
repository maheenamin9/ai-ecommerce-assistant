import express from 'express';
import protect from '../middleware/auth.js';
import { reserve, release } from '../controllers/reservationController.js';

const router = express.Router();
router.use(protect);
router.post('/', reserve);
router.delete('/', release);

export default router;
