import Opportunity from '../models/Opportunity.js';
import { Product } from '../models/MasterModels.js';

// GET: All opportunities with optional filtering and summary analytics
export const getOpportunities = async (req, res) => {
  try {
    const { search, stage, principal, customer } = req.query;
    const query = {};

    if (stage && stage !== 'All Stages') {
      query.stage = stage;
    }

    if (principal && principal !== 'All Principals') {
      query.principalBrand = principal;
    }

    if (customer && customer !== 'All Customers') {
      query.customerClient = customer;
    }

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { opportunityName: reg },
        { opportunityCode: reg },
        { customerClient: reg },
        { contactPerson: reg },
        { principalBrand: reg },
        { assignedSalesperson: reg }
      ];
    }

    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 });

    // Pipeline Analytics
    const allOpps = await Opportunity.find();
    let totalPipelineValue = 0;
    let wonDealsValue = 0;
    let activeDealsCount = 0;
    let wonDealsCount = 0;

    allOpps.forEach(opp => {
      const val = Number(opp.dealValue) || 0;
      if (opp.stage === 'Won Deals') {
        wonDealsValue += val;
        wonDealsCount++;
      } else if (opp.stage !== 'Lost Deals') {
        totalPipelineValue += val;
        activeDealsCount++;
      }
    });

    const stageBreakdown = {
      'New Leads': allOpps.filter(o => o.stage === 'New Leads').length,
      'Qualified': allOpps.filter(o => o.stage === 'Qualified').length,
      'Proposal Sent': allOpps.filter(o => o.stage === 'Proposal Sent').length,
      'Negotiation': allOpps.filter(o => o.stage === 'Negotiation').length,
      'Won Deals': allOpps.filter(o => o.stage === 'Won Deals').length,
      'Lost Deals': allOpps.filter(o => o.stage === 'Lost Deals').length,
    };

    res.json({
      success: true,
      count: opportunities.length,
      opportunities,
      stats: {
        totalPipelineValue,
        wonDealsValue,
        activeDealsCount,
        wonDealsCount,
        totalDealsCount: allOpps.length,
        winRate: allOpps.length > 0 ? Math.round((wonDealsCount / allOpps.length) * 100) : 0,
        stageBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Single Opportunity by ID
export const getOpportunityById = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({ success: true, opportunity: opp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Calculate quote from machine items
const calculateQuotation = (machines, quoteNumber, revision = 'Rev 0', notes = '') => {
  const sanitizedItems = (machines || []).map(m => {
    const qty = Number(m.quantity) || 1;
    const price = Number(m.unitPrice) || 0;
    return {
      productId: m.productId || '',
      productCode: m.productCode || '',
      productName: m.productName || 'Machine Equipment',
      category: m.category || '',
      principal: m.principal || '',
      unitPrice: price,
      quantity: qty,
      totalPrice: price * qty,
      notes: m.notes || ''
    };
  });

  const subtotal = sanitizedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount;

  return {
    quoteNumber,
    revision,
    quoteDate: new Date().toISOString().split('T')[0],
    subtotal,
    gstRate: 18,
    gstAmount,
    grandTotal,
    status: 'Draft',
    items: sanitizedItems,
    notes: notes || '18% GST applicable. 1 Year standard comprehensive OEM warranty.'
  };
};

// POST: Create Opportunity
export const createOpportunity = async (req, res) => {
  try {
    const data = req.body;

    // Generate opportunity code
    const count = await Opportunity.countDocuments();
    const oppCode = data.opportunityCode || `OPP-${String(count + 1001)}`;

    // Prepare machines with total prices
    const machines = (data.machines || []).map(m => ({
      productId: m.productId || '',
      productCode: m.productCode || '',
      productName: m.productName,
      category: m.category || '',
      principal: m.principal || data.principalBrand || '',
      unitPrice: Number(m.unitPrice) || 0,
      quantity: Number(m.quantity) || 1,
      totalPrice: (Number(m.unitPrice) || 0) * (Number(m.quantity) || 1),
      notes: m.notes || ''
    }));

    // Auto-calculate deal value if dealValue is 0 but machines are provided
    let calculatedDealValue = Number(data.dealValue) || 0;
    const machinesTotal = machines.reduce((s, m) => s + m.totalPrice, 0);
    if (calculatedDealValue === 0 && machinesTotal > 0) {
      calculatedDealValue = machinesTotal;
    }

    // Auto-generate quotation if requested
    const quotations = [];
    if (data.autoGenerateQuote) {
      const quoteNumber = `QTN-${oppCode}-R0`;
      const initialQuote = calculateQuotation(machines, quoteNumber, 'Rev 0');
      quotations.push(initialQuote);
    }

    const newOpp = new Opportunity({
      ...data,
      opportunityCode: oppCode,
      dealValue: calculatedDealValue,
      machines,
      quotations,
      autoGenerateQuote: Boolean(data.autoGenerateQuote)
    });

    const saved = await newOpp.save();
    res.status(201).json({
      success: true,
      message: 'Opportunity registered successfully!',
      opportunity: saved
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT: Update Opportunity
export const updateOpportunity = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    const data = req.body;

    // Sanitize machines
    if (data.machines) {
      data.machines = data.machines.map(m => ({
        productId: m.productId || '',
        productCode: m.productCode || '',
        productName: m.productName,
        category: m.category || '',
        principal: m.principal || data.principalBrand || opp.principalBrand || '',
        unitPrice: Number(m.unitPrice) || 0,
        quantity: Number(m.quantity) || 1,
        totalPrice: (Number(m.unitPrice) || 0) * (Number(m.quantity) || 1),
        notes: m.notes || ''
      }));
    }

    // Handle auto-generation of Rev 0 if previously not generated
    if (data.autoGenerateQuote && (!opp.quotations || opp.quotations.length === 0)) {
      const quoteNumber = `QTN-${opp.opportunityCode}-R0`;
      const machinesToQuote = data.machines || opp.machines || [];
      const newQuote = calculateQuotation(machinesToQuote, quoteNumber, 'Rev 0');
      data.quotations = [newQuote];
    }

    Object.assign(opp, data);
    const updated = await opp.save();

    res.json({
      success: true,
      message: 'Opportunity updated successfully!',
      opportunity: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH: Quick Pipeline Stage update
export const updateOpportunityStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    opp.stage = stage;
    const updated = await opp.save();

    res.json({
      success: true,
      message: `Stage transitioned to "${stage}"!`,
      opportunity: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST: Add Quotation Revision (Rev 1, Rev 2, etc.)
export const addQuotationRevision = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    const { machines, notes, termsAndConditions } = req.body;
    const currentRevs = opp.quotations || [];
    const nextRevNum = currentRevs.length;
    const nextRevStr = `Rev ${nextRevNum}`;
    const quoteNumber = `QTN-${opp.opportunityCode}-R${nextRevNum}`;

    // Mark previous as superseded
    currentRevs.forEach(q => {
      if (q.status === 'Draft' || q.status === 'Official Sent') {
        q.status = 'Superseded';
      }
    });

    const newQuote = calculateQuotation(
      machines || opp.machines,
      quoteNumber,
      nextRevStr,
      notes
    );

    if (termsAndConditions) {
      newQuote.termsAndConditions = termsAndConditions;
    }

    currentRevs.unshift(newQuote);
    opp.quotations = currentRevs;

    const saved = await opp.save();
    res.status(201).json({
      success: true,
      message: `Quotation ${nextRevStr} generated successfully!`,
      opportunity: saved,
      quotation: newQuote
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE: Delete Opportunity
export const deleteOpportunity = async (req, res) => {
  try {
    const opp = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({ success: true, message: `Opportunity ${opp.opportunityCode} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
