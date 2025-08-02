import { getDashboardStats, getAllUsers, getAllProviders, approveProvider,updateUserStatus, verifyDocument, getAllServiceRequests, assignRequest, updateRequestStatus, getAllTransactions, initiatePayout, addServiceCategory, updateServiceCategory, deleteServiceCategory, createPromoCode, updateServiceFee, deleteTransaction } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import express from 'express';

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), getDashboardStats);

// User and Provider Management
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/providers', authenticate, authorize('admin'), getAllProviders);
router.put('/providers/:id/approve', authenticate, authorize('admin'), approveProvider);
router.put('/users/:id/status', authenticate, authorize('admin'), updateUserStatus);
router.put('/providers/:id/verify', authenticate, authorize('admin'), verifyDocument);

// Service Request Management
router.get('/requests', authenticate, authorize('admin'), getAllServiceRequests);
router.put('/requests/:id/assign', authenticate, authorize('admin'), assignRequest);
router.put('/requests/:id/status', authenticate, authorize('admin'), updateRequestStatus);

// Payments & Payouts
router.get('/transactions', authenticate, authorize('admin'), getAllTransactions);
router.post('/payouts', authenticate, authorize('admin'), initiatePayout);
router.delete('/transactions/:id', authenticate, authorize('admin'), deleteTransaction);

// Content & App Configuration
router.post('/categories', authenticate, authorize('admin'), upload.single('categoryImage'), addServiceCategory);
router.put('/categories/:id', authenticate, authorize('admin'), upload.single('categoryImage'), updateServiceCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), deleteServiceCategory);
router.post('/promocodes', authenticate, authorize('admin'), createPromoCode);
router.put('/servicefees', authenticate, authorize('admin'), updateServiceFee);

export default router;
