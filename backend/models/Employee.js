import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

// Pre-save hook: auto-generate employeeCode and hash accountPassword
employeeSchema.pre('save', async function (next) {
  // 1. Auto-generate employeeCode if missing
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

  // 2. Hash accountPassword if modified and not already a bcrypt hash
  if (this.isModified('accountPassword') && this.accountPassword) {
    if (!this.accountPassword.startsWith('$2a$') && !this.accountPassword.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.accountPassword = await bcrypt.hash(this.accountPassword, salt);
    }
  }

  next();
});

// Compare password helper (supports both bcrypt hashes and legacy plain-text)
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.accountPassword || !candidatePassword) return false;
  if (this.accountPassword.startsWith('$2a$') || this.accountPassword.startsWith('$2b$')) {
    return await bcrypt.compare(candidatePassword, this.accountPassword);
  }
  // Backward-compatibility: plain text match for legacy accounts
  return this.accountPassword === candidatePassword;
};

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
