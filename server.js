import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';


import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import providerRoutes from './routes/provider.routes.js';
import addressRoutes from './routes/address.routes.js';
import serviceRoutes from './routes/service.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';


import bookingRoutes from './routes/booking.routes.js';

import './utils/scheduler.js'; // Import to start cron jobs

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }));
app.use(express.json({ limit: "10kb" }));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/auth', limiter); // Apply limiter to new auth route

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/addresses', addressRoutes); 
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes); 



// Existing routes (if any)
app.use('/api/v1/bookings', bookingRoutes);


// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
