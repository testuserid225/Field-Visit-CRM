import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  Branch, 
  Department, 
  Designation, 
  ExpenseHead, 
  GradeFuelRate, 
  Industry, 
  Principal, 
  Category, 
  Product, 
  ActivityType 
} from '../models/MasterModels.js';

dotenv.config();
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

export const seedMasters = async () => {
  try {
    // 1. Branch
    if (await Branch.countDocuments() === 0) {
      await Branch.insertMany([
        { code: 'BR-BLR-01', branchName: 'Bangalore Central Branch', city: 'Bangalore', manager: 'Imran Khan (Senior Manager)', status: 'Active' },
        { code: 'BR-MUM-02', branchName: 'Mumbai West Operations', city: 'Mumbai', manager: 'Sarah Jenkins (Territory Lead)', status: 'Active' },
        { code: 'BR-DEL-03', branchName: 'Delhi NCR Hub', city: 'New Delhi', manager: 'Rajesh Verma (Regional Head)', status: 'Active' }
      ]);
    }

    // 2. Department
    if (await Department.countDocuments() === 0) {
      await Department.insertMany([
        { code: 'DEP-01', departmentName: 'Field Sales & Business Development', status: 'Active' },
        { code: 'DEP-02', departmentName: 'Customer Support & Engineering', status: 'Active' },
        { code: 'DEP-03', departmentName: 'Logistics & Supply Chain Operations', status: 'Active' }
      ]);
    }

    // 3. Designation
    if (await Designation.countDocuments() === 0) {
      await Designation.insertMany([
        { code: 'DES-01', designationTitle: 'Senior Field Sales Officer', status: 'Active' },
        { code: 'DES-02', designationTitle: 'Field Service Application Engineer', status: 'Active' },
        { code: 'DES-03', designationTitle: 'Territory Relationship Manager', status: 'Active' }
      ]);
    }

    // 4. Expense Head
    if (await ExpenseHead.countDocuments() === 0) {
      await ExpenseHead.insertMany([
        { code: 'EXP-01', expenseHeadName: 'Two-Wheeler Fuel Allowance', receiptRequired: 'No Bill', requiresKm: 'Yes (Fuel)', defaultRate: 4.5, status: 'Active' },
        { code: 'EXP-02', expenseHeadName: 'Four-Wheeler Travel Fuel', receiptRequired: 'Bill Required', requiresKm: 'Yes (Fuel)', defaultRate: 9.0, status: 'Active' },
        { code: 'EXP-03', expenseHeadName: 'Client Lunch & Engagement Refreshment', receiptRequired: 'Bill Required', requiresKm: 'No', defaultRate: 500, status: 'Active' },
        { code: 'EXP-04', expenseHeadName: 'Daily Field DA / Food Allowance', receiptRequired: 'No Bill', requiresKm: 'No', defaultRate: 350, status: 'Active' }
      ]);
    }

    // 5. Grade Fuel Rate
    if (await GradeFuelRate.countDocuments() === 0) {
      await GradeFuelRate.insertMany([
        { gradeCode: 'GRD-A', gradeName: 'Senior Executive / Territory Lead', fuelRate: 8.5, status: 'Active' },
        { gradeCode: 'GRD-B', gradeName: 'Field Sales Officer', fuelRate: 5.0, status: 'Active' },
        { gradeCode: 'GRD-C', gradeName: 'Apprentice / Trainee Rep', fuelRate: 4.0, status: 'Active' }
      ]);
    }

    // 6. Industry
    if (await Industry.countDocuments() === 0) {
      await Industry.insertMany([
        { industryCode: 'IND-AUTO', industrySegmentName: 'Automobile & Auto Components', description: '-', status: 'Active' },
        { industryCode: 'IND-ENG', industrySegmentName: 'General Engineering & Machining', description: '-', status: 'Active' },
        { industryCode: 'IND-MACH', industrySegmentName: 'Industrial Machinery & Equipment', description: '-', status: 'Active' },
        { industryCode: 'IND-AERO', industrySegmentName: 'Aerospace & Defense', description: '-', status: 'Active' },
        { industryCode: 'IND-ELEC', industrySegmentName: 'Consumer Durables & Electronics', description: '-', status: 'Active' },
        { industryCode: 'IND-CHEM', industrySegmentName: 'Petrochemicals & Process Industry', description: '-', status: 'Active' },
        { industryCode: 'IND-MOLD', industrySegmentName: 'Die & Mold Manufacturing', description: '-', status: 'Active' },
        { industryCode: 'IND-STEEL', industrySegmentName: 'Steel & Metals Fabrication', description: '-', status: 'Active' },
        { industryCode: 'IND-FOOD', industrySegmentName: 'Food Processing & Packaging', description: '-', status: 'Active' }
      ]);
    }

    // 7. Principal / OEM
    if (await Principal.countDocuments() === 0) {
      await Principal.insertMany([
        { code: 'PRIN-AMADA', principalName: 'Amada', country: 'Japan', contactPerson: 'Hiroshi Tanaka', contactEmail: 'htanaka@amada.example.com', contactPhone: '+81 463 96 1111', status: 'Active' },
        { code: 'PRIN-DMGMORI', principalName: 'DMG Mori', country: 'Germany / Japan', contactPerson: 'Stefan Weber', contactEmail: 'sweber@dmgmori.example.com', contactPhone: '+49 5205 74 0', status: 'Active' },
        { code: 'PRIN-FANUC', principalName: 'Fanuc', country: 'Japan', contactPerson: 'Takashi Watanabe', contactEmail: 'twatanabe@fanuc.example.com', contactPhone: '+81 555 84 5555', status: 'Active' },
        { code: 'PRIN-GEN', principalName: 'General Machinery', country: 'India', contactPerson: 'Suresh Patel', contactEmail: 'spatel@generalmachinery.example.com', contactPhone: '+91 22 2580 1234', status: 'Active' },
        { code: 'PRIN-HAAS', principalName: 'Haas Automation', country: 'United States', contactPerson: 'Robert Miller', contactEmail: 'rmiller@haascnc.example.com', contactPhone: '+1 805 278 1800', status: 'Active' },
        { code: 'PRIN-MAZAK', principalName: 'Mazak', country: 'Japan', contactPerson: 'Kenji Sato', contactEmail: 'ksato@mazak.example.com', contactPhone: '+81 587 95 5511', status: 'Active' },
        { code: 'PRIN-MITSUBISHI', principalName: 'Mitsubishi Electric', country: 'Japan', contactPerson: 'Daisuke Yamada', contactEmail: 'dyamada@mitsubishi.example.com', contactPhone: '+81 3 3218 2111', status: 'Active' },
        { code: 'PRIN-SIEMENS', principalName: 'Siemens', country: 'Germany', contactPerson: 'Markus Schmidt', contactEmail: 'm.schmidt@siemens.example.com', contactPhone: '+49 89 636 00', status: 'Active' },
        { code: 'PRIN-TRUMPF', principalName: 'Trumpf', country: 'Germany', contactPerson: 'Hans Mueller', contactEmail: 'hans.m@trumpf.example.com', contactPhone: '+49 7156 3030', status: 'Active' }
      ]);
    }

    // 8. Category
    if (await Category.countDocuments() === 0) {
      await Category.insertMany([
        { category: 'Diagnostic Imaging Equipment', description: 'Ultrasound, digital X-Ray, and CT sensors', status: 'Active' },
        { category: 'Industrial IoT & POS Automation', description: 'Barcode scanners, RFID gateways, and terminals', status: 'Active' },
        { category: 'Process Automation Sensors', description: 'Temperature, proximity, and flow control monitors', status: 'Active' }
      ]);
    }

    // 9. Product
    if (await Product.countDocuments() === 0) {
      await Product.insertMany([
        { code: 'PRD-CNC-PRESS', productName: 'Hydraulic Press Brake 100T', principal: 'Trumpf', targetRole: 'Sales', accessibleRole: 'Sales', category: 'Machinery', unitPrice: 3500000, status: 'Active' },
        { code: 'PRD-FIBER-LASER', productName: 'CNC Fiber Laser 3kW', principal: 'Mazak', targetRole: 'Sales', accessibleRole: 'Sales', category: 'Machinery', unitPrice: 5800000, status: 'Active' },
        { code: 'PRD-TURRET-PUNCH', productName: 'CNC Turret Punch Press', principal: 'Amada', targetRole: 'Sales', accessibleRole: 'Sales', category: 'Machinery', unitPrice: 4200000, status: 'Active' },
        { code: 'PRD-SHEAR-6MM', productName: 'Hydraulic Shearing 6mm', principal: 'Haas Automation', targetRole: 'Sales', accessibleRole: 'Sales', category: 'Machinery', unitPrice: 1800000, status: 'Active' },
        { code: 'PRD-LASER-TUBE', productName: 'CNC Laser Tube Cutting 2kW', principal: 'DMG Mori', targetRole: 'Sales', accessibleRole: 'Sales', category: 'Machinery', unitPrice: 6500000, status: 'Active' },
        { code: 'PRD-ROBOT-WELD', productName: 'Robotic Welding Cell 6-Axis', principal: 'Fanuc', targetRole: 'Sales', accessibleRole: 'Sales', category: 'Automation', unitPrice: 2800000, status: 'Active' },
        { code: 'PRD-OPTICS-KIT', productName: 'Fiber Laser Optics & Ceramic Ring Kit', principal: 'Mazak', targetRole: 'Service', accessibleRole: 'Service', category: 'Spare Parts', unitPrice: 45000, status: 'Active' },
        { code: 'PRD-HYD-SEAL', productName: 'High-Pressure Hydraulic Seal & Valve Kit', principal: 'Trumpf', targetRole: 'Service', accessibleRole: 'Service', category: 'Spare Parts', unitPrice: 28000, status: 'Active' },
        { code: 'PRD-BLADE-SET', productName: 'Hardened Shear Blade Replacement Set 6mm', principal: 'Haas Automation', targetRole: 'Service', accessibleRole: 'Service', category: 'Tooling', unitPrice: 75000, status: 'Active' },
        { code: 'PRD-SERVO-FANUC', productName: 'Fanuc AC Servo Motor & Drive Module', principal: 'Fanuc', targetRole: 'Service', accessibleRole: 'Service', category: 'Electronics', unitPrice: 120000, status: 'Active' },
        { code: 'PRD-AMC-ANNUAL', productName: 'Annual Maintenance Contract (AMC)', principal: 'Siemens', targetRole: 'Service', accessibleRole: 'Service', category: 'Services', unitPrice: 150000, status: 'Active' },
        { code: 'PRD-SAFETY-LIGHT', productName: 'Safety Light Curtain & Interlock Sensor', principal: 'Siemens', targetRole: 'All Roles', accessibleRole: 'All Roles', category: 'Accessories', unitPrice: 35000, status: 'Active' }
      ]);
    }

    // 10. Activity Type
    if (await ActivityType.countDocuments() === 0) {
      await ActivityType.insertMany([
        { code: 'ACT-SALES', activityName: 'Sales Pitch / Discovery', targetRole: 'Sales', accessibleRole: 'Sales', description: 'Initial client meeting and presentation', status: 'Active' },
        { code: 'ACT-DEMO', activityName: 'Product Live Demonstration', targetRole: 'Sales', accessibleRole: 'Sales', description: 'Live cutting/bending demo', status: 'Active' },
        { code: 'ACT-FOLLOWUP', activityName: 'Payment & Proposal Follow-up', targetRole: 'Sales', accessibleRole: 'Sales', description: 'Commercial discussions', status: 'Active' },
        { code: 'ACT-COMMERCIAL', activityName: 'Commercial Negotiation & Closing', targetRole: 'Sales', accessibleRole: 'Sales', description: 'Final discount and terms discussion', status: 'Active' },
        { code: 'ACT-INSTALL', activityName: 'Machine Commissioning & Installation', targetRole: 'Service', accessibleRole: 'Service', description: 'On-site machinery erection and wiring', status: 'Active' },
        { code: 'ACT-AMC', activityName: 'Routine Maintenance / AMC', targetRole: 'Service', accessibleRole: 'Service', description: 'Preventive maintenance visit', status: 'Active' },
        { code: 'ACT-BREAKDOWN', activityName: 'Emergency Breakdown Service', targetRole: 'Service', accessibleRole: 'Service', description: 'Urgent service call', status: 'Active' },
        { code: 'ACT-TRAINING', activityName: 'Customer Operator Training', targetRole: 'Service', accessibleRole: 'Service', description: 'Operating and safety training', status: 'Active' },
        { code: 'ACT-COURTESY', activityName: 'Customer Courtesy / Relationship', targetRole: 'All Roles', accessibleRole: 'All Roles', description: 'General relationship visit', status: 'Active' }
      ]);
    }

    console.log('[Seed] All 10 CRM Masters seeded successfully.');
  } catch (err) {
    console.error(`[Seed Masters Error]: ${err.message}`);
  }
};

if (process.argv[1]?.endsWith('seedMasters.js')) {
  mongoose.connect(mongoURI).then(async () => {
    await seedMasters();
    mongoose.connection.close();
    process.exit(0);
  });
}
