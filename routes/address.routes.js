import express from 'express';
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/address.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all addresses for a specific user
router.get('/:userId/getAllAddresses', getAddresses);

// Get a single address by ID
router.get('/:id', getAddressById);

// Create a new address for a user
router.post('/',authenticate, createAddress);

// Update an address by ID
router.patch('/:id', updateAddress);

// Delete an address by ID
router.delete('/:id', deleteAddress);

export default router;
