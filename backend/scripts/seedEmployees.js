import Employee from '../models/Employee.js';

export const INITIAL_EMPLOYEES = [
  {
    employeeCode: 'EMP-1002',
    fullName: 'Shaikh Tareq',
    gender: 'Male',
    dateOfBirth: '1992-01-01',
    joiningDate: '2026-10-02',
    mobileNo: '8149300734',
    emailAddress: 'tareqanwar12@gmail.com',
    department: 'Management',
    designation: 'System Administrator',
    branch: 'Aurangabad Central',
    employeeGrade: 'Grade A (Senior Mgmt / SUV)',
    securityRole: 'Administrator (ADMIN)',
    status: 'Active',
    accountPassword: 'tareq@123'
  },
  {
    employeeCode: 'EMP-1003',
    fullName: 'Shaikh Anwar',
    gender: 'Male',
    dateOfBirth: '2026-10-01',
    joiningDate: '2026-10-02',
    mobileNo: '7896541236',
    emailAddress: 'anwar43131608@gmail.com',
    department: 'Management',
    designation: 'Branch Manager',
    branch: 'Aurangabad Central',
    employeeGrade: 'Grade A (Senior Mgmt / SUV)',
    securityRole: 'Branch Manager (BRANCH_MGR)',
    status: 'Active',
    accountPassword: 'tareq@123'
  },
  {
    employeeCode: 'EMP-1004',
    fullName: 'Shaikh Talha',
    gender: 'Male',
    dateOfBirth: '2026-07-09',
    joiningDate: '2026-10-02',
    mobileNo: '9632587412',
    emailAddress: 'iqratareq@gmail.com',
    department: 'Service',
    designation: 'Service Engineer',
    branch: 'Aurangabad Central',
    employeeGrade: 'Grade D (Bike / Two-Wheeler)',
    securityRole: 'Service Engineer (SERVICE_ENG)',
    status: 'Active',
    accountPassword: 'tareq@123'
  },
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
    employeeCode: 'EMP-1005',
    fullName: 'Mahesh R. Jadhav',
    gender: 'Male',
    dateOfBirth: '1992-01-01',
    joiningDate: '2026-10-12',
    mobileNo: '+91 97654 32100',
    emailAddress: 'mahesh.jadhav@fieldvisitcrm.com',
    department: 'Sales',
    designation: 'Senior Sales Executive',
    branch: 'Aurangabad Central',
    employeeGrade: 'Grade B',
    securityRole: 'Sales Executive (SALES_EXEC)',
    status: 'Active',
    accountPassword: 'Employee@123'
  }
];

export const seedEmployees = async () => {
  try {
    for (const emp of INITIAL_EMPLOYEES) {
      await Employee.updateOne(
        { emailAddress: emp.emailAddress },
        { $set: emp },
        { upsert: true }
      );
    }
    console.log(`[Seed] Seeded/Verified ${INITIAL_EMPLOYEES.length} initial employees`);
  } catch (err) {
    console.error(`[Seed Employees Error]: ${err.message}`);
  }
};
