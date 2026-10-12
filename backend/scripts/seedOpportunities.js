import mongoose from 'mongoose';
import Opportunity from '../models/Opportunity.js';

export const seedOpportunities = async () => {
  try {
    const count = await Opportunity.countDocuments();
    if (count > 0) {
      console.log(`Opportunities already seeded (${count} records).`);
      return;
    }

    const demoOpportunities = [
      {
        opportunityCode: 'OPP-1001',
        opportunityName: 'Full Diagnostic Wing Imaging Upgrade',
        principalBrand: 'Siemens Healthineers',
        customerClient: 'Apex Healthcare & Diagnostic Center',
        contactPerson: 'Dr. Rajesh Sharma (Director)',
        leadSource: 'OEM Principal Referral',
        assignedSalesperson: 'Shaikh Tareq Anwar',
        stage: 'Proposal Sent',
        dealValue: 900000,
        leadDate: '2026-09-20',
        expectedClosureDate: '2026-10-25',
        isNewClientAcquisition: false,
        technicalRequirements: 'High-frequency clinical ultrasound suite with Doppler imaging and PACS cloud integration. Requires DICOM 3.0 protocol and 24/7 OEM SLA.',
        competitorInfo: {
          brandName: 'GE Healthcare',
          modelOffering: 'Logiq P9 Ultrasound System',
          estimatedPrice: 950000,
          threatLevel: '🟡 Medium Threat - Active Evaluation by Client',
          weaknessesWinningEdge: 'Higher annual maintenance contract cost; our Siemens package offers 3 years comprehensive warranty.',
          keyStrengthsPitch: 'Stronger brand equity in cardiology wing.',
          winLossRationale: 'Customer prioritizes lower 5-year TCO and local engineer availability in Mumbai.'
        },
        machines: [
          {
            productCode: 'PRD-101',
            productName: 'HealthScan Pro Ultrasound X5',
            category: 'Diagnostic Imaging & Ultrasound',
            principal: 'Siemens Healthineers',
            unitPrice: 450000,
            quantity: 2,
            totalPrice: 900000,
            notes: 'Includes dual probes (Convex & Linear) and motorized workstation cart.'
          }
        ],
        autoGenerateQuote: true,
        quotations: [
          {
            quoteNumber: 'QTN-OPP-1001-R0',
            revision: 'Rev 0',
            quoteDate: '2026-09-21',
            subtotal: 900000,
            gstRate: 18,
            gstAmount: 162000,
            grandTotal: 1062000,
            status: 'Official Sent',
            items: [
              {
                productCode: 'PRD-101',
                productName: 'HealthScan Pro Ultrasound X5',
                category: 'Diagnostic Imaging & Ultrasound',
                principal: 'Siemens Healthineers',
                unitPrice: 450000,
                quantity: 2,
                totalPrice: 900000,
                notes: 'Includes dual probes (Convex & Linear) and motorized workstation cart.'
              }
            ],
            termsAndConditions: 'Payment 30% advance, 70% against delivery. Comprehensive 36-month OEM warranty.',
            notes: 'Standard official proposal sent to Dr. Sharma.'
          }
        ]
      },
      {
        opportunityCode: 'OPP-1002',
        opportunityName: 'Omni-Channel Retail POS & Barcode Terminals',
        principalBrand: 'Honeywell Automation Systems',
        customerClient: 'Zenith Retail & Supermarket Chain',
        contactPerson: 'Priya Nair (Procurement Head)',
        leadSource: 'Direct Daily Visit',
        assignedSalesperson: 'Shaikh Tareq Anwar',
        stage: 'Negotiation',
        dealValue: 350000,
        leadDate: '2026-09-24',
        expectedClosureDate: '2026-10-15',
        isNewClientAcquisition: false,
        technicalRequirements: 'Ruggedized Android touch point-of-sale checkout terminals with integrated 2D scanner for 10 supermarket checkout counters.',
        competitorInfo: {
          brandName: 'Zebra Technologies',
          modelOffering: 'TC52x Touch Computer & MP7000 Scanner',
          estimatedPrice: 380000,
          threatLevel: '🟢 Low Threat - We Have Strong Preference',
          weaknessesWinningEdge: 'Zebra terminal delivery timeline is 8 weeks; Honeywell has ready inventory in Mumbai warehouse.',
          keyStrengthsPitch: 'Extremely durable drop resistance.',
          winLossRationale: 'Zenith needs installation before festive Diwali rush, favoring our immediate stock.'
        },
        machines: [
          {
            productCode: 'PRD-102',
            productName: 'Honeywell OmniPOS Turbo Terminal',
            category: 'Retail POS & Barcode Terminals',
            principal: 'Honeywell Automation Systems',
            unitPrice: 35000,
            quantity: 10,
            totalPrice: 350000,
            notes: 'Countertop mounting brackets and pre-loaded retail inventory app included.'
          }
        ],
        autoGenerateQuote: true,
        quotations: [
          {
            quoteNumber: 'QTN-OPP-1002-R0',
            revision: 'Rev 0',
            quoteDate: '2026-09-25',
            subtotal: 350000,
            gstRate: 18,
            gstAmount: 63000,
            grandTotal: 413000,
            status: 'Negotiation',
            items: [
              {
                productCode: 'PRD-102',
                productName: 'Honeywell OmniPOS Turbo Terminal',
                category: 'Retail POS & Barcode Terminals',
                principal: 'Honeywell Automation Systems',
                unitPrice: 35000,
                quantity: 10,
                totalPrice: 350000,
                notes: 'Countertop mounting brackets and pre-loaded retail inventory app included.'
              }
            ],
            termsAndConditions: '100% on delivery. 1 year replacement warranty.',
            notes: 'Client requested 5% bulk discount; under review by management.'
          }
        ]
      },
      {
        opportunityCode: 'OPP-1003',
        opportunityName: 'Smart Optical Sensors for Assembly Line Automation',
        principalBrand: 'Omron Electronic Components',
        customerClient: 'Apex Healthcare & Diagnostic Center',
        contactPerson: 'Vikram Malhotra (Operations VP)',
        leadSource: 'Exhibition / Trade Show',
        assignedSalesperson: 'Shaikh Tareq Anwar',
        stage: 'New Leads',
        dealValue: 170000,
        leadDate: '2026-09-28',
        expectedClosureDate: '2026-11-10',
        isNewClientAcquisition: true,
        technicalRequirements: 'High-speed fiber-optic photoelectric sensors for cleanroom packaging lines with IP67 washdown certification.',
        competitorInfo: {
          brandName: 'Keyence',
          modelOffering: 'FS-N40 Series Fiber Optic Sensor',
          estimatedPrice: 210000,
          threatLevel: '🟠 High Threat - Strong Price / Feature Rivalry',
          weaknessesWinningEdge: 'Keyence does not support third-party PLC interfaces without proprietary gateway.',
          keyStrengthsPitch: 'Superior response time under 10 microseconds.',
          winLossRationale: 'Omron sensor openness to Modbus/TCP will be key selling point.'
        },
        machines: [
          {
            productCode: 'PRD-103',
            productName: 'Omron Smart Sensor Node E3X',
            category: 'Industrial Automation Sensors',
            principal: 'Omron Electronic Components',
            unitPrice: 8500,
            quantity: 20,
            totalPrice: 170000,
            notes: 'Requires DIN rail mounting clips and fiber cable bundles.'
          }
        ],
        autoGenerateQuote: false,
        quotations: []
      }
    ];

    await Opportunity.insertMany(demoOpportunities);
    console.log(`Seeded ${demoOpportunities.length} opportunities into MongoDB.`);
  } catch (error) {
    console.error('Error seeding opportunities:', error.message);
  }
};
