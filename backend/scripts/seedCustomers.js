import Customer from '../models/Customer.js';

export const INITIAL_CUSTOMERS = [
  {
    customerCode: 'CUST-1001',
    organizationName: 'Apex Healthcare Diagnostics Ltd',
    customerType: 'Existing Customer',
    industrySegment: 'Pharmaceuticals & Healthcare',
    primaryContactPerson: 'Dr. Rajesh Sharma',
    email: 'contact@apexhealth.com',
    leadSource: 'Reference',
    websiteUrl: 'https://apexhealth.com',
    status: 'Active',
    city: 'Mumbai',
    state: 'Maharashtra',
    fullAddress: 'Plot 42, Bandra-Kurla Complex, Bandra East, Mumbai 400051',
    remarks: 'Tier-1 enterprise diagnostic network with 14 pathology clinics across Western India.'
  },
  {
    customerCode: 'CUST-1002',
    organizationName: 'Zenith Retail & Hypermarkets',
    customerType: 'Existing Customer',
    industrySegment: 'FMCG & Consumer Goods',
    primaryContactPerson: 'Priya Nair',
    email: 'procurement@zenithretail.in',
    leadSource: 'Direct Visit',
    websiteUrl: 'https://zenithretail.in',
    status: 'Active',
    city: 'Bengaluru',
    state: 'Karnataka',
    fullAddress: 'Level 5, Sigma Tech Park, Whitefield Main Road, Bengaluru 560066',
    remarks: 'Rapidly growing regional retail chain currently evaluating POS upgrade.'
  },
  {
    customerCode: 'CUST-1003',
    organizationName: 'Blue Horizon Maritime Logistics',
    customerType: 'Prospect',
    industrySegment: 'Automotive & Engineering',
    primaryContactPerson: 'Vikram Malhotra',
    email: 'operations@bluehorizon.com',
    leadSource: 'LinkedIn',
    websiteUrl: 'https://bluehorizon.com',
    status: 'Lead',
    city: 'Chennai',
    state: 'Tamil Nadu',
    fullAddress: 'Harbour Gate Commercial Towers, Rajaji Salai, Chennai 600001',
    remarks: 'High potential container logistics prospect seeking automated fleet telemetry.'
  },
  {
    customerCode: 'CUST-1004',
    organizationName: 'GreenPulse Agri Foods & Beverages',
    customerType: 'Existing Customer',
    industrySegment: 'FMCG & Consumer Goods',
    primaryContactPerson: 'Sunita Deshmukh',
    email: 'info@greenpulsefoods.com',
    leadSource: 'Exhibition / Event',
    websiteUrl: 'https://greenpulsefoods.com',
    status: 'Active',
    city: 'Pune',
    state: 'Maharashtra',
    fullAddress: 'MIDC Bio-Technology Zone, Hinjewadi Phase 3, Pune 411057',
    remarks: 'Organic food processing plant. Regular monthly maintenance check scheduled.'
  },
  {
    customerCode: 'CUST-1005',
    organizationName: 'Sterling Advanced Polymers',
    customerType: 'Prospect',
    industrySegment: 'Heavy Machinery & Metallurgy',
    primaryContactPerson: 'Arun Verma',
    email: 'plant@sterlingpolymers.com',
    leadSource: 'Cold Call',
    websiteUrl: 'https://sterlingpolymers.com',
    status: 'Prospect',
    city: 'Vadodara',
    state: 'Gujarat',
    fullAddress: 'Nandesari Industrial Estate, NH-8 Corridor, Vadodara 391340',
    remarks: 'Contract negotiation underway for industrial polymer compounding components.'
  },
  {
    customerCode: 'CUST-1006',
    organizationName: 'Metro Transit Tech Solutions',
    customerType: 'Prospect',
    industrySegment: 'Information Technology',
    primaryContactPerson: 'Klaus Weber',
    email: 'klaus.weber@metrotransit.tech',
    leadSource: 'Website',
    websiteUrl: 'https://metrotransit.tech',
    status: 'Inactive',
    city: 'Hyderabad',
    state: 'Telangana',
    fullAddress: 'Building 12B, HITEC City, Madhapur, Hyderabad 500081',
    remarks: 'Smart ticketing systems vendor. Follow-up postponed to Q3 budget cycle.'
  }
];

export const seedCustomers = async () => {
  try {
    const count = await Customer.countDocuments();
    if (count === 0) {
      await Customer.insertMany(INITIAL_CUSTOMERS);
      console.log(`[Seed] Seeded ${INITIAL_CUSTOMERS.length} initial customers`);
    }
  } catch (err) {
    console.error(`[Seed Customers Error]: ${err.message}`);
  }
};
