import express from 'express';
import { createOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST a new order
router.post('/', authenticate, createOrder);

export default router;