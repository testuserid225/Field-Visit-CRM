import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

const productsToInsert = [
  {
    code: 'PRD-CNC-PRESS',
    productName: 'Hydraulic Press Brake 100T',
    principal: 'Trumpf',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    category: 'Machinery',
    unitPrice: 3500000,
    status: 'Active'
  },
  {
    code: 'PRD-FIBER-LASER',
    productName: 'CNC Fiber Laser 3kW',
    principal: 'Mazak',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    category: 'Machinery',
    unitPrice: 5800000,
    status: 'Active'
  },
  {
    code: 'PRD-TURRET-PUNCH',
    productName: 'CNC Turret Punch Press',
    principal: 'Amada',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    category: 'Machinery',
    unitPrice: 4200000,
    status: 'Active'
  },
  {
    code: 'PRD-SHEAR-6MM',
    productName: 'Hydraulic Shearing 6mm',
    principal: 'Haas Automation',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    category: 'Machinery',
    unitPrice: 1800000,
    status: 'Active'
  },
  {
    code: 'PRD-LASER-TUBE',
    productName: 'CNC Laser Tube Cutting 2kW',
    principal: 'DMG Mori',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    category: 'Machinery',
    unitPrice: 6500000,
    status: 'Active'
  },
  {
    code: 'PRD-ROBOT-WELD',
    productName: 'Robotic Welding Cell 6-Axis',
    principal: 'Fanuc',
    targetRole: 'Sales',
    accessibleRole: 'Sales',
    category: 'Automation',
    unitPrice: 2800000,
    status: 'Active'
  },
  {
    code: 'PRD-OPTICS-KIT',
    productName: 'Fiber Laser Optics & Ceramic Ring Kit',
    principal: 'Mazak',
    targetRole: 'Service',
    accessibleRole: 'Service',
    category: 'Spare Parts',
    unitPrice: 45000,
    status: 'Active'
  },
  {
    code: 'PRD-HYD-SEAL',
    productName: 'High-Pressure Hydraulic Seal & Valve Kit',
    principal: 'Trumpf',
    targetRole: 'Service',
    accessibleRole: 'Service',
    category: 'Spare Parts',
    unitPrice: 28000,
    status: 'Active'
  },
  {
    code: 'PRD-BLADE-SET',
    productName: 'Hardened Shear Blade Replacement Set 6mm',
    principal: 'Haas Automation',
    targetRole: 'Service',
    accessibleRole: 'Service',
    category: 'Tooling',
    unitPrice: 75000,
    status: 'Active'
  },
  {
    code: 'PRD-SERVO-FANUC',
    productName: 'Fanuc AC Servo Motor & Drive Module',
    principal: 'Fanuc',
    targetRole: 'Service',
    accessibleRole: 'Service',
    category: 'Electronics',
    unitPrice: 120000,
    status: 'Active'
  },
  {
    code: 'PRD-AMC-ANNUAL',
    productName: 'Annual Maintenance Contract (AMC)',
    principal: 'Siemens',
    targetRole: 'Service',
    accessibleRole: 'Service',
    category: 'Services',
    unitPrice: 150000,
    status: 'Active'
  },
  {
    code: 'PRD-SAFETY-LIGHT',
    productName: 'Safety Light Curtain & Interlock Sensor',
    principal: 'Siemens',
    targetRole: 'All Roles',
    accessibleRole: 'All Roles',
    category: 'Accessories',
    unitPrice: 35000,
    status: 'Active'
  }
];

// Principals from the screenshot to ensure they are available
const principalsToEnsure = [
  { code: 'OEM-01', principalName: 'Trumpf', country: 'Germany', status: 'Active' },
  { code: 'OEM-02', principalName: 'Mazak', country: 'Japan', status: 'Active' },
  { code: 'OEM-03', principalName: 'Amada', country: 'Japan', status: 'Active' },
  { code: 'OEM-04', principalName: 'Haas Automation', country: 'USA', status: 'Active' },
  { code: 'OEM-05', principalName: 'DMG Mori', country: 'Germany / Japan', status: 'Active' },
  { code: 'OEM-06', principalName: 'Fanuc', country: 'Japan', status: 'Active' },
  { code: 'OEM-07', principalName: 'Siemens', country: 'Germany', status: 'Active' }
];

// Categories from the screenshot to ensure they are available
const categoriesToEnsure = [
  { category: 'Machinery', description: 'Heavy industrial and CNC machinery', status: 'Active' },
  { category: 'Automation', description: 'Robotic cells and industrial automation solutions', status: 'Active' },
  { category: 'Spare Parts', description: 'Consumables, optics, seals and replacement components', status: 'Active' },
  { category: 'Tooling', description: 'Cutting blades, punches, dies and tooling sets', status: 'Active' },
  { category: 'Electronics', description: 'Drives, servo motors, PLCs and electronic controllers', status: 'Active' },
  { category: 'Services', description: 'AMC contracts, maintenance and commissioning services', status: 'Active' },
  { category: 'Accessories', description: 'Safety light curtains, interlocks and machine accessories', status: 'Active' }
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);
    const db = mongoose.connection.db;

    // 1. Ensure categories
    for (const cat of categoriesToEnsure) {
      await db.collection('categories').updateOne(
        { category: cat.category },
        { $set: cat },
        { upsert: true }
      );
    }
    console.log('Categories synced.');

    // 2. Ensure principals
    for (const pr of principalsToEnsure) {
      await db.collection('principals').updateOne(
        { principalName: pr.principalName },
        { $set: pr },
        { upsert: true }
      );
    }
    console.log('Principals synced.');

    // 3. Insert or update products
    for (const prod of productsToInsert) {
      await db.collection('products').updateOne(
        { code: prod.code },
        { $set: prod },
        { upsert: true }
      );
    }
    console.log('Products successfully inserted/updated.');

    // Verify
    const allProducts = await db.collection('products').find({}).toArray();
    console.log(`Total Products in DB: ${allProducts.length}`);
    allProducts.forEach((p, i) => {
      console.log(`${i + 1}. [${p.code}] ${p.productName} | ${p.principal} | ${p.targetRole} | ${p.category} | ₹${p.unitPrice} | ${p.status}`);
    });

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

run();
