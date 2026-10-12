import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB, sanitizeMongoURI } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import contactPersonRoutes from './routes/contactPersonRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import dailyVisitExpenseRoutes from './routes/dailyVisitExpenseRoutes.js';
import { protect } from './middleware/authMiddleware.js';

import { seedEmployees } from './scripts/seedEmployees.js';
import { seedMasters } from './scripts/seedMasters.js';
import { seedCustomers } from './scripts/seedCustomers.js';
import { seedContactPersons } from './scripts/seedContactPersons.js';
import { seedDatabase } from './scripts/seed.js';
import { seedOpportunities } from './scripts/seedOpportunities.js';
import { seedQuotations } from './scripts/seedQuotations.js';
import { seedDailyVisitExpenses } from './scripts/seedDailyVisitExpenses.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Auto-seed helper for cloud databases on serverless environments (e.g. Vercel)
let isSeeded = false;
const ensureSeeded = async () => {
  if (isSeeded) return;
  try {
    await seedEmployees();
    await seedMasters();
    await seedCustomers();
    await seedContactPersons();
    await seedDatabase();
    await seedOpportunities();
    await seedQuotations();
    await seedDailyVisitExpenses();
    isSeeded = true;
    console.log('[Seed] Database initialization and default accounts verified');
  } catch (seedErr) {
    console.warn('[Seed Warning]:', seedErr.message);
  }
};

// Database connection & initialization middleware (Critical for Vercel serverless function invocations)
app.use(async (req, res, next) => {
  // Allow health check and root landing route without blocking on DB
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState === 1 && !isSeeded) {
      await ensureSeeded();
    }

    return next();
  } catch (dbErr) {
    console.error('[MongoDB Middleware Error]:', dbErr.message);
    return res.status(503).json({
      success: false,
      message: `Database Connection Failed: ${dbErr.message}`,
      errorType: 'DATABASE_CONNECTION_ERROR',
      hint: 'Please check MONGODB_URI in Vercel Project Settings > Environment Variables. Make sure the value starts with mongodb:// or mongodb+srv:// and has no quotes. Also ensure MongoDB Atlas Network Access has 0.0.0.0/0 allowed.'
    });
  }
});

// Public Authentication Route
app.use('/api/auth', authRoutes);

// Protected CRM API Routes
app.use('/api/visits', protect, visitRoutes);
app.use('/api/clients', protect, clientRoutes);
app.use('/api/stats', protect, statsRoutes);
app.use('/api/masters', protect, masterRoutes);
app.use('/api/contact-persons', protect, contactPersonRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/employees', protect, employeeRoutes);
app.use('/api/opportunities', protect, opportunityRoutes);
app.use('/api/quotations', protect, quotationRoutes);
app.use('/api/daily-visit-expenses', protect, dailyVisitExpenseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const rawURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const cleanURI = sanitizeMongoURI(rawURI);
  const isValidScheme = cleanURI.startsWith('mongodb://') || cleanURI.startsWith('mongodb+srv://');

  res.json({
    status: isConnected ? 'OK' : 'DEGRADED',
    service: 'Field Visit CRM API',
    uptime: process.uptime(),
    database: {
      status: isConnected ? 'Connected' : 'Disconnected',
      configured: Boolean(rawURI),
      validScheme: isValidScheme,
      maskedUri: cleanURI ? cleanURI.replace(/:([^@]+)@/, ':****@') : 'Not Configured (MONGODB_URI missing)'
    },
    timestamp: new Date().toISOString()
  });
});

// Root API information
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Field Visit CRM Node.js Backend API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      visits: '/api/visits',
      clients: '/api/clients',
      stats: '/api/stats/dashboard',
      opportunities: '/api/opportunities',
      quotations: '/api/quotations',
      dailyVisitExpenses: '/api/daily-visit-expenses'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error]: ${err.stack}`);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

export default app;
