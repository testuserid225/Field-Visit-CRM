import Customer from '../models/Customer.js';
import { Industry } from '../models/MasterModels.js';

// GET: View all customers with search & filter
export const getCustomers = async (req, res) => {
  try {
    const { search, customerType, status, industrySegment } = req.query;
    let filter = {};

    if (customerType && customerType !== 'all') {
      filter.customerType = customerType;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (industrySegment && industrySegment !== 'all') {
      filter.industrySegment = industrySegment;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { organizationName: searchRegex },
        { customerCode: searchRegex },
        { primaryContactPerson: searchRegex },
        { email: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { industrySegment: searchRegex },
        { leadSource: searchRegex }
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Single customer
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create customer
export const createCustomer = async (req, res) => {
  try {
    const {
      organizationName,
      customerType,
      industrySegment,
      primaryContactPerson,
      email,
      leadSource,
      websiteUrl,
      status,
      city,
      state,
      fullAddress,
      remarks
    } = req.body;

    if (!organizationName || !primaryContactPerson || !city || !state || !industrySegment) {
      return res.status(400).json({
        success: false,
        message: 'Organization Name, Industry Segment, Primary Contact Person, City, and State are required.'
      });
    }

    const customer = await Customer.create({
      organizationName,
      customerType: customerType || 'Existing Customer',
      industrySegment,
      primaryContactPerson,
      email: email || '',
      leadSource: leadSource || 'Direct Visit',
      websiteUrl: websiteUrl || '',
      status: status || 'Active',
      city,
      state,
      fullAddress: fullAddress || '',
      remarks: remarks || ''
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Customer.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Customer.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Helper to fetch active industry segment master values
export const getIndustrySegmentsFromMaster = async (req, res) => {
  try {
    const industries = await Industry.find({ status: 'Active' }).sort({ industrySegmentName: 1 });
    const segments = industries.map(ind => ind.industrySegmentName);
    
    // Provide default fallbacks if master is empty
    const defaultSegments = [
      'Pharmaceuticals & Healthcare',
      'Automotive & Engineering',
      'FMCG & Consumer Goods',
      'Information Technology',
      'Heavy Machinery & Metallurgy',
      'Textiles & Apparels',
      'Chemicals & Petrochemicals'
    ];

    const finalSegments = segments.length > 0 ? segments : defaultSegments;
    res.json({ success: true, segments: finalSegments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
