import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  productId: { type: String, default: '' },
  productCode: { type: String, default: '' },
  productName: { type: String, required: true },
  modelNumber: { type: String, default: '' },
  category: { type: String, default: '' },
  principal: { type: String, default: '' },
  unitPrice: { type: Number, default: 0 },
  quantity: { type: Number, default: 1, min: 1 },
  totalPrice: { type: Number, default: 0 },
  specifications: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { _id: true });

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
      trim: true
    },
    revision: {
      type: String,
      default: 'Rev 0',
      trim: true
    },
    quotationDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },

    // Section 1: Quotation & Client Details
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity'
    },
    opportunityCode: {
      type: String,
      trim: true,
      default: ''
    },
    opportunityName: {
      type: String,
      required: [true, 'Sales Opportunity is required'],
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
    validityDays: {
      type: Number,
      default: 30,
      min: 1
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT TO CLIENT', 'ACCEPTED (ORDER WON)', 'REJECTED'],
      default: 'DRAFT'
    },
    salesRepresentative: {
      type: String,
      required: [true, 'Sales Representative is required'],
      trim: true
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    emailSentAt: {
      type: Date,
      default: null
    },
    emailSentTo: {
      type: String,
      default: ''
    },
    emailSentFrom: {
      type: String,
      default: 'iqratareq@gmail.com'
    },
    emailStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      default: 'NOT_SENT'
    },

    // Section 2: Quotation Line Items & Machinery Models
    lineItems: [quotationItemSchema],

    // Section 3: Commercial Terms & Pricing Summary
    commercialTerms: {
      type: String,
      default: `1. Price Basis: Ex-works warehouse, packaging & forwarding extra as applicable.
2. Payment Terms: 30% advance with order, balance 70% against dispatch proforma.
3. Delivery: 4 to 6 weeks from receipt of technically & commercially clear order.
4. Warranty: 12 months from commissioning date.
5. Taxes: GST @ 18% extra as applicable.`
    },

    grossSubtotal: {
      type: Number,
      default: 0
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxableAmount: {
      type: Number,
      default: 0
    },
    gstRate: {
      type: Number,
      default: 18
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      default: 0
    },

    // Revision tracking
    revisionNotes: {
      type: String,
      default: ''
    },
    isLatestRevision: {
      type: Boolean,
      default: true
    },
    parentQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Auto-calculate totals before save
quotationSchema.pre('save', async function (next) {
  // 1. Calculate Gross Subtotal
  let subtotal = 0;
  if (this.lineItems && this.lineItems.length > 0) {
    this.lineItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      item.totalPrice = qty * price;
      subtotal += item.totalPrice;
    });
  }
  this.grossSubtotal = subtotal;

  // 2. Calculate Discount
  const discPct = Number(this.discountPercent) || 0;
  this.discountAmount = Math.round((subtotal * discPct) / 100);
  this.taxableAmount = subtotal - this.discountAmount;

  // 3. 18% GST and Grand Total
  this.gstRate = 18;
  this.gstAmount = Math.round(this.taxableAmount * 0.18);
  this.grandTotal = this.taxableAmount + this.gstAmount;

  // 4. Generate quotationNumber if missing
  if (!this.quotationNumber) {
    const oppPrefix = this.opportunityCode ? this.opportunityCode.replace(/[^a-zA-Z0-9]/g, '') : 'DEAL';
    const count = await mongoose.model('Quotation').countDocuments();
    const revTag = (this.revision || 'Rev 0').replace(/\s+/g, '');
    this.quotationNumber = `QTN-${oppPrefix}-${count + 1001}-${revTag}`;
  }

  next();
});

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
