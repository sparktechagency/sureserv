import express from 'express';
import { updatePassword, login, logout, generateToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import passport from 'passport';

const router = express.Router();

// PATCH to update user password
router.patch('/:id/password', authenticate, updatePassword);

// POST to login user
router.post('/login', login);

// POST to logout user
router.post('/logout', logout);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      console.log('--- OAuth Error Details ---');
      console.log('Error:', err);
      console.log('User:', user);
      console.log('Info:', info);
      console.log('Query Params:', req.query);
      console.log('----------------------------');
      
      if (err) {
        return res.status(401).json({
          error: 'Authentication failed',
          details: err.message
        });
      }
      if (!user) {
        return res.redirect('/login-failed');
      }
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }
);

export default router;
