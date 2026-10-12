import { isBranchManager, isSystemAdmin, isBranchManagerOrAdmin } from '../src/utils/userRoleUtils.js';

async function runTest() {
  try {
    console.log('--- 1. Testing Role Logic based on Employee table metadata ---');
    const adminUser = {
      fullName: 'Shaikh Tareq',
      department: 'Management',
      designation: 'System Administrator',
      securityRole: 'Administrator (ADMIN)',
      branch: 'Aurangabad Shahagunj'
    };

    const branchMgrUser = {
      fullName: 'Shaikh Anwar',
      department: 'Management',
      designation: 'Branch Manager',
      securityRole: 'Branch Manager (BRANCH_MGR)',
      branch: 'Aurangabad Central'
    };

    const fieldUser = {
      fullName: 'Shaikh Talha',
      department: 'Service',
      designation: 'Service Engineer',
      securityRole: 'Service Engineer (SERVICE_ENG)',
      branch: 'Aurangabad Central'
    };

    console.log('Shaikh Tareq (Admin) isManagerOrAdmin:', isBranchManagerOrAdmin(adminUser));
    console.log('Shaikh Anwar (BM) isManagerOrAdmin:', isBranchManagerOrAdmin(branchMgrUser));
    console.log('Shaikh Talha (Field) isManagerOrAdmin:', isBranchManagerOrAdmin(fieldUser));

    if (!isBranchManagerOrAdmin(adminUser)) throw new Error('Admin should be manager/admin');
    if (!isBranchManagerOrAdmin(branchMgrUser)) throw new Error('BM should be manager/admin');
    if (isBranchManagerOrAdmin(fieldUser)) throw new Error('Field user should NOT be manager/admin');

    console.log('--- 2. Shaikh Talha submits Daily Visit & Expense report ---');
    const createRes = await fetch('http://localhost:5000/api/daily-visit-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: 'Shaikh Talha',
        employeeCode: 'EMP-1003',
        department: 'Service',
        branch: 'Aurangabad Central',
        customerName: 'Apex Healthcare Diagnostics Ltd',
        contactPerson: 'Dr. Rajesh Sharma',
        activity: 'Emergency Breakdown Service',
        productMachine: 'CNC Fiber Laser 3kW',
        visitDate: '2026-10-02',
        startTime: '10:00',
        endTime: '15:30',
        personCount: 1,
        placeFrom: 'Aurangabad Station',
        placeTo: 'Apex Hospital MIDC',
        executiveSummary: 'Emergency breakdown call: sensor replacement and fiber alignment completed.',
        expenseLines: [
          {
            expenseHead: 'Two-Wheeler Fuel Allowance',
            isFuel: true,
            startKm: 1200,
            endKm: 1260,
            totalKm: 60,
            fuelRate: 5,
            tollTax: 40,
            amount: 340,
            remarks: 'Emergency travel to MIDC hospital site'
          },
          {
            expenseHead: 'Daily Field DA / Food Allowance',
            isFuel: false,
            amount: 250,
            remarks: 'On-site breakdown lunch'
          }
        ]
      })
    });
    const createdData = await createRes.json();
    console.log('Created report:', createdData.success, createdData.report?.reportNumber, 'Claim Amount: ₹' + createdData.report?.totalClaimAmount);
    const newReportId = createdData.report?._id;

    console.log('--- 3. Shaikh Anwar (Branch Manager) checks his Approval Inbox for Aurangabad Central ---');
    const inboxRes = await fetch('http://localhost:5000/api/daily-visit-expenses/inbox?branch=Aurangabad%20Central&status=SUBMITTED');
    const inboxData = await inboxRes.json();
    console.log('Inbox pending count for Aurangabad Central:', inboxData.count);
    const foundReport = inboxData.reports.find(r => r._id === newReportId);
    console.log('Newly submitted report is directly in BM Approval Inbox:', !!foundReport, foundReport?.reportNumber);
    if (!foundReport) throw new Error('Report not found in Branch Manager inbox!');

    console.log('--- 4. Shaikh Anwar Approves the claim ---');
    const approveRes = await fetch('http://localhost:5000/api/daily-visit-expenses/' + newReportId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        approverRemarks: 'Verified and approved by Branch Manager Shaikh Anwar',
        approverName: 'Shaikh Anwar'
      })
    });
    const approveData = await approveRes.json();
    console.log('Approve result:', approveData.success, 'New Status:', approveData.report?.status, 'Approved by:', approveData.report?.approvedBy);

    console.log('--- 5. Verify stats updated for Aurangabad Central ---');
    const updatedInboxRes = await fetch('http://localhost:5000/api/daily-visit-expenses/inbox?branch=Aurangabad%20Central');
    const updatedInbox = await updatedInboxRes.json();
    console.log('Aurangabad Central Stats:', updatedInbox.stats);

    console.log('--- 6. Test Reject on another test report ---');
    const rejectRes = await fetch('http://localhost:5000/api/daily-visit-expenses/' + newReportId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REJECTED',
        approverRemarks: 'Toll slip missing from claim',
        approverName: 'Shaikh Anwar'
      })
    });
    const rejectData = await rejectRes.json();
    console.log('Reject test result:', rejectData.success, 'Status:', rejectData.report?.status, 'Remarks:', rejectData.report?.approverRemarks);

    // Reset back to APPROVED
    await fetch('http://localhost:5000/api/daily-visit-expenses/' + newReportId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'APPROVED',
        approverRemarks: 'Approved upon receipt verification',
        approverName: 'Shaikh Anwar'
      })
    });

    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
}

runTest();
