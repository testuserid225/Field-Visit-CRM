import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB } from '../../backend/config/db.js';
import { seedDatabase } from '../../backend/scripts/seed.js';
import { seedDailyVisitExpenses } from '../../backend/scripts/seedDailyVisitExpenses.js';
import visitRoutes from '../../backend/routes/visitRoutes.js';
import dailyVisitExpenseRoutes from '../../backend/routes/dailyVisitExpenseRoutes.js';
import statsRoutes from '../../backend/routes/statsRoutes.js';
import { protect } from '../../backend/middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.VISIT_SERVICE_PORT || 5002;

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
    return res.status(503).json({ success: false, message: `Visit Service DB Error: ${err.message}` });
  }
});

// Service Routes
app.use('/api/visits', protect, visitRoutes);
app.use('/api/daily-visit-expenses', protect, dailyVisitExpenseRoutes);
app.use('/api/stats', protect, statsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Visit & Operations Microservice',
    status: 'UP',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

export const startVisitService = async () => {
  await connectDB();
  try {
    await seedDatabase();
    await seedDailyVisitExpenses();
  } catch (seedErr) {
    console.warn('[Visit Service Seed Warning]:', seedErr.message);
  }
  return app.listen(PORT, () => {
    console.log(`📍 [Visit & Operations Service] running on http://localhost:${PORT}`);
  });
};

if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.includes('visit-service')) {
  startVisitService();
}

export default app;
