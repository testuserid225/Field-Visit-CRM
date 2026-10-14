import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB } from '../../backend/config/db.js';
import { seedEmployees } from '../../backend/scripts/seedEmployees.js';
import authRoutes from '../../backend/routes/authRoutes.js';
import employeeRoutes from '../../backend/routes/employeeRoutes.js';
import { protect } from '../../backend/middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 5001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Database auto-reconnect middleware
app.use(async (req, res, next) => {
  if (req.path === '/health') return next();
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    return res.status(503).json({ success: false, message: `Auth Service DB Error: ${err.message}` });
  }
});

// Service Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', protect, employeeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Auth & Employee Microservice',
    status: 'UP',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

export const startAuthService = async () => {
  await connectDB();
  try {
    await seedEmployees();
  } catch (seedErr) {
    console.warn('[Auth Service Seed Warning]:', seedErr.message);
  }
  return app.listen(PORT, () => {
    console.log(`🔐 [Auth Service] running on http://localhost:${PORT}`);
  });
};

if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.includes('auth-service')) {
  startAuthService();
}

export default app;
