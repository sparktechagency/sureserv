import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// GET all customers (Admin only)
router.get('/', authenticate, authorize('admin'), getCustomers);

// GET customer by ID (Authenticated user or Admin)
router.get('/:id', authenticate, getCustomerById);

// POST a new customer (No auth needed for creation)
router.post('/', createCustomer);

// PUT to update a customer (Authenticated user can update their own profile)
router.put('/:id', authenticate,upload.single('profilePic'), updateCustomer);

// DELETE a customer (Admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteCustomer);

export default router;
