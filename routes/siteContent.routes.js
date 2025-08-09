import express from 'express';
import { getContent, updateContent } from '../controllers/siteContent.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET content by title (publicly accessible)
router.get('/:title', getContent);

// POST to create or update content (admin only)
router.post('/', authenticate, authorize('admin'), updateContent);

export default router;