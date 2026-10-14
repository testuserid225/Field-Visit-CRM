import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB } from '../../backend/config/db.js';
import { seedMasters } from '../../backend/scripts/seedMasters.js';
import masterRoutes from '../../backend/routes/masterRoutes.js';
import { protect } from '../../backend/middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.MASTER_SERVICE_PORT || 5004;

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
    return res.status(503).json({ success: false, message: `Master Service DB Error: ${err.message}` });
  }
});

// Service Routes
app.use('/api/masters', protect, masterRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Master Data Microservice',
    status: 'UP',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

export const startMasterService = async () => {
  await connectDB();
  try {
    await seedMasters();
  } catch (seedErr) {
    console.warn('[Master Service Seed Warning]:', seedErr.message);
  }
  return app.listen(PORT, () => {
    console.log(`🗄️ [Master Data Service] running on http://localhost:${PORT}`);
  });
};

if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.includes('master-service')) {
  startMasterService();
}

export default app;
