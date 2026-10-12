import DailyVisitExpense from '../models/DailyVisitExpense.js';
import Employee from '../models/Employee.js';
import Customer from '../models/Customer.js';
import ContactPerson from '../models/ContactPerson.js';
import { Product, ExpenseHead } from '../models/MasterModels.js';

export const seedDailyVisitExpenses = async () => {
  try {
    const existingCount = await DailyVisitExpense.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed] Daily Visit & Expenses collection already has ${existingCount} records.`);
      return;
    }

    console.log('[Seed] Seeding initial Daily Visit & Expense records...');

    const employees = await Employee.find();
    const customers = await Customer.find();
    const contacts = await ContactPerson.find();
    const products = await Product.find();
    const expenseHeads = await ExpenseHead.find();

    const emp1 = employees[0] || { fullName: 'Rajesh Sharma', department: 'Sales & Field Engineering', branch: 'Mumbai HQ' };
    const emp2 = employees[1] || emp1;
    const cust1 = customers[0] || { organizationName: 'Tata Motors Ltd', primaryContactPerson: 'Karan Sharma' };
    const cust2 = customers[1] || cust1;
    const cust3 = customers[2] || cust1;

    const prod1 = products[0]?.productName || 'CNC Turning Center Lynx 2100';
    const prod2 = products[1]?.productName || 'Vertical Machining Center DNM 4500';
    const prod3 = products[2]?.productName || 'Heavy Duty Horizontal Turning Center PUMA 2600';

    const sampleReports = [
      {
        reportNumber: 'DVE-2026-1001',
        employeeId: emp1._id,
        employeeCode: emp1.employeeCode || 'EMP-101',
        employeeName: emp1.fullName,
        department: emp1.department,
        branch: emp1.branch,
        customerId: cust1._id,
        customerName: cust1.organizationName,
        contactPerson: cust1.primaryContactPerson || 'Karan Sharma',
        activity: 'Machine Commissioning & Installation',
        productId: products[0]?._id || null,
        productMachine: prod1,
        visitDate: '2026-09-29',
        startTime: '09:00',
        endTime: '17:30',
        personCount: 2,
        placeFrom: 'Mumbai Branch Office',
        placeTo: 'Tata Motors Plant - Chakan MIDC',
        executiveSummary: 'Completed Phase 1 spindle leveling and geometric alignment for Lynx 2100. Met Plant GM and Production Head; test cut trial scheduled for tomorrow.',
        attachments: [
          {
            fileName: 'Commissioning_Checklist_Lynx2100.pdf',
            fileUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
            fileSize: '1.4 MB',
            fileType: 'application/pdf'
          }
        ],
        expenseLines: [
          {
            expenseHead: 'Four-Wheeler Travel Fuel',
            isFuel: true,
            startKm: 14200,
            endKm: 14320,
            totalKm: 120,
            fuelRate: 9.0,
            tollTax: 160,
            amount: 1240, // (120 * 9) + 160
            remarks: 'Round trip from Mumbai to Chakan site via Expressway',
            receipt: {
              fileName: 'Toll_Expressway_Receipt.jpg',
              fileUrl: '',
              fileSize: '420 KB'
            }
          },
          {
            expenseHead: 'Client Lunch & Engagement Refreshment',
            isFuel: false,
            startKm: 0,
            endKm: 0,
            totalKm: 0,
            fuelRate: 0,
            tollTax: 0,
            amount: 1450,
            remarks: 'Working lunch with Plant Head & Senior Maintenance Engineer',
            receipt: {
              fileName: 'Hotel_Midtown_Bill.pdf',
              fileUrl: '',
              fileSize: '650 KB'
            }
          }
        ],
        totalKm: 120,
        totalClaimAmount: 2690,
        status: 'APPROVED',
        approverRemarks: 'Approved as per field engineering travel policy.'
      },
      {
        reportNumber: 'DVE-2026-1002',
        employeeId: emp2._id,
        employeeCode: emp2.employeeCode || 'EMP-102',
        employeeName: emp2.fullName,
        department: emp2.department,
        branch: emp2.branch,
        customerId: cust2._id,
        customerName: cust2.organizationName,
        contactPerson: cust2.primaryContactPerson || 'Priya Nair',
        activity: 'Routine Maintenance / AMC',
        productId: products[1]?._id || null,
        productMachine: prod2,
        visitDate: '2026-09-30',
        startTime: '10:30',
        endTime: '16:00',
        personCount: 1,
        placeFrom: 'Service Residence, Andheri',
        placeTo: 'Zenith Logistics Hub, Bhiwandi',
        executiveSummary: 'Conducted quarterly AMC preventive service. Replaced hydraulic filter cartridge, calibrated axis home switches, and updated controller firmware.',
        attachments: [],
        expenseLines: [
          {
            expenseHead: 'Two-Wheeler Fuel Allowance',
            isFuel: true,
            startKm: 8520,
            endKm: 8575,
            totalKm: 55,
            fuelRate: 4.5,
            tollTax: 0,
            amount: 248, // 55 * 4.5 = 247.5 rounded to 248
            remarks: 'Local field bike conveyance to Bhiwandi logistics warehouse',
            receipt: {
              fileName: '',
              fileUrl: '',
              fileSize: ''
            }
          },
          {
            expenseHead: 'Daily Field DA / Food Allowance',
            isFuel: false,
            startKm: 0,
            endKm: 0,
            totalKm: 0,
            fuelRate: 0,
            tollTax: 0,
            amount: 350,
            remarks: 'Standard outstation daily field meal allowance',
            receipt: {
              fileName: '',
              fileUrl: '',
              fileSize: ''
            }
          }
        ],
        totalKm: 55,
        totalClaimAmount: 598,
        status: 'SUBMITTED',
        approverRemarks: ''
      },
      {
        reportNumber: 'DVE-2026-1003',
        employeeId: emp1._id,
        employeeCode: emp1.employeeCode || 'EMP-101',
        employeeName: emp1.fullName,
        department: emp1.department,
        branch: emp1.branch,
        customerId: cust3._id,
        customerName: cust3.organizationName,
        contactPerson: cust3.primaryContactPerson || 'Vikram Malhotra',
        activity: 'Emergency Breakdown Service',
        productId: products[2]?._id || null,
        productMachine: prod3,
        visitDate: '2026-10-01',
        startTime: '08:00',
        endTime: '19:15',
        personCount: 2,
        placeFrom: 'Pune Service Depot',
        placeTo: 'Apex Industrial Estate, Bhosari',
        executiveSummary: 'Emergency breakdown call: Axis Y servo drive trip alarm 401. Traced loose encoder connector and replaced blown IGBT buffer fuse. Machine restored to production by 18:30.',
        attachments: [
          {
            fileName: 'Breakdown_Root_Cause_Report.docx',
            fileUrl: '',
            fileSize: '820 KB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }
        ],
        expenseLines: [
          {
            expenseHead: 'Four-Wheeler Travel Fuel',
            isFuel: true,
            startKm: 21100,
            endKm: 21190,
            totalKm: 90,
            fuelRate: 9.0,
            tollTax: 95,
            amount: 905, // (90 * 9) + 95
            remarks: 'Emergency response service van to Bhosari plant',
            receipt: {
              fileName: 'Toll_Challan_Bhosari.jpg',
              fileUrl: '',
              fileSize: '310 KB'
            }
          },
          {
            expenseHead: 'Client Lunch & Engagement Refreshment',
            isFuel: false,
            startKm: 0,
            endKm: 0,
            totalKm: 0,
            fuelRate: 0,
            tollTax: 0,
            amount: 520,
            remarks: 'Dinner for 2 service personnel due to late evening handover',
            receipt: {
              fileName: 'Food_Bill_Bhosari.pdf',
              fileUrl: '',
              fileSize: '290 KB'
            }
          }
        ],
        totalKm: 90,
        totalClaimAmount: 1425,
        status: 'SUBMITTED',
        approverRemarks: ''
      }
    ];

    for (const report of sampleReports) {
      const doc = new DailyVisitExpense(report);
      await doc.save();
    }

    console.log(`[Seed] Seeded ${sampleReports.length} initial Daily Visit & Expense records successfully!`);
  } catch (err) {
    console.error('[Seed Error] Failed to seed Daily Visit & Expenses:', err.message);
  }
};
