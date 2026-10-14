import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB } from '../../backend/config/db.js';
import { seedCustomers } from '../../backend/scripts/seedCustomers.js';
import { seedContactPersons } from '../../backend/scripts/seedContactPersons.js';
import { seedOpportunities } from '../../backend/scripts/seedOpportunities.js';
import { seedQuotations } from '../../backend/scripts/seedQuotations.js';

import clientRoutes from '../../backend/routes/clientRoutes.js';
import customerRoutes from '../../backend/routes/customerRoutes.js';
import contactPersonRoutes from '../../backend/routes/contactPersonRoutes.js';
import opportunityRoutes from '../../backend/routes/opportunityRoutes.js';
import quotationRoutes from '../../backend/routes/quotationRoutes.js';
import { protect } from '../../backend/middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.SALES_SERVICE_PORT || 5003;

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
    return res.status(503).json({ success: false, message: `Sales Service DB Error: ${err.message}` });
  }
});

// Service Routes
app.use('/api/clients', protect, clientRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/contact-persons', protect, contactPersonRoutes);
app.use('/api/opportunities', protect, opportunityRoutes);
app.use('/api/quotations', protect, quotationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Sales & Commercial Microservice',
    status: 'UP',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

export const startSalesService = async () => {
  await connectDB();
  try {
    await seedCustomers();
    await seedContactPersons();
    await seedOpportunities();
    await seedQuotations();
  } catch (seedErr) {
    console.warn('[Sales Service Seed Warning]:', seedErr.message);
  }
  return app.listen(PORT, () => {
    console.log(`💼 [Sales & CRM Service] running on http://localhost:${PORT}`);
  });
};

if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.includes('sales-service')) {
  startSalesService();
}

export default app;
