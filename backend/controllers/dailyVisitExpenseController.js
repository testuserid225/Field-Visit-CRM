import DailyVisitExpense from '../models/DailyVisitExpense.js';

// GET: All Daily Visit & Expense Reports with filtering and summary metrics
export const getDailyVisitExpenses = async (req, res) => {
  try {
    const { search, status, employeeName, customerName, activity, branch, startDate, endDate } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (activity && activity !== 'ALL') {
      query.activity = activity;
    }

    if (branch && branch !== 'ALL') {
      query.branch = { $regex: branch.trim(), $options: 'i' };
    }

    if (employeeName) {
      query.employeeName = { $regex: employeeName.trim(), $options: 'i' };
    }

    if (customerName) {
      query.customerName = { $regex: customerName.trim(), $options: 'i' };
    }

    if (startDate && endDate) {
      query.visitDate = { $gte: startDate, $lte: endDate };
    }

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { reportNumber: reg },
        { employeeName: reg },
        { department: reg },
        { branch: reg },
        { customerName: reg },
        { contactPerson: reg },
        { activity: reg },
        { productMachine: reg },
        { placeFrom: reg },
        { placeTo: reg },
        { executiveSummary: reg }
      ];
    }

    // Role-based Security Scoping:
    // Field executives only see their own reports.
    // Branch Managers see their branch reports.
    // Administrators see all reports across all branches.
    const authUser = req.employee || req.user || req.tokenUser;
    if (authUser) {
      const desig = (authUser.designation || '').toLowerCase();
      const dept = (authUser.department || '').toLowerCase();
      const role = (authUser.securityRole || authUser.role || '').toLowerCase();
      const isBranchMgr = desig.includes('branch manager') || desig.includes('branch mgr') || role.includes('branch_mgr') || role.includes('branch manager');
      const isSysAdmin = desig.includes('system administrator') || desig.includes('administrator') || role.includes('admin') || dept === 'management';

      if (!isBranchMgr && !isSysAdmin) {
        // Field Employee: strictly restricted to their own submitted reports
        query.$or = [
          { employeeCode: authUser.employeeCode },
          { employeeName: { $regex: `^${authUser.fullName || authUser.name}$`, $options: 'i' } }
        ];
      } else if (isBranchMgr && !isSysAdmin && authUser.branch) {
        // Branch Manager: restricted to their branch reports
        query.branch = { $regex: authUser.branch.trim(), $options: 'i' };
      }
    }

    const reports = await DailyVisitExpense.find(query).sort({ createdAt: -1 });

    // Analytics / KPI Statistics strictly scoped to authorized view
    let totalClaimAmount = 0;
    let approvedAmount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let totalKmTraveled = 0;

    reports.forEach(r => {
      const amt = Number(r.totalClaimAmount) || 0;
      const km = Number(r.totalKm) || 0;
      totalClaimAmount += amt;
      totalKmTraveled += km;

      if (r.status === 'APPROVED' || r.status === 'REIMBURSED') {
        approvedAmount += amt;
        approvedCount++;
      } else if (r.status === 'SUBMITTED') {
        pendingCount++;
      }
    });

    const stats = {
      totalReportsCount: reports.length,
      totalClaimAmount,
      approvedAmount,
      approvedCount,
      pendingCount,
      totalKmTraveled
    };

    res.json({
      success: true,
      count: reports.length,
      reports,
      stats
    });
  } catch (err) {
    console.error('Error fetching Daily Visit & Expense reports:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET: Single report by ID
export const getDailyVisitExpenseById = async (req, res) => {
  try {
    const report = await DailyVisitExpense.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Daily Visit & Expense report not found' });
    }
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST: Create a new Daily Visit & Expense Report
export const createDailyVisitExpense = async (req, res) => {
  try {
    const reportData = { ...req.body };

    // Bind authenticated employee identity from verified token
    const authUser = req.employee || req.user || req.tokenUser;
    if (authUser) {
      if (!reportData.employeeId && authUser._id) reportData.employeeId = authUser._id;
      if (!reportData.employeeName && (authUser.fullName || authUser.name)) {
        reportData.employeeName = authUser.fullName || authUser.name;
      }
      if (!reportData.employeeCode && authUser.employeeCode) {
        reportData.employeeCode = authUser.employeeCode;
      }
      if (!reportData.branch && authUser.branch) {
        reportData.branch = authUser.branch;
      }
      if (!reportData.department && authUser.department) {
        reportData.department = authUser.department;
      }
    }

    const newReport = new DailyVisitExpense(reportData);
    await newReport.save();

    res.status(201).json({
      success: true,
      message: 'Daily Visit & Expense report submitted successfully',
      report: newReport
    });
  } catch (err) {
    console.error('Error creating Daily Visit & Expense report:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT: Update an existing report
export const updateDailyVisitExpense = async (req, res) => {
  try {
    const report = await DailyVisitExpense.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    Object.assign(report, req.body);
    await report.save();

    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });
  } catch (err) {
    console.error('Error updating Daily Visit & Expense report:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET: Approval Inbox for Branch Managers & Administrators
export const getApprovalInbox = async (req, res) => {
  try {
    const { branch, status, search, startDate, endDate } = req.query;
    const query = {};

    // Branch filter: if provided and not ALL
    if (branch && branch !== 'ALL') {
      // If branch has multiple comma-separated branches (e.g. from multi-branch manager)
      if (branch.includes(',')) {
        const branches = branch.split(',').map(b => new RegExp(b.trim(), 'i'));
        query.branch = { $in: branches };
      } else {
        query.branch = { $regex: branch.trim(), $options: 'i' };
      }
    }

    // Approval Inbox strictly shows only records where status is "Pending Approval" ('SUBMITTED')
    query.status = 'SUBMITTED';

    if (startDate && endDate) {
      query.visitDate = { $gte: startDate, $lte: endDate };
    }

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { reportNumber: reg },
        { employeeName: reg },
        { employeeCode: reg },
        { department: reg },
        { branch: reg },
        { customerName: reg },
        { contactPerson: reg },
        { activity: reg },
        { productMachine: reg },
        { placeFrom: reg },
        { placeTo: reg },
        { executiveSummary: reg }
      ];
    }

    const reports = await DailyVisitExpense.find(query).sort({ createdAt: -1 });

    // Aggregate statistics scoped to the branch filter (or all if admin)
    const baseBranchQuery = {};
    if (branch && branch !== 'ALL') {
      if (branch.includes(',')) {
        const branches = branch.split(',').map(b => new RegExp(b.trim(), 'i'));
        baseBranchQuery.branch = { $in: branches };
      } else {
        baseBranchQuery.branch = { $regex: branch.trim(), $options: 'i' };
      }
    }

    const branchReports = await DailyVisitExpense.find(baseBranchQuery);

    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;
    let totalCount = branchReports.length;
    let totalAmount = 0;

    branchReports.forEach(r => {
      const amt = Number(r.totalClaimAmount) || 0;
      totalAmount += amt;
      if (r.status === 'SUBMITTED') {
        pendingCount++;
        pendingAmount += amt;
      } else if (r.status === 'APPROVED' || r.status === 'REIMBURSED') {
        approvedCount++;
        approvedAmount += amt;
      } else if (r.status === 'REJECTED') {
        rejectedCount++;
        rejectedAmount += amt;
      }
    });

    res.json({
      success: true,
      count: reports.length,
      reports,
      stats: {
        pendingCount,
        pendingAmount,
        approvedCount,
        approvedAmount,
        rejectedCount,
        rejectedAmount,
        totalCount,
        totalAmount
      }
    });
  } catch (err) {
    console.error('Error in getApprovalInbox:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH: Quick status change (e.g. SUBMITTED -> APPROVED / REJECTED / REIMBURSED)
export const updateDailyVisitExpenseStatus = async (req, res) => {
  try {
    const { status, approverRemarks, approverName } = req.body;
    const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const report = await DailyVisitExpense.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    if (approverRemarks !== undefined) {
      report.approverRemarks = approverRemarks;
    }
    // Set verified approver identity from token
    const authUser = req.employee || req.user || req.tokenUser;
    const verifiedApprover = (authUser?.fullName || authUser?.name) || approverName || 'Branch Manager';

    if (status === 'APPROVED') {
      report.approvedBy = verifiedApprover;
      report.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      report.rejectedBy = verifiedApprover;
      report.rejectedAt = new Date();
    }

    await report.save();

    res.json({
      success: true,
      message: `Daily Visit & Expense claim ${status.toLowerCase()} successfully`,
      report
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE: Remove a report
export const deleteDailyVisitExpense = async (req, res) => {
  try {
    const report = await DailyVisitExpense.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await DailyVisitExpense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Report ${report.reportNumber} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
