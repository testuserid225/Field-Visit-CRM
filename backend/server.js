import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
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
import { seedDatabase } from './scripts/seed.js';
import { seedMasters } from './scripts/seedMasters.js';
import { seedContactPersons } from './scripts/seedContactPersons.js';
import { seedCustomers } from './scripts/seedCustomers.js';
import { seedEmployees } from './scripts/seedEmployees.js';
import { seedOpportunities } from './scripts/seedOpportunities.js';
import { seedQuotations } from './scripts/seedQuotations.js';
import { seedDailyVisitExpenses } from './scripts/seedDailyVisitExpenses.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan('dev'));

// Public Authentication Route (Login is public; /me is protected internally)
app.use('/api/auth', authRoutes);

// Protected CRM API Routes - Token Authentication Required based on Login User Details
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
  res.json({
    status: 'OK',
    service: 'Field Visit CRM API',
    uptime: process.uptime(),
    database: {
      status: isConnected ? 'Connected' : 'Disconnected / Connecting',
      uri: MONGO_URI
    },
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Field Visit CRM Node.js Backend API',
    version: '1.0.0',
    databaseTarget: MONGO_URI,
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

// Start Server & Connect Database
const startServer = async () => {
  const conn = await connectDB();

  if (conn) {
    // Optionally seed database with initial records if empty
    await seedDatabase();
    await seedMasters();
    await seedContactPersons();
    await seedCustomers();
    await seedEmployees();
    await seedOpportunities();
    await seedQuotations();
    await seedDailyVisitExpenses();
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Field Visit CRM API running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB URI: ${MONGO_URI}`);
    console.log(`===============================================`);
  });
};

startServer();
