import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';

const employeesToSync = [
  {
    employeeCode: 'EMP-1001',
    fullName: 'Rahul S. Sharma',
    gender: 'Male',
    dateOfBirth: '1992-01-01',
    joiningDate: '2026-09-30',
    mobileNo: '+91 98201 12345',
    emailAddress: 'rahul.sharma@fieldvisitcrm.com',
    department: 'Sales',
    designation: 'Sales Executive',
    branch: 'Mumbai HQ',
    employeeGrade: 'Grade B',
    securityRole: 'Sales Executive (SALES_EXEC)',
    status: 'Active',
    accountPassword: 'Password@123'
  },
  {
    employeeCode: 'EMP-1003',
    fullName: 'Anjali Verma',
    gender: 'Female',
    dateOfBirth: '1994-06-15',
    joiningDate: '2025-04-10',
    mobileNo: '+91 98450 67890',
    emailAddress: 'anjali.verma@fieldvisitcrm.com',
    department: 'Service & Support',
    designation: 'Service Engineer',
    branch: 'Bengaluru Tech Hub',
    employeeGrade: 'Grade A',
    securityRole: 'Service Engineer (SERVICE_ENG)',
    status: 'Active',
    accountPassword: 'Password@123'
  },
  {
    employeeCode: 'EMP-1004',
    fullName: 'Imran Khan',
    gender: 'Male',
    dateOfBirth: '1988-11-20',
    joiningDate: '2023-01-15',
    mobileNo: '+91 98110 33445',
    emailAddress: 'imran.khan@fieldvisitcrm.com',
    department: 'Sales',
    designation: 'Senior Manager',
    branch: 'Delhi North',
    employeeGrade: 'Grade A',
    securityRole: 'Branch Manager (BRANCH_MGR)',
    status: 'Active',
    accountPassword: 'Password@123'
  },
  {
    employeeCode: 'EMP-1005',
    fullName: 'Sneha Kulkarni',
    gender: 'Female',
    dateOfBirth: '1995-08-25',
    joiningDate: '2026-02-01',
    mobileNo: '+91 97654 88990',
    emailAddress: 'sneha.kulkarni@fieldvisitcrm.com',
    department: 'Operations',
    designation: 'Operations Lead',
    branch: 'Pune Operations',
    employeeGrade: 'Grade B',
    securityRole: 'Sales Executive (SALES_EXEC)',
    status: 'Active',
    accountPassword: 'Password@123'
  },
  {
    employeeCode: 'EMP-1006',
    fullName: 'David R. Wilson',
    gender: 'Male',
    dateOfBirth: '1990-03-12',
    joiningDate: '2024-09-01',
    mobileNo: '+91 99001 55667',
    emailAddress: 'david.wilson@fieldvisitcrm.com',
    department: 'Service & Support',
    designation: 'Senior Field Tech',
    branch: 'Mumbai HQ',
    employeeGrade: 'Grade C',
    securityRole: 'Service Engineer (SERVICE_ENG)',
    status: 'Active',
    accountPassword: 'Password@123'
  },
  {
    employeeCode: 'EMP-1007',
    fullName: 'Pooja Iyer',
    gender: 'Female',
    dateOfBirth: '1993-12-05',
    joiningDate: '2025-11-20',
    mobileNo: '+91 98840 22334',
    emailAddress: 'pooja.iyer@fieldvisitcrm.com',
    department: 'Finance & Billing',
    designation: 'Accounts Executive',
    branch: 'Bengaluru Tech Hub',
    employeeGrade: 'Grade B',
    securityRole: 'Administrator (ADMIN)',
    status: 'Active',
    accountPassword: 'Password@123'
  }
];

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);
    const db = mongoose.connection.db;

    for (const emp of employeesToSync) {
      await db.collection('employees').updateOne(
        { emailAddress: emp.emailAddress },
        { $set: emp },
        { upsert: true }
      );
    }
    console.log('All employees synced.');

    const all = await db.collection('employees').find({}).toArray();
    console.log(`Total employees in DB: ${all.length}`);
    all.forEach((e, i) => {
      console.log(`${i + 1}. [${e.employeeCode}] ${e.fullName} | ${e.designation} | ${e.department} | ${e.branch}`);
    });

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error syncing employees:', err);
    process.exit(1);
  }
}

run();
