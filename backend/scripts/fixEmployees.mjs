import { connectDB } from '../config/db.js';
import Employee from '../models/Employee.js';

async function fix() {
  await connectDB();
  await Employee.updateOne({ employeeCode: 'EMP-1003' }, { $set: { emailAddress: 'anwar43131608@gmail.com' } });
  console.log('Fixed EMP-1003 email to anwar43131608@gmail.com');
  const employees = await Employee.find().select('+accountPassword +twoFactorSecret +tempTwoFactorSecret').lean();
  console.log('All employees:');
  employees.forEach(e => {
    console.log({
      code: e.employeeCode,
      name: e.fullName,
      email: e.emailAddress,
      password: e.accountPassword,
      isTwoFactorEnabled: e.isTwoFactorEnabled,
      hasSecret: !!e.twoFactorSecret,
      twoFactorSecret: e.twoFactorSecret
    });
  });
  process.exit(0);
}

fix();
