import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedDatabase } from './scripts/seed.js';
import { seedMasters } from './scripts/seedMasters.js';
import { seedContactPersons } from './scripts/seedContactPersons.js';
import { seedCustomers } from './scripts/seedCustomers.js';
import { seedEmployees } from './scripts/seedEmployees.js';
import { seedOpportunities } from './scripts/seedOpportunities.js';
import { seedQuotations } from './scripts/seedQuotations.js';
import { seedDailyVisitExpenses } from './scripts/seedDailyVisitExpenses.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

// Start Server & Connect Database (Standalone mode)
const startServer = async () => {
  const conn = await connectDB();

  if (conn) {
    try {
      await seedDatabase();
      await seedMasters();
      await seedContactPersons();
      await seedCustomers();
      await seedEmployees();
      await seedOpportunities();
      await seedQuotations();
      await seedDailyVisitExpenses();
    } catch (seedErr) {
      console.warn('[Seed Warning]:', seedErr.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Field Visit CRM API running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB URI: ${MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);
    console.log(`===============================================`);
  });
};

// Run standalone server when not in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export default app;
