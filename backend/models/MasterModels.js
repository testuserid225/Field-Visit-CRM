import mongoose from 'mongoose';

// 1. Branch
const branchSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  branchName: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  manager: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 2. Department
const departmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  departmentName: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 3. Designation
const designationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  designationTitle: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 4. Expense Head
const expenseHeadSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  expenseHeadName: { type: String, required: true, trim: true },
  receiptRequired: { type: String, enum: ['No Bill', 'Bill Required'], default: 'Bill Required' },
  requiresKm: { type: String, enum: ['Yes (Fuel)', 'No'], default: 'No' },
  defaultRate: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 5. Grade Fuel Rate
const gradeFuelRateSchema = new mongoose.Schema({
  gradeCode: { type: String, required: true, unique: true, trim: true },
  gradeName: { type: String, required: true, trim: true },
  fuelRate: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 6. Industry
const industrySchema = new mongoose.Schema({
  industryCode: { type: String, required: true, unique: true, trim: true },
  industrySegmentName: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 7. Principal / OEM Brand
const principalSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  principalName: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 8. Category
const categorySchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 9. Product
const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  productName: { type: String, required: true, trim: true },
  principal: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  accessibleRole: { type: String, default: 'Sales' },
  targetRole: { type: String, default: 'Sales' },
  unitPrice: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// 10. Activity Type
const activityTypeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  activityName: { type: String, required: true, trim: true },
  accessibleRole: { type: String, default: 'Sales' },
  targetRole: { type: String, default: 'Sales' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const Branch = mongoose.model('Branch', branchSchema);
export const Department = mongoose.model('Department', departmentSchema);
export const Designation = mongoose.model('Designation', designationSchema);
export const ExpenseHead = mongoose.model('ExpenseHead', expenseHeadSchema);
export const GradeFuelRate = mongoose.model('GradeFuelRate', gradeFuelRateSchema);
export const Industry = mongoose.model('Industry', industrySchema);
export const Principal = mongoose.model('Principal', principalSchema);
export const Category = mongoose.model('Category', categorySchema);
export const Product = mongoose.model('Product', productSchema);
export const ActivityType = mongoose.model('ActivityType', activityTypeSchema);

export const MASTER_MODELS = {
  branches: Branch,
  departments: Department,
  designations: Designation,
  'expense-heads': ExpenseHead,
  'grade-fuel-rates': GradeFuelRate,
  industries: Industry,
  principals: Principal,
  categories: Category,
  products: Product,
  'activity-types': ActivityType
};
