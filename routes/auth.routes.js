import express from 'express';
import { updatePassword, login, logout, generateToken, forgotPassword, resetPassword, verifyOtp, resendOtp } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import passport from 'passport';
import { createGoogleStrategy, createFacebookStrategy } from '../config/passport.js';

const router = express.Router();

// PATCH to update user password
router.patch('/:id/password', authenticate, updatePassword);

// POST to login user
router.post('/login', login);

// POST to logout user
router.post('/logout', logout);

// Google OAuth routes
router.get('/google', (req, res, next) => {
    const googleStrategy = createGoogleStrategy(req);
    passport.use(googleStrategy);
    const state = JSON.stringify({
        platform: req.query.platform || 'web',
        role: req.query.role || 'customer' // Default to 'customer' if not provided
    });
    passport.authenticate('google', { scope: ['profile', 'email'], state: state })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    const googleStrategy = createGoogleStrategy(req);
    passport.use(googleStrategy);
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
        const token = generateToken(user._id);
        res.redirect(`/?token=${token}`);
      });
    })(req, res, next);
  }
);

// Facebook OAuth routes
router.get('/facebook', (req, res, next) => {
    const facebookStrategy = createFacebookStrategy();
    passport.use(facebookStrategy);
    const state = JSON.stringify({
        platform: req.query.platform || 'web',
        role: req.query.role || 'customer' // Default to 'customer' if not provided
    });
    passport.authenticate('facebook', { scope: ['email'], state: state })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
    const facebookStrategy = createFacebookStrategy();
    passport.use(facebookStrategy);
    passport.authenticate('facebook', (err, user, info) => {
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
        const token = generateToken(user._id);
        res.redirect(`/?token=${token}`);
      });
    })(req, res, next);
});

// POST to request password reset
router.post('/forgot-password', forgotPassword);

// POST to reset password
router.post('/reset-password', resetPassword);



// POST to verify OTP
router.post('/verify-otp', verifyOtp);

// POST to resend OTP
router.post('/resend-otp', resendOtp);

export default router;