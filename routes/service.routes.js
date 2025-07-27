import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/service.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// Get all services (can be filtered by providerId)
router.get('/', getServices);

// Get a single service by ID
router.get('/:id', getServiceById);

// Create a new service (Provider only)
router.post('/', authenticate, authorize('provider'), upload.single('serviceImage'), createService);

// Update a service (Provider only, and only their own services)
router.patch('/:id', authenticate, authorize('provider'), updateService);

// Delete a service (Provider only, and only their own services)
router.delete('/:id', authenticate, authorize('provider'), deleteService);

export default router;
