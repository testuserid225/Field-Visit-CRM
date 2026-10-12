import express from 'express';
import Visit from '../models/Visit.js';
import Client from '../models/Client.js';
import Customer from '../models/Customer.js';
import DailyVisitExpense from '../models/DailyVisitExpense.js';
import Opportunity from '../models/Opportunity.js';
import Quotation from '../models/Quotation.js';
import Employee from '../models/Employee.js';
import ContactPerson from '../models/ContactPerson.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const authUser = req.employee || req.user || req.tokenUser || {};
    const desig = (authUser.designation || '').toLowerCase();
    const dept = (authUser.department || '').toLowerCase();
    const role = (authUser.securityRole || authUser.role || '').toLowerCase();
    const isManagerOrAdmin = desig.includes('branch manager') || desig.includes('branch mgr') ||
                             desig.includes('system administrator') || desig.includes('administrator') ||
                             role.includes('admin') || role.includes('branch_mgr') || dept === 'management';

    // 1. Visit Statistics
    const totalVisits = await Visit.countDocuments();
    const completedVisits = await Visit.countDocuments({ status: 'Completed' });
    const inProgressVisits = await Visit.countDocuments({ status: 'In-Progress' });
    const scheduledVisits = await Visit.countDocuments({ status: 'Scheduled' });
    const totalClients = await Client.countDocuments();
    const totalCustomers = await Customer.countDocuments();

    // 2. Daily Visit & Expenses Aggregations
    const allExpenses = await DailyVisitExpense.find().sort({ createdAt: -1 }).lean();
    
    // Scoped for personal vs branch/team
    let userExpenses = allExpenses;
    if (!isManagerOrAdmin && authUser.employeeCode) {
      userExpenses = allExpenses.filter(e => 
        e.employeeCode === authUser.employeeCode || 
        String(e.employeeId) === String(authUser._id) ||
        (e.employeeName && e.employeeName.toLowerCase() === (authUser.fullName || '').toLowerCase())
      );
    }

    const expensesTarget = isManagerOrAdmin ? allExpenses : userExpenses;
    const totalExpenseReports = expensesTarget.length;
    const pendingApprovalReports = expensesTarget.filter(e => e.status === 'SUBMITTED' || e.status === 'DRAFT');
    const approvedOnlyReports = expensesTarget.filter(e => e.status === 'APPROVED');
    const rejectedReports = expensesTarget.filter(e => e.status === 'REJECTED');
    const reimbursedReports = expensesTarget.filter(e => e.status === 'REIMBURSED');
    const completedReports = expensesTarget.filter(e => e.status === 'REIMBURSED' || e.status === 'APPROVED');

    const totalClaimAmount = expensesTarget.reduce((sum, e) => sum + (Number(e.totalClaimAmount) || 0), 0);
    const pendingApprovalAmount = pendingApprovalReports.reduce((sum, e) => sum + (Number(e.totalClaimAmount) || 0), 0);
    const approvedAmount = approvedOnlyReports.reduce((sum, e) => sum + (Number(e.totalClaimAmount) || 0), 0);
    const rejectedAmount = rejectedReports.reduce((sum, e) => sum + (Number(e.totalClaimAmount) || 0), 0);
    const completedAmount = completedReports.reduce((sum, e) => sum + (Number(e.totalClaimAmount) || 0), 0);
    const totalKmLogged = expensesTarget.reduce((sum, e) => sum + (Number(e.totalKm) || 0), 0);

    // Personal user expense metrics
    const myExpenseCount = userExpenses.length;
    const myPendingAmount = userExpenses.filter(e => e.status === 'SUBMITTED').reduce((s, e) => s + (Number(e.totalClaimAmount) || 0), 0);
    const myApprovedAmount = userExpenses.filter(e => e.status === 'APPROVED' || e.status === 'REIMBURSED').reduce((s, e) => s + (Number(e.totalClaimAmount) || 0), 0);
    const myKmLogged = userExpenses.reduce((s, e) => s + (Number(e.totalKm) || 0), 0);

    // Recent 5 expense reports for fast overview
    const recentExpenses = (isManagerOrAdmin ? allExpenses : userExpenses).slice(0, 10).map(e => ({
      id: e._id,
      reportNumber: e.reportNumber,
      employeeName: e.employeeName,
      customerName: e.customerName,
      activity: e.activity,
      visitDate: e.visitDate,
      totalKm: e.totalKm || 0,
      totalClaimAmount: e.totalClaimAmount || 0,
      status: e.status
    }));

    // 3. Commercial Pipeline & Opportunity Aggregations
    const opportunities = await Opportunity.find().lean();
    const totalOpportunities = opportunities.length;
    const activeOpportunities = opportunities.filter(o => o.stage !== 'Lost Deals');
    const wonOpportunities = opportunities.filter(o => o.stage === 'Won Deals');
    
    const pipelineValue = activeOpportunities.reduce((sum, o) => sum + (Number(o.dealValue) || 0), 0);
    const wonDealsValue = wonOpportunities.reduce((sum, o) => sum + (Number(o.dealValue) || 0), 0);

    // Stage breakdown
    const stageCounts = {
      newLeads: opportunities.filter(o => o.stage === 'New Leads').length,
      qualified: opportunities.filter(o => o.stage === 'Qualified').length,
      proposalSent: opportunities.filter(o => o.stage === 'Proposal Sent').length,
      negotiation: opportunities.filter(o => o.stage === 'Negotiation').length,
      won: wonOpportunities.length,
      lost: opportunities.filter(o => o.stage === 'Lost Deals').length
    };

    // 4. Quotations & Revisions Aggregations
    const quotations = await Quotation.find().lean();
    const totalQuotations = quotations.length;
    const revisionsCount = quotations.filter(q => q.revision && q.revision !== 'Rev 0').length;
    const baseQuotationsCount = quotations.filter(q => !q.revision || q.revision === 'Rev 0').length;

    const pendingQuotations = quotations.filter(q => q.status === 'DRAFT' || q.status === 'SENT TO CLIENT');
    const approvedQuotations = quotations.filter(q => q.status === 'ACCEPTED (ORDER WON)');
    const rejectedQuotations = quotations.filter(q => q.status === 'REJECTED');
    const completedQuotations = quotations.filter(q => q.status === 'ACCEPTED (ORDER WON)');

    const totalQuotationsValue = quotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);
    const pendingQuotationsValue = pendingQuotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);
    const approvedQuotationsValue = approvedQuotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);
    const rejectedQuotationsValue = rejectedQuotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);
    const completedQuotationsValue = completedQuotations.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);

    // 5. Team & Field Attendance / Active Duty
    const employees = await Employee.find().select('fullName designation department branch status isDutyActive').lean();
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const onDutyEmployees = employees.filter(e => e.isDutyActive === true);

    res.json({
      success: true,
      stats: {
        isManagerOrAdmin,
        visits: {
          totalVisits,
          completedVisits,
          inProgressVisits,
          scheduledVisits,
          completionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0
        },
        expenses: {
          total: totalExpenseReports,
          totalExpenseReports,
          pending: pendingApprovalReports.length,
          pendingApprovalCount: pendingApprovalReports.length,
          approved: approvedOnlyReports.length,
          rejected: rejectedReports.length,
          completed: completedReports.length,
          reimbursed: reimbursedReports.length,
          // Amounts
          totalAmount: totalClaimAmount,
          totalClaimAmount,
          pendingAmount: pendingApprovalAmount,
          pendingApprovalAmount,
          approvedAmount,
          rejectedAmount,
          completedAmount,
          totalKmLogged,
          myExpenseCount,
          myPendingAmount,
          myApprovedAmount,
          myKmLogged,
          recentExpenses
        },
        pipeline: {
          totalOpportunities,
          pipelineValue,
          wonDealsCount: wonOpportunities.length,
          wonDealsValue,
          stageCounts
        },
        quotations: {
          total: totalQuotations,
          totalQuotations,
          revisions: revisionsCount,
          baseQuotations: baseQuotationsCount,
          pending: pendingQuotations.length,
          activeQuotationsCount: pendingQuotations.length,
          approved: approvedQuotations.length,
          rejected: rejectedQuotations.length,
          completed: completedQuotations.length,
          // Values
          totalValue: totalQuotationsValue,
          totalQuotationsValue,
          pendingValue: pendingQuotationsValue,
          activeQuotationsValue: pendingQuotationsValue,
          approvedValue: approvedQuotationsValue,
          acceptedQuotationsValue: approvedQuotationsValue,
          rejectedValue: rejectedQuotationsValue,
          completedValue: completedQuotationsValue
        },
        team: {
          totalEmployees,
          activeEmployeesCount: activeEmployees.length,
          onDutyCount: onDutyEmployees.length,
          totalClients,
          totalCustomers
        },
        meta: {
          currentBranch: authUser.branch || 'Headquarters',
          userRole: authUser.designation || authUser.securityRole || 'Field Professional',
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Lightweight Record Counts for Navigation Menu Badges
router.get('/menu-counts', async (req, res) => {
  try {
    const authUser = req.employee || req.user || req.tokenUser || {};
    const desig = (authUser.designation || '').toLowerCase();
    const dept = (authUser.department || '').toLowerCase();
    const role = (authUser.securityRole || authUser.role || '').toLowerCase();
    const isManagerOrAdmin = desig.includes('branch manager') || desig.includes('branch mgr') ||
                             desig.includes('system administrator') || desig.includes('administrator') ||
                             role.includes('admin') || role.includes('branch_mgr') || dept === 'management';

    // 1. Opportunities count
    const opportunitiesPromise = Opportunity.countDocuments();

    // 2. Quotations count
    const quotationsPromise = Quotation.countDocuments();

    // 3. Approval Inbox: strictly Pending Approval ('SUBMITTED')
    let inboxFilter = { status: 'SUBMITTED' };
    if (!role.includes('admin') && !desig.includes('system administrator') && authUser.branch) {
      inboxFilter.branch = { $regex: authUser.branch.trim(), $options: 'i' };
    }
    const approvalInboxPromise = DailyVisitExpense.countDocuments(inboxFilter);

    // 4. Daily Visit & Expenses count (personal for field executives, all for managers/admins)
    let expenseFilter = {};
    if (!isManagerOrAdmin && authUser.employeeCode) {
      expenseFilter.$or = [
        { employeeCode: authUser.employeeCode },
        { employeeName: { $regex: `^${authUser.fullName || authUser.name}$`, $options: 'i' } }
      ];
    }
    const dailyExpensesPromise = DailyVisitExpense.countDocuments(expenseFilter);

    // 5. Employees count
    const employeesPromise = Employee.countDocuments();

    // 6. Customers count
    const customersPromise = Customer.countDocuments();

    // 7. Contact Persons count
    const contactPersonsPromise = ContactPerson.countDocuments();

    const [
      opportunities,
      quotations,
      approvalInbox,
      dailyExpenses,
      employees,
      customers,
      contactPersons
    ] = await Promise.all([
      opportunitiesPromise,
      quotationsPromise,
      approvalInboxPromise,
      dailyExpensesPromise,
      employeesPromise,
      customersPromise,
      contactPersonsPromise
    ]);

    res.json({
      success: true,
      counts: {
        opportunities,
        quotations,
        approvalInbox,
        dailyExpenses,
        employees,
        customers,
        contactPersons,
        masters: 10
      }
    });
  } catch (error) {
    console.error('Error fetching menu counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

