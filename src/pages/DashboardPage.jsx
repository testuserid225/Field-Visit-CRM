import React, { useState, useEffect } from 'react';
import {
  Receipt,
  RefreshCw,
  Clock,
  FileCheck2,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  XCircle,
  CheckSquare,
  FileText,
  Printer
} from 'lucide-react';
import { api } from '../services/api';
import { isBranchManagerOrAdmin } from '../utils/userRoleUtils';

export default function DashboardPage({
  currentUser,
  onNavigate
}) {
  // Live Dashboard Statistics from MongoDB Backend
  const [statsData, setStatsData] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isManager = isBranchManagerOrAdmin(currentUser);

  // Digital clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live aggregated stats from backend API
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await api.getDashboardStats();
      if (data) {
        setStatsData(data);
      }
    } catch (err) {
      console.warn('Failed to load live dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  // Real stats data with safe defaults
  const expenseStats = statsData?.expenses || {
    total: 0,
    totalExpenseReports: 0,
    pending: 0,
    pendingApprovalCount: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    reimbursed: 0,
    totalAmount: 0,
    totalClaimAmount: 0,
    pendingAmount: 0,
    pendingApprovalAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    completedAmount: 0,
    totalKmLogged: 0,
    myExpenseCount: 0,
    myPendingAmount: 0,
    myApprovedAmount: 0,
    myKmLogged: 0,
    recentExpenses: []
  };

  const quotationStats = statsData?.quotations || {
    total: 0,
    totalQuotations: 0,
    revisions: 0,
    baseQuotations: 0,
    pending: 0,
    activeQuotationsCount: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    totalValue: 0,
    totalQuotationsValue: 0,
    pendingValue: 0,
    activeQuotationsValue: 0,
    approvedValue: 0,
    acceptedQuotationsValue: 0,
    rejectedValue: 0,
    completedValue: 0
  };

  // Format currency in Indian numbering system
  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  // Format short Lakhs or Crores
  const formatShortLakhs = (val) => {
    const num = Number(val || 0);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} Lakh`;
    }
    return formatCurrency(num);
  };

  const currentBranch = currentUser?.branch || statsData?.meta?.currentBranch || 'Headquarters';
  const userRoleTitle = currentUser?.designation || currentUser?.securityRole || 'Field Professional';

  return (
    <div className="page-body animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: Welcome greeting, Branch, Time, Refresh                    */}
      {/* ========================================================================= */}
      <div style={{
        background: 'var(--header-gradient)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 28px 0px',
        color: '#fff',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Glow Accent Circles */}
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-5%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '20%',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.22)',
                color: '#34d399',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                <Building size={13} />
                {currentBranch}
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <ShieldCheck size={13} color="#38bdf8" />
                {userRoleTitle}
                {currentUser?.employeeCode ? ` · ${currentUser.employeeCode}` : ''}
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }} />
                Field Service Online
              </span>
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: '0 0 6px 0',
              lineHeight: 1.2
            }}>
              Welcome back, {currentUser?.fullName || currentUser?.name || 'Field Officer'}! 👋
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, maxWidth: '640px' }}>
              Live audit & status counts for Daily Visit & Expense reports and Commercial Quotations & Revisions.
            </p>
          </div>

          {/* Right Action Widgets: Clock & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live Clock */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f8fafc'
            }}>
              <Clock size={16} color="#34d399" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            {/* <button
              id="dashboard-refresh-btn"
              onClick={fetchStats}
              disabled={isLoadingStats}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              title="Refresh Live Statistics"
            >
              <RefreshCw size={14} className={isLoadingStats ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION A: DAILY VISIT & EXPENSES COUNT BREAKDOWN                      */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '22px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-600)'
            }}>
              <Receipt size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Daily Visit & Expenses
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--primary-700)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {expenseStats.total || expenseStats.totalExpenseReports} Total Created
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Itemized travel kilometers & food/stay allowance claims status summary
              </p>
            </div>
          </div>

          {/* <button
            onClick={() => onNavigate && onNavigate(isManager ? 'approval-inbox' : 'daily-expenses')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <span>{isManager ? 'Open Approval Inbox' : 'Manage Daily Expenses'}</span>
            <ExternalLink size={14} />
          </button> */}
        </div>

        {/* 5-Card Status Grid for Daily Visit & Expenses */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px'
        }}>
          {/* 1. Total Count */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('daily-expenses', { status: 'ALL' })}
            title="Click to view all daily expense reports"
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Created
              </span>
              <FileText size={16} color="var(--primary-600)" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {expenseStats.total || expenseStats.totalExpenseReports}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '8px' }}>
                Total Claim: <strong>{formatCurrency(expenseStats.totalAmount || expenseStats.totalClaimAmount)}</strong>
              </div>
            </div>
          </div>

          {/* 2. Total Pending */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate(isManager ? 'approval-inbox' : 'daily-expenses', { status: 'SUBMITTED' })}
            title="Click to view pending approval claims"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Pending
              </span>
              <Clock size={16} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
                {expenseStats.pending ?? expenseStats.pendingApprovalCount}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '8px' }}>
                Pending Claim: <strong>{formatCurrency(expenseStats.pendingAmount || expenseStats.pendingApprovalAmount)}</strong>
              </div>
            </div>
          </div>

          {/* 3. Total Approved */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('daily-expenses', { status: 'APPROVED' })}
            title="Click to view approved claims"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Approved
              </span>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>
                {expenseStats.approved || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '8px' }}>
                Approved: <strong>{formatCurrency(expenseStats.approvedAmount)}</strong>
              </div>
            </div>
          </div>

          {/* 4. Total Rejected */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('daily-expenses', { status: 'REJECTED' })}
            title="Click to view rejected claims"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Rejected
              </span>
              <XCircle size={16} color="#e11d48" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#e11d48', lineHeight: 1 }}>
                {expenseStats.rejected || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#be123c', marginTop: '8px' }}>
                Rejected: <strong>{formatCurrency(expenseStats.rejectedAmount || 0)}</strong>
              </div>
            </div>
          </div>

          {/* 5. Total Completed */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('daily-expenses', { status: 'COMPLETED' })}
            title="Click to view completed/settled claims"
            style={{
              backgroundColor: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Completed
              </span>
              <CheckSquare size={16} color="#0891b2" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0891b2', lineHeight: 1 }}>
                {expenseStats.completed || expenseStats.approved || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#0e7490', marginTop: '8px' }}>
                Settled: <strong>{formatCurrency(expenseStats.completedAmount || expenseStats.approvedAmount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION B: QUOTATIONS & REVISIONS COUNT BREAKDOWN                       */}
      {/* ========================================================================= */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '22px',
        // marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Quotations & Revisions
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#1d4ed8',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {quotationStats.total || quotationStats.totalQuotations} Total Created
                </span>
                {quotationStats.revisions > 0 && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    backgroundColor: 'rgba(139, 92, 246, 0.12)',
                    color: '#7c3aed',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {quotationStats.revisions} Revisions
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Commercial equipment pricing proposals, customer revisions, and confirmed sales orders
              </p>
            </div>
          </div>

          <button
            id="dashboard-quotations-report-btn"
            onClick={() => onNavigate && onNavigate('quotations', { openReport: true })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#2563eb',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            title="Generate Quotations & Revisions Audit Report with Print option"
          >
            <Printer size={15} />
            <span>Generate Quotations Report</span>
          </button>
        </div>

        {/* 5-Card Status Grid for Quotations & Revisions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px'
        }}>
          {/* 1. Total Count */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('quotations', { status: 'ALL' })}
            title="Click to view all quotations"
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Created
              </span>
              <FileCheck2 size={16} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {quotationStats.total || quotationStats.totalQuotations}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '8px' }}>
                Total Value: <strong>{formatShortLakhs(quotationStats.totalValue || quotationStats.totalQuotationsValue)}</strong>
              </div>
            </div>
          </div>

          {/* 2. Total Pending (Draft + Sent to Client) */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('quotations', { status: 'PENDING' })}
            title="Click to view pending quotations (Draft & Sent to Client)"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Pending
              </span>
              <Clock size={16} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
                {quotationStats.pending ?? quotationStats.activeQuotationsCount}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '8px' }}>
                In Discussion: <strong>{formatShortLakhs(quotationStats.pendingValue || quotationStats.activeQuotationsValue)}</strong>
              </div>
            </div>
          </div>

          {/* 3. Total Approved (Accepted / Won) */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('quotations', { status: 'ACCEPTED (ORDER WON)' })}
            title="Click to view accepted quotations (Orders Won)"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Approved
              </span>
              <CheckCircle2 size={16} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>
                {quotationStats.approved || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '8px' }}>
                Approved: <strong>{formatShortLakhs(quotationStats.approvedValue || quotationStats.acceptedQuotationsValue)}</strong>
              </div>
            </div>
          </div>

          {/* 4. Total Rejected */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('quotations', { status: 'REJECTED' })}
            title="Click to view rejected quotations"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Rejected
              </span>
              <XCircle size={16} color="#e11d48" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#e11d48', lineHeight: 1 }}>
                {quotationStats.rejected || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#be123c', marginTop: '8px' }}>
                Declined: <strong>{formatShortLakhs(quotationStats.rejectedValue || 0)}</strong>
              </div>
            </div>
          </div>

          {/* 5. Total Completed (Orders Won) */}
          <div
            className="count-tile-interactive"
            onClick={() => onNavigate && onNavigate('quotations', { status: 'ACCEPTED (ORDER WON)' })}
            title="Click to view completed won orders"
            style={{
              backgroundColor: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.28)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Completed
              </span>
              <CheckSquare size={16} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>
                {quotationStats.completed || quotationStats.approved || 0}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#6d28d9', marginTop: '8px' }}>
                Won Volume: <strong>{formatShortLakhs(quotationStats.completedValue || quotationStats.acceptedQuotationsValue)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

