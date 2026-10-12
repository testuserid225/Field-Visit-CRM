import Quotation from '../models/Quotation.js';
import Opportunity from '../models/Opportunity.js';
import Employee from '../models/Employee.js';

export const seedQuotations = async () => {
  try {
    const existingCount = await Quotation.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed] Quotations collection already has ${existingCount} records.`);
      return;
    }

    console.log('[Seed] Seeding initial Quotations & Revisions...');

    const opportunities = await Opportunity.find();
    const salesReps = await Employee.find({ department: { $regex: /sales/i } });
    const defaultRep = salesReps[0]?.fullName || 'Rajesh Sharma';

    const opp1 = opportunities[0];
    const opp2 = opportunities[1];
    const opp3 = opportunities[2];

    const sampleQuotations = [
      {
        quotationNumber: 'QTN-OPP1001-R0-1001',
        revision: 'Rev 0',
        quotationDate: '2026-09-28',
        opportunityId: opp1 ? opp1._id : null,
        opportunityCode: opp1 ? opp1.opportunityCode : 'OPP-1001',
        opportunityName: opp1 ? opp1.opportunityName : 'CNC Turning Center & Automation Cell Setup',
        customerClient: opp1 ? opp1.customerClient : 'Tata Motors Ltd',
        contactPerson: opp1 ? opp1.contactPerson : 'Karan Sharma',
        validityDays: 30,
        status: 'ACCEPTED (ORDER WON)',
        salesRepresentative: opp1?.assignedSalesperson || defaultRep,
        lineItems: [
          {
            productCode: 'PROD-101',
            productName: 'CNC Turning Center Lynx 2100',
            modelNumber: 'LYNX-2100-LS',
            category: 'CNC Turning Center',
            principal: 'Ace Micromatic Group',
            unitPrice: 2800000,
            quantity: 1,
            totalPrice: 2800000,
            specifications: 'Spindle 6000 RPM, 12-station servo turret',
            notes: 'Includes chip conveyor & tool presetter'
          },
          {
            productCode: 'PROD-102',
            productName: 'Vertical Machining Center DNM 4500',
            modelNumber: 'DNM-4500-FANUC',
            category: 'Vertical Machining Centers',
            principal: 'Ace Micromatic Group',
            unitPrice: 2700000,
            quantity: 1,
            totalPrice: 2700000,
            specifications: '12000 RPM direct drive spindle, 30 tool magazine',
            notes: 'High pressure coolant through spindle'
          }
        ],
        discountPercent: 5,
        commercialTerms: `1. Price Basis: Ex-works warehouse, packaging & forwarding extra as applicable.
2. Payment Terms: 30% advance with order, balance 70% against dispatch proforma.
3. Delivery: 4 to 6 weeks from receipt of technically & commercially clear order.
4. Warranty: 12 months from commissioning date.
5. Taxes: GST @ 18% extra as applicable.`,
        revisionNotes: 'Initial commercial quotation accepted by procurement committee with 5% corporate discount.',
        isLatestRevision: true
      },
      {
        quotationNumber: 'QTN-OPP1002-R1-1002',
        revision: 'Rev 1',
        quotationDate: '2026-09-30',
        opportunityId: opp2 ? opp2._id : null,
        opportunityCode: opp2 ? opp2.opportunityCode : 'OPP-1002',
        opportunityName: opp2 ? opp2.opportunityName : 'Omni-Channel Retail POS & Barcode Terminals',
        customerClient: opp2 ? opp2.customerClient : 'Zenith Retail & Hypermarkets',
        contactPerson: opp2 ? opp2.contactPerson : 'Priya Nair',
        validityDays: 45,
        status: 'SENT TO CLIENT',
        salesRepresentative: opp2?.assignedSalesperson || defaultRep,
        lineItems: [
          {
            productCode: 'PROD-103',
            productName: 'Heavy Duty Horizontal Turning Center PUMA 2600',
            modelNumber: 'PUMA-2600Y-II',
            category: 'CNC Turning Center',
            principal: 'Doosan Machine Tools',
            unitPrice: 3800000,
            quantity: 1,
            totalPrice: 3800000,
            specifications: 'Y-axis milling, programmable tailstock',
            notes: 'Heavy duty box guideways'
          }
        ],
        discountPercent: 3,
        commercialTerms: `1. Price Basis: Ex-works warehouse, packaging & forwarding extra as applicable.
2. Payment Terms: 30% advance with order, balance 70% against dispatch proforma.
3. Delivery: 4 to 6 weeks from receipt of technically & commercially clear order.
4. Warranty: 12 months from commissioning date.
5. Taxes: GST @ 18% extra as applicable.`,
        revisionNotes: 'Rev 1 revised based on technical query regarding Y-axis milling stroke.',
        isLatestRevision: true
      },
      {
        quotationNumber: 'QTN-OPP1003-R0-1003',
        revision: 'Rev 0',
        quotationDate: '2026-10-01',
        opportunityId: opp3 ? opp3._id : null,
        opportunityCode: opp3 ? opp3.opportunityCode : 'OPP-1003',
        opportunityName: opp3 ? opp3.opportunityName : '5-Axis Machining Center for Aerospace Turbine Discs',
        customerClient: opp3 ? opp3.customerClient : 'Apex Healthcare Diagnostics Ltd',
        contactPerson: opp3 ? opp3.contactPerson : 'Dr. Rajesh Sharma',
        validityDays: 30,
        status: 'DRAFT',
        salesRepresentative: opp3?.assignedSalesperson || defaultRep,
        lineItems: [
          {
            productCode: 'PROD-104',
            productName: '5-Axis Simultaneous Machining Center DVF 5000',
            modelNumber: 'DVF-5000-HEIDENHAIN',
            category: '5-Axis Machining Center',
            principal: 'Ace Micromatic Group',
            unitPrice: 7500000,
            quantity: 1,
            totalPrice: 7500000,
            specifications: 'Heidenhain TNC 640, 18000 RPM spindle',
            notes: 'Renishaw touch probe included'
          }
        ],
        discountPercent: 0,
        commercialTerms: `1. Price Basis: Ex-works warehouse, packaging & forwarding extra as applicable.
2. Payment Terms: 30% advance with order, balance 70% against dispatch proforma.
3. Delivery: 4 to 6 weeks from receipt of technically & commercially clear order.
4. Warranty: 12 months from commissioning date.
5. Taxes: GST @ 18% extra as applicable.`,
        revisionNotes: 'Initial draft proposal prepared for client technical review.',
        isLatestRevision: true
      }
    ];

    for (const qData of sampleQuotations) {
      const q = new Quotation(qData);
      await q.save();
    }

    console.log(`[Seed] Seeded ${sampleQuotations.length} initial Quotations successfully!`);
  } catch (err) {
    console.error('[Seed] Error seeding quotations:', err.message);
  }
};
