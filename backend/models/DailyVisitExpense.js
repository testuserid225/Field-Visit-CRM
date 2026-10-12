import mongoose from 'mongoose';

const expenseLineItemSchema = new mongoose.Schema({
  expenseHeadId: {
    type: String,
    default: null
  },
  expenseHead: {
    type: String,
    required: [true, 'Expense Head is required'],
    trim: true
  },
  isFuel: {
    type: Boolean,
    default: false
  },
  startKm: {
    type: Number,
    default: 0
  },
  endKm: {
    type: Number,
    default: 0
  },
  totalKm: {
    type: Number,
    default: 0
  },
  fuelRate: {
    type: Number,
    default: 0
  },
  tollTax: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  receipt: {
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  }
}, { _id: true });

const reportAttachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  fileType: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const dailyVisitExpenseSchema = new mongoose.Schema({
  reportNumber: {
    type: String,
    unique: true,
    trim: true
  },
  // Section 1: Employee & Department
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  employeeCode: {
    type: String,
    default: ''
  },
  employeeName: {
    type: String,
    required: [true, 'Employee Name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true
  },

  // Section 2: Customer & Activity Details
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerName: {
    type: String,
    required: [true, 'Customer Name is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact Person is required'],
    trim: true
  },
  activity: {
    type: String,
    required: [true, 'Activity is required'],
    trim: true,
    default: 'Routine Maintenance / AMC'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productMachine: {
    type: String,
    required: [true, 'Product / Machine is required'],
    trim: true
  },

  // Section 3: Visit Schedule & Route
  visitDate: {
    type: String,
    required: [true, 'Visit Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start Time is required'],
    default: '09:30'
  },
  endTime: {
    type: String,
    required: [true, 'End Time is required'],
    default: '18:00'
  },
  personCount: {
    type: Number,
    required: [true, 'Person Count is required'],
    default: 1,
    min: 1
  },
  placeFrom: {
    type: String,
    required: [true, 'Place From is required'],
    trim: true
  },
  placeTo: {
    type: String,
    required: [true, 'Place To is required'],
    trim: true
  },

  // Section 4: Sales Visit Report & Executive Summary
  executiveSummary: {
    type: String,
    trim: true,
    default: ''
  },
  attachments: [reportAttachmentSchema],

  // Section 5: Itemized Expense Details Sub-Grid
  expenseLines: [expenseLineItemSchema],

  totalKm: {
    type: Number,
    default: 0
  },
  totalClaimAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED'],
    default: 'SUBMITTED'
  },
  approverRemarks: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: String,
    default: ''
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: String,
    default: ''
  },
  rejectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Pre-save hook: auto-generate reportNumber & compute totals
dailyVisitExpenseSchema.pre('save', async function (next) {
  // Generate Report Number if missing
  if (!this.reportNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('DailyVisitExpense').countDocuments();
    const seq = String(count + 1001).padStart(4, '0');
    this.reportNumber = `DVE-${year}-${seq}`;
  }

  // Calculate line item totals & claim total
  let claimSum = 0;
  let kmSum = 0;

  if (this.expenseLines && this.expenseLines.length > 0) {
    this.expenseLines.forEach(line => {
      if (line.isFuel) {
        const start = Number(line.startKm) || 0;
        const end = Number(line.endKm) || 0;
        line.totalKm = Math.max(0, end - start);
        const rate = Number(line.fuelRate) || 0;
        const toll = Number(line.tollTax) || 0;
        line.amount = Math.round((line.totalKm * rate) + toll);
      } else {
        line.startKm = 0;
        line.endKm = 0;
        line.totalKm = 0;
        line.fuelRate = 0;
        line.tollTax = 0;
        line.amount = Number(line.amount) || 0;
      }
      claimSum += Number(line.amount) || 0;
      kmSum += Number(line.totalKm) || 0;
    });
  }

  this.totalClaimAmount = claimSum;
  this.totalKm = kmSum;
  next();
});

const DailyVisitExpense = mongoose.model('DailyVisitExpense', dailyVisitExpenseSchema);
export default DailyVisitExpense;
