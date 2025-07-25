import express from 'express';
import {
  createCheckoutSession,
  stripeWebhook,
} from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', stripeWebhook);

export default router;
