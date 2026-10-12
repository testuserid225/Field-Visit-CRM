import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      unique: true,
      trim: true
    },
    // 1. Personal & Contact Information
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    dateOfBirth: {
      type: String,
      default: '1992-01-01'
    },
    joiningDate: {
      type: String,
      required: [true, 'Joining Date is required'],
      default: '2026-09-30'
    },
    mobileNo: {
      type: String,
      required: [true, 'Mobile No is required'],
      trim: true
    },
    emailAddress: {
      type: String,
      required: [true, 'Email Address is required'],
      trim: true,
      lowercase: true
    },

    // 2. Department, Branch & Classification
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      default: 'Sales'
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      default: 'Sales Executive'
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
      default: 'Mumbai HQ'
    },
    employeeGrade: {
      type: String,
      required: [true, 'Employee Grade is required'],
      trim: true,
      default: 'Grade B'
    },

    // 3. Security Role & System Credentials
    securityRole: {
      type: String,
      required: [true, 'Security Role is required'],
      trim: true,
      default: 'Sales Executive (SALES_EXEC)'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active'
    },
    accountPassword: {
      type: String,
      required: [true, 'Account Password is required'],
      default: 'Employee@123',
      select: false
    },
    // Two-Factor Authentication (TOTP / Google Authenticator)
    isTwoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false,
      default: null
    },
    tempTwoFactorSecret: {
      type: String,
      select: false,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate employeeCode before save if not provided
employeeSchema.pre('save', async function (next) {
  if (!this.employeeCode) {
    try {
      const allEmps = await mongoose.model('Employee').find({}, { employeeCode: 1 });
      let maxNum = 1000;
      for (const emp of allEmps) {
        if (emp.employeeCode) {
          const match = String(emp.employeeCode).match(/EMP-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      this.employeeCode = `EMP-${maxNum + 1}`;
    } catch (err) {
      this.employeeCode = `EMP-${Date.now()}`;
    }
  }
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
