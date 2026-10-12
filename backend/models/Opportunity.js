import mongoose from 'mongoose';

const machineItemSchema = new mongoose.Schema({
  productId: { type: String, default: '' },
  productCode: { type: String, default: '' },
  productName: { type: String, required: true },
  category: { type: String, default: '' },
  principal: { type: String, default: '' },
  unitPrice: { type: Number, default: 0 },
  quantity: { type: Number, default: 1, min: 1 },
  totalPrice: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { _id: true });

const quotationRevisionSchema = new mongoose.Schema({
  quoteNumber: { type: String, required: true },
  revision: { type: String, default: 'Rev 0' },
  quoteDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  subtotal: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Official Sent', 'Negotiation', 'Accepted', 'Superseded'], default: 'Draft' },
  items: [machineItemSchema],
  termsAndConditions: { type: String, default: 'Payment 30 days from invoice. Delivery 3-4 weeks. Warranty 12 months from commissioning.' },
  notes: { type: String, default: '' }
}, { timestamps: true });

const opportunitySchema = new mongoose.Schema(
  {
    opportunityCode: {
      type: String,
      unique: true,
      trim: true
    },
    // Tab 1 - Section 1: Opportunity & Client Information
    opportunityName: {
      type: String,
      required: [true, 'Opportunity Name / Requirement Title is required'],
      trim: true
    },
    principalBrand: {
      type: String,
      required: [true, 'Principal / Manufacturer Brand is required'],
      trim: true
    },
    customerClient: {
      type: String,
      required: [true, 'Customer Client is required'],
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true,
      default: ''
    },
    leadSource: {
      type: String,
      enum: [
        'Direct Daily Visit',
        'Exhibition / Trade Show',
        'OEM Principal Referral',
        'Website / Inbound',
        'Cold Outreach',
        'Repeat Customer Order'
      ],
      default: 'Direct Daily Visit'
    },
    assignedSalesperson: {
      type: String,
      trim: true,
      default: ''
    },
    stage: {
      type: String,
      enum: [
        'New Leads',
        'Qualified',
        'Proposal Sent',
        'Negotiation',
        'Won Deals',
        'Lost Deals'
      ],
      default: 'New Leads'
    },
    dealValue: {
      type: Number,
      default: 0
    },
    leadDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    expectedClosureDate: {
      type: String,
      default: ''
    },
    isNewClientAcquisition: {
      type: Boolean,
      default: false
    },

    // Tab 1 - Section 2: Technical Scope & Customer Requirements
    technicalRequirements: {
      type: String,
      trim: true,
      default: ''
    },

    // Tab 1 - Section 3: Competitor Intelligence & Win/Loss Analysis
    competitorInfo: {
      brandName: { type: String, default: '' },
      modelOffering: { type: String, default: '' },
      estimatedPrice: { type: Number, default: 0 },
      threatLevel: {
        type: String,
        enum: [
          '🟢 Low Threat - We Have Strong Preference',
          '🟡 Medium Threat - Active Evaluation by Client',
          '🟠 High Threat - Strong Price / Feature Rivalry',
          '🔴 Dominant Threat - Incumbent Supplier',
          ''
        ],
        default: '🟢 Low Threat - We Have Strong Preference'
      },
      weaknessesWinningEdge: { type: String, default: '' },
      keyStrengthsPitch: { type: String, default: '' },
      winLossRationale: { type: String, default: '' }
    },

    // Tab 2: Machine / Products
    machines: [machineItemSchema],

    // Tab 3: Commercial Quotations & Revisions
    autoGenerateQuote: {
      type: Boolean,
      default: false
    },
    quotations: [quotationRevisionSchema],

    status: {
      type: String,
      enum: ['Active', 'Closed', 'Archived'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate opportunityCode if not present
opportunitySchema.pre('save', async function (next) {
  if (!this.opportunityCode) {
    const count = await mongoose.model('Opportunity').countDocuments();
    this.opportunityCode = `OPP-${String(count + 1001)}`;
  }
  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);
export default Opportunity;
