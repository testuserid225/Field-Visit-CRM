import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import Client from '../models/Client.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

const DEMO_USERS = [
  {
    name: 'Imran Khan',
    email: 'imran@fieldvisitcrm.com',
    password: 'password123',
    role: 'Senior Field Officer',
    territory: 'Bangalore East & Central',
    avatar: 'IK',
    isDutyActive: true
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah@fieldvisitcrm.com',
    password: 'password123',
    role: 'Territory Sales Manager',
    territory: 'Karnataka Region',
    avatar: 'SJ',
    isDutyActive: true
  },
  {
    name: 'Admin User',
    email: 'admin@fieldvisitcrm.com',
    password: 'password123',
    role: 'CRM Administrator',
    territory: 'Headquarters',
    avatar: 'AU',
    isDutyActive: false
  }
];

const INITIAL_CLIENTS = [
  {
    clientId: 'CLI-01',
    name: 'Apex Healthcare & Diagnostic Center',
    category: 'Healthcare',
    contactPerson: 'Dr. Rajesh Sharma',
    phone: '+91 98230 44122',
    email: 'dr.sharma@apexhealth.com',
    address: 'Suite 402, Metro Health Plaza, Outer Ring Rd, Bangalore',
    tier: 'Enterprise',
    totalVisits: 14,
    lastVisitDate: '2026-09-30',
    status: 'Active'
  },
  {
    clientId: 'CLI-02',
    name: 'Zenith Retail & Supermarket Chain',
    category: 'Retail / FMCG',
    contactPerson: 'Priya Nair',
    phone: '+91 99401 55210',
    email: 'priya.nair@zenithretail.in',
    address: 'Plot 18, Commercial Hub, Whitefield, Bangalore',
    tier: 'Key Account',
    totalVisits: 9,
    lastVisitDate: '2026-09-30',
    status: 'Active'
  },
  {
    clientId: 'CLI-03',
    name: 'BlueHorizon Logistics & Warehousing',
    category: 'Logistics',
    contactPerson: 'Vikram Malhotra',
    phone: '+91 98840 12903',
    email: 'v.malhotra@bluehorizon.com',
    address: 'Industrial Area Phase II, Peenya, Bangalore',
    tier: 'Enterprise',
    totalVisits: 6,
    lastVisitDate: '2026-09-18',
    status: 'Active'
  },
  {
    clientId: 'CLI-04',
    name: 'GreenPulse Organic Foods',
    category: 'Agri-Tech & Food',
    contactPerson: 'Sunita Deshmukh',
    phone: '+91 97110 33882',
    email: 'sunita@greenpulsefoods.com',
    address: '42 Indiranagar 100ft Road, Bangalore',
    tier: 'Growth',
    totalVisits: 4,
    lastVisitDate: '2026-09-10',
    status: 'Active'
  },
  {
    clientId: 'CLI-05',
    name: 'Sterling Polymers Manufacturing',
    category: 'Manufacturing',
    contactPerson: 'Arun Verma',
    phone: '+91 98199 77412',
    email: 'arun.verma@sterlingpolymers.com',
    address: 'Bommasandra Industrial Area, Hosur Rd, Bangalore',
    tier: 'Enterprise',
    totalVisits: 11,
    lastVisitDate: '2026-08-25',
    status: 'Active'
  }
];

const INITIAL_VISITS = [
  {
    visitId: 'VST-1001',
    clientName: 'Apex Healthcare & Diagnostic Center',
    contactPerson: 'Dr. Rajesh Sharma (Director)',
    phone: '+91 98230 44122',
    email: 'dr.sharma@apexhealth.com',
    address: 'Suite 402, Metro Health Plaza, Outer Ring Rd, Bangalore',
    scheduledDate: '2026-09-30',
    scheduledTime: '10:30 AM',
    purpose: 'Product Demonstration & Equipment AMC Renewal',
    priority: 'High',
    status: 'Completed',
    checkInTime: '10:28 AM',
    checkOutTime: '11:15 AM',
    assignedTo: 'Imran Khan',
    notes: 'Demonstrated Model X-500. Client requested formal quote by tomorrow.',
    distanceKm: '12.4 km',
    latitude: 12.9716,
    longitude: 77.5946,
    verifiedGps: true
  },
  {
    visitId: 'VST-1002',
    clientName: 'Zenith Retail & Supermarket Chain',
    contactPerson: 'Priya Nair (Procurement Head)',
    phone: '+91 99401 55210',
    email: 'priya.nair@zenithretail.in',
    address: 'Plot 18, Commercial Hub, Whitefield, Bangalore',
    scheduledDate: '2026-09-30',
    scheduledTime: '01:00 PM',
    purpose: 'Monthly Store Audit & POS System Inspection',
    priority: 'Medium',
    status: 'In-Progress',
    checkInTime: '12:55 PM',
    checkOutTime: null,
    assignedTo: 'Imran Khan',
    notes: 'Currently inspecting counter 4 and 5 terminals with store manager.',
    distanceKm: '8.2 km',
    latitude: 12.9698,
    longitude: 77.7500,
    verifiedGps: true
  },
  {
    visitId: 'VST-1003',
    clientName: 'BlueHorizon Logistics & Warehousing',
    contactPerson: 'Vikram Malhotra (Operations VP)',
    phone: '+91 98840 12903',
    email: 'v.malhotra@bluehorizon.com',
    address: 'Industrial Area Phase II, Peenya, Bangalore',
    scheduledDate: '2026-09-30',
    scheduledTime: '03:30 PM',
    purpose: 'Site Inspection for Fleet Tracking Automation',
    priority: 'High',
    status: 'Scheduled',
    checkInTime: null,
    checkOutTime: null,
    assignedTo: 'Imran Khan',
    notes: 'Pre-briefing done over call. Requires live GPS demo on warehouse yard.',
    distanceKm: '18.5 km',
    latitude: 13.0334,
    longitude: 77.5140,
    verifiedGps: false
  },
  {
    visitId: 'VST-1004',
    clientName: 'GreenPulse Organic Foods',
    contactPerson: 'Sunita Deshmukh (Founder)',
    phone: '+91 97110 33882',
    email: 'sunita@greenpulsefoods.com',
    address: '42 Indiranagar 100ft Road, Bangalore',
    scheduledDate: '2026-09-30',
    scheduledTime: '05:00 PM',
    purpose: 'Client Relationship Review & Sample Catalog Presentation',
    priority: 'Low',
    status: 'Scheduled',
    checkInTime: null,
    checkOutTime: null,
    assignedTo: 'Imran Khan',
    notes: 'Quarterly follow-up visit. Present holiday seasonal gift packaging options.',
    distanceKm: '5.1 km',
    latitude: 12.9784,
    longitude: 77.6408,
    verifiedGps: false
  }
];

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoURI);
      console.log(`[Seed] Connected to MongoDB: ${mongoURI}`);
    }

    // Check existing counts
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(DEMO_USERS);
      console.log(`[Seed] Seeded ${DEMO_USERS.length} demo users`);
    }

    const clientCount = await Client.countDocuments();
    if (clientCount === 0) {
      await Client.insertMany(INITIAL_CLIENTS);
      console.log(`[Seed] Seeded ${INITIAL_CLIENTS.length} initial clients`);
    }

    const visitCount = await Visit.countDocuments();
    if (visitCount === 0) {
      await Visit.insertMany(INITIAL_VISITS);
      console.log(`[Seed] Seeded ${INITIAL_VISITS.length} initial field visits`);
    }

    console.log('[Seed] Database seeding completed successfully.');
  } catch (err) {
    console.error(`[Seed Error]: ${err.message}`);
  }
};

// If run directly:
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}
