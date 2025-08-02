import express from 'express';
import {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getDailyEarnings,
  getMonthlyEarnings,
  setProviderActiveStatus,
} from '../controllers/provider.controller.js';

import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// Specific routes should come before dynamic routes

// GET all providers
router.get('/', getProviders);

// PUT to set provider active status
router.put('/status', authenticate, setProviderActiveStatus);

// POST a new provider (No auth needed for creation)
router.post('/', upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'nid', maxCount: 1 }, { name: 'license', maxCount: 1 }, { name: 'addressprof', maxCount: 1 }]), createProvider);

// --- Dynamic routes with :id ---

// GET provider by ID
router.get('/:id', getProviderById);

// PUT to update a provider (Authenticated provider can update their own profile)
router.put('/:id', authenticate, upload.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'nid', maxCount: 1 }, { name: 'license', maxCount: 1 }, { name: 'addressprof', maxCount: 1 }]), updateProvider);

// DELETE a provider (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteProvider);

// Provider statistics
router.get('/:id/earnings/daily', authenticate, getDailyEarnings);
router.get('/:id/earnings/monthly', authenticate, getMonthlyEarnings);


export default router;