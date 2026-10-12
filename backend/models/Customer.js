import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerCode: {
      type: String,
      unique: true,
      trim: true
    },
    // Section 1: Organization & Business Profile
    organizationName: {
      type: String,
      required: [true, 'Customer Organization Name is required'],
      trim: true
    },
    customerType: {
      type: String,
      required: [true, 'Customer Type is required'],
      enum: ['Existing Customer', 'Prospect'],
      default: 'Existing Customer'
    },
    industrySegment: {
      type: String,
      required: [true, 'Industry Segment is required'],
      trim: true
    },
    primaryContactPerson: {
      type: String,
      required: [true, 'Primary Contact Person is required'],
      trim: true
    },
    leadSource: {
      type: String,
      required: [true, 'Lead Source is required'],
      enum: ['Direct Visit', 'Reference', 'Website', 'LinkedIn', 'Cold Call', 'Exhibition / Event'],
      default: 'Direct Visit'
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Active', 'Inactive', 'Lead', 'Prospect'],
      default: 'Active'
    },

    // Section 2: Location & Notes
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    fullAddress: {
      type: String,
      trim: true,
      default: ''
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate customerCode before save if not provided
customerSchema.pre('save', async function (next) {
  if (!this.customerCode) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerCode = `CUST-${String(count + 101).padStart(4, '0')}`;
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
