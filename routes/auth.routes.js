import express from 'express';
import { updatePassword, login, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// PATCH to update user password
router.patch('/:id/password', authenticate, updatePassword);

// POST to login user
router.post('/login', login);

// POST to logout user
router.post('/logout', logout);

export default router;
