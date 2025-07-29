import express from 'express';
import { getMyNotifications, markNotificationAsRead } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get notifications for the authenticated user
router.get('/me', authenticate, getMyNotifications);

// Mark a notification as read
router.patch('/:id/read', authenticate, markNotificationAsRead);

export default router;
