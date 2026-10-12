import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

const activityTypesToInsert = [
  {
    code: 'ACT-SALES',
    activityName: 'Sales Pitch / Discovery',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    description: 'Initial client meeting and presentation',
    status: 'Active'
  },
  {
    code: 'ACT-DEMO',
    activityName: 'Product Live Demonstration',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    description: 'Live cutting/bending demo',
    status: 'Active'
  },
  {
    code: 'ACT-FOLLOWUP',
    activityName: 'Payment & Proposal Follow-up',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    description: 'Commercial discussions',
    status: 'Active'
  },
  {
    code: 'ACT-COMMERCIAL',
    activityName: 'Commercial Negotiation & Closing',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    description: 'Final discount and terms discussion',
    status: 'Active'
  },
  {
    code: 'ACT-INSTALL',
    activityName: 'Machine Commissioning & Installation',
    targetRole: 'Service',
    accessibleRole: 'Service',
    description: 'On-site machinery erection and wiring',
    status: 'Active'
  },
  {
    code: 'ACT-AMC',
    activityName: 'Routine Maintenance / AMC',
    targetRole: 'Service',
    accessibleRole: 'Service',
    description: 'Preventive maintenance visit',
    status: 'Active'
  },
  {
    code: 'ACT-BREAKDOWN',
    activityName: 'Emergency Breakdown Service',
    targetRole: 'Service',
    accessibleRole: 'Service',
    description: 'Urgent service call',
    status: 'Active'
  },
  {
    code: 'ACT-TRAINING',
    activityName: 'Customer Operator Training',
    targetRole: 'Service',
    accessibleRole: 'Service',
    description: 'Operating and safety training',
    status: 'Active'
  },
  {
    code: 'ACT-COURTESY',
    activityName: 'Customer Courtesy / Relationship',
    targetRole: 'All Roles',
    accessibleRole: 'All Roles',
    description: 'General relationship visit',
    status: 'Active'
  }
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);
    const db = mongoose.connection.db;

    for (const act of activityTypesToInsert) {
      await db.collection('activitytypes').updateOne(
        { code: act.code },
        { $set: act },
        { upsert: true }
      );
    }
    console.log('Activity Types successfully inserted/updated.');

    const all = await db.collection('activitytypes').find({}).toArray();
    console.log(`Total Activity Types in DB: ${all.length}`);
    all.forEach((a, i) => {
      console.log(`${i + 1}. [${a.code}] ${a.activityName} | ${a.targetRole} | ${a.description}`);
    });

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error inserting Activity Types:', err);
    process.exit(1);
  }
}

run();
