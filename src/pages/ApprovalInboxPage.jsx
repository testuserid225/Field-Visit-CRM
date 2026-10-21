import React, { useState, useEffect, useMemo } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Building2,
  MapPin,
  User,
  Car,
  Calendar,
  Paperclip,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Navigation,
  ChevronRight,
  Info,
  LayoutGrid,
  Table
} from 'lucide-react';
import { api } from '../services/api';
import AdvancedDataGrid from '../components/grid/AdvancedDataGrid';
import { isBranchManager, isSystemAdmin, getUserBranch } from '../utils/userRoleUtils';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';

const APPROVAL_INBOX_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'reportNumber', label: 'Report Number', transform: (v, r) => r.reportNumber || '' },
  { key: 'visitDate', label: 'Visit Date', transform: (v, r) => r.visitDate ? String(r.visitDate).split('T')[0] : '' },
  { key: 'employeeName', label: 'Employee Name', transform: (v, r) => r.employeeName || '' },
  { key: 'employeeCode', label: 'Employee Code', transform: (v, r) => r.employeeCode || '' },
  { key: 'department', label: 'Department', transform: (v, r) => r.department || '' },
  { key: 'branch', label: 'Branch', transform: (v, r) => r.branch || '' },
  { key: 'customerName', label: 'Customer Organization', transform: (v, r) => r.customerName || '' },
  { key: 'contactPerson', label: 'Contact Person', transform: (v, r) => r.contactPerson || '' },
  { key: 'activity', label: 'Activity Type', transform: (v, r) => r.activity || r.activityType || '' },
  { key: 'route', label: 'Route', transform: (v, r) => `${r.placeFrom || r.startLocation || ''} -> ${r.placeTo || r.endLocation || ''}` },
  { key: 'totalKm', label: 'Distance (KM)', transform: (v, r) => {
      if (r.totalKm !== undefined && r.totalKm !== null && r.totalKm !== '') return r.totalKm;
      if (Array.isArray(r.expenseLines)) {
        return r.expenseLines.reduce((acc, l) => acc + (Number(l.totalKm) || 0), 0);
      }
      return 0;
    }
  },
  { key: 'totalAmount', label: 'Claim Amount (₹)', transform: (v, r) => {
      if (r.totalAmount !== undefined && r.totalAmount !== null && r.totalAmount !== '') return r.totalAmount;
      if (Array.isArray(r.expenseLines)) {
        return r.expenseLines.reduce((acc, l) => acc + (Number(l.lineTotal) || 0), 0);
      }
      return 0;
    }
  },
  { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
];

const APPROVAL_INBOX_COLUMNS = [
  { key: 'report', label: 'Report & Date', defaultVisible: true },
  { key: 'employee', label: 'Employee', defaultVisible: true },
  { key: 'customer', label: 'Customer & Activity', defaultVisible: true },
  { key: 'route', label: 'Route & Travel', defaultVisible: true },
  { key: 'claimAmount', label: 'Claim Amount', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

export default function ApprovalInboxPage({ showToast, currentUser, onNavigate }) {
  const {
    columns: inboxColumns,
    visibleColumns: visibleInboxCols,
    isColumnVisible: isInboxColVisible,
    toggleColumn: toggleInboxCol,
    resetToDefaults: resetInboxCols,
    showAllColumns: showAllInboxCols
  } = useColumnVisibility('crm_cols_approval_inbox', APPROVAL_INBOX_COLUMNS);

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('aggrid');

  // Search filter - Inbox strictly shows only "Pending Approval" (SUBMITTED) records
  const [searchQuery, setSearchQuery] = useState('');

  const userIsAdmin = isSystemAdmin(currentUser);
  const userIsBranchMgr = isBranchManager(currentUser);
  const userBranch = getUserBranch(currentUser);

  // For System Admin: can select any branch or ALL; For Branch Manager: locked or defaulted to their branch
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (userIsBranchMgr && userBranch) {
      return userBranch;
    }
    return 'ALL';
  });

  // Action Modals State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [reportToReject, setReportToReject] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Load branches from Master on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.getBranches();
        const branchList = Array.isArray(res) ? res : (res?.branches || res?.items || []);
        setBranches(branchList);
      } catch (err) {
        console.warn('Error loading branches:', err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch reports whenever branch changes
  useEffect(() => {
    loadInboxData();
  }, [selectedBranch]);

  const loadInboxData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        status: 'SUBMITTED' // Strictly load only Pending Approval records
      };
      if (selectedBranch && selectedBranch !== 'ALL') {
        params.branch = selectedBranch;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.getApprovalInbox(params);
      if (res && res.success) {
        // Enforce that only SUBMITTED records are kept in inbox state
        const pendingList = (res.reports || []).filter(r => r.status === 'SUBMITTED');
        setReports(pendingList);
        setStats(res.stats || null);
      } else {
        showToast?.('Unable to load approval inbox data.');
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
      showToast?.('Error connecting to Approval Inbox API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Live filter reports by search query (strictly only SUBMITTED / Pending Approval)
  const filteredReports = useMemo(() => {
    const pendingOnly = (reports || []).filter(r => r.status === 'SUBMITTED');
    if (!searchQuery.trim()) return pendingOnly;
    const q = searchQuery.toLowerCase().trim();
    return pendingOnly.filter(r => {
      return (
        (r.reportNumber || '').toLowerCase().includes(q) ||
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.employeeCode || '').toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.contactPerson || '').toLowerCase().includes(q) ||
        (r.activity || '').toLowerCase().includes(q) ||
        (r.branch || '').toLowerCase().includes(q) ||
        (r.placeFrom || '').toLowerCase().includes(q) ||
        (r.placeTo || '').toLowerCase().includes(q)
      );
    });
  }, [reports, searchQuery]);

  // Handle Quick Approve
  const handleApproveReport = async (report) => {
    setIsProcessingAction(true);
    try {
      const approverName = currentUser?.fullName || currentUser?.name || 'Branch Manager';
      const res = await api.updateDailyVisitExpenseStatus(
        report._id,
        'APPROVED',
        'Approved by ' + approverName,
        approverName
      );

      if (res && res.success) {
        showToast?.(`✅ Report ${report.reportNumber} approved successfully!`);
        if (isDetailModalOpen && selectedReport?._id === report._id) {
          setIsDetailModalOpen(false);
        }
        setReports(prev => prev.filter(r => r._id !== report._id));
        loadInboxData();
      } else {
        showToast?.(res?.message || 'Failed to approve report.');
      }
    } catch (err) {
      console.error('Approve error:', err);
      showToast?.('Error approving report.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Open Reject Dialog
  const handleOpenRejectModal = (report) => {
    setReportToReject(report);
    setRejectRemarks('');
    setIsRejectModalOpen(true);
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!reportToReject) return;
    if (!rejectRemarks.trim()) {
      showToast?.('Please enter rejection remarks/reason.');
      return;
    }

    setIsProcessingAction(true);
    try {
      const approverName = currentUser?.fullName || currentUser?.name || 'Branch Manager';
      const res = await api.updateDailyVisitExpenseStatus(
        reportToReject._id,
        'REJECTED',
        rejectRemarks.trim(),
        approverName
      );

      if (res && res.success) {
        showToast?.(`Report ${reportToReject.reportNumber} rejected.`);
        const rejectedId = reportToReject._id;
        setIsRejectModalOpen(false);
        setReportToReject(null);
        if (isDetailModalOpen && selectedReport?._id === rejectedId) {
          setIsDetailModalOpen(false);
        }
        setReports(prev => prev.filter(r => r._id !== rejectedId));
        loadInboxData();
      } else {
        showToast?.(res?.message || 'Failed to reject report.');
      }
    } catch (err) {
      console.error('Reject error:', err);
      showToast?.('Error rejecting report.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Format currency
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // AG Grid Column Definitions
  const agGridColumnDefs = useMemo(() => [
    {
      colId: 'index',
      headerName: '#',
      valueGetter: (params) => (params.node && typeof params.node.rowIndex === 'number' ? params.node.rowIndex + 1 : 1),
      width: 65,
      maxWidth: 75,
      pinned: 'left',
      sortable: false,
      filter: false
    },
    {
      field: 'reportNumber',
      headerName: 'Report # & Date',
      flex: 1.3,
      minWidth: 190,
      cellRenderer: (params) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.25' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.85rem' }}>
              {r.reportNumber}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <Calendar size={11} />
              <span>{r.visitDate ? String(r.visitDate).split('T')[0] : ''}</span>
              {r.startTime && <span>• {r.startTime}</span>}
            </div>
          </div>
        );
      }
    },
    {
      field: 'employeeName',
      headerName: 'Employee',
      flex: 1.2,
      minWidth: 170,
      cellRenderer: (params) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.25' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.84rem' }}>
              {r.employeeName}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {r.department} {r.branch ? `• ${r.branch}` : ''}
            </span>
          </div>
        );
      }
    },
    {
      field: 'customerName',
      headerName: 'Customer / Client',
      flex: 1.4,
      minWidth: 200,
      cellRenderer: (params) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.25' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.84rem' }}>
              {r.customerName}
            </span>
            {r.contactPerson && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Attn: {r.contactPerson}
              </span>
            )}
          </div>
        );
      }
    },
    {
      field: 'activity',
      headerName: 'Activity',
      flex: 1.1,
      minWidth: 150,
      cellRenderer: (params) => {
        const act = params.value || params.data?.activityType;
        if (!act) return '—';
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: '0.74rem'
            }}>
              {act}
            </span>
          </div>
        );
      }
    },
    {
      field: 'placeTo',
      headerName: 'Route',
      flex: 1.2,
      minWidth: 170,
      cellRenderer: (params) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <MapPin size={12} color="#10b981" />
            <span>{r.placeFrom || '—'} ➔ {r.placeTo || '—'}</span>
          </div>
        );
      }
    },
    {
      field: 'totalKm',
      headerName: 'Distance (KM)',
      width: 130,
      type: 'numericColumn',
      cellRenderer: (params) => {
        const km = params.value || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '10px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              fontWeight: 700,
              fontSize: '0.78rem'
            }}>
              {km} KM
            </span>
          </div>
        );
      }
    },
    {
      field: 'totalClaimAmount',
      headerName: 'Claim Amount',
      width: 155,
      type: 'numericColumn',
      cellRenderer: (params) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.92rem' }}>
              {formatCurrency(params.value)}
            </span>
          </div>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 155,
      cellRenderer: () => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '14px',
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.35)'
            }}>
              <Clock size={11} />
              <span>Pending</span>
            </span>
          </div>
        );
      }
    },
    {
      colId: 'actions',
      headerName: 'Approval Actions',
      width: 180,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const report = params.data;
        if (!report) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedReport(report);
                setIsDetailModalOpen(true);
              }}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title="Review Full Details & Line Items"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleApproveReport(report)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
              title="Approve Claim"
            >
              <Check size={12} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenRejectModal(report)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
              title="Reject Claim"
            >
              <X size={12} />
              <span>Reject</span>
            </button>
          </div>
        );
      }
    }
  ], [reports]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', color: 'var(--text-main)' }}>
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              <Inbox size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Approval Inbox
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Review and take immediate action on field visits & travel expense claims
              </p>
            </div>
          </div>
        </div>

        {/* Manager Scope Pill & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Active User Branch Info Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '0.82rem'
          }}>
            <ShieldCheck size={16} color="var(--primary-400)" />
            <span>
              <strong>{currentUser?.fullName || currentUser?.name || 'Manager'}</strong>
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}({currentUser?.designation || 'Branch Manager'} - {userBranch || 'All Branches'})
              </span>
            </span>
          </div>

          {/* Branch Filter dropdown for Admins or Multi-branch Managers */}
          {userIsAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Branch:</span>
              <select
                id="inbox-branch-filter"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Branches (Global View)</option>
                {branches.map(b => (
                  <option key={b._id || b.code} value={b.branchName}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Mode Toggle: AG Grid vs Standard View */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-main)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            gap: '3px'
          }}>
            <button
              id="view-toggle-aggrid"
              type="button"
              onClick={() => setViewMode('aggrid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: viewMode === 'aggrid' ? 'var(--primary-600)' : 'transparent',
                color: viewMode === 'aggrid' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: viewMode === 'aggrid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Switch to AG Grid Enterprise Ready Data Grid"
            >
              <LayoutGrid size={14} />
              <span>AG Grid (Advanced)</span>
            </button>
            <button
              id="view-toggle-standard"
              type="button"
              onClick={() => setViewMode('standard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: viewMode === 'standard' ? 'var(--primary-600)' : 'transparent',
                color: viewMode === 'standard' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: viewMode === 'standard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Switch to Standard Table View"
            >
              <Table size={14} />
              <span>Standard Table</span>
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            id="refresh-inbox-btn"
            onClick={() => loadInboxData(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Metric KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Pending Approvals */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: '#f59e0b'
          }} />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.04em' }}>
              Pending Approvals
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, marginTop: '2px' }}>
              {stats?.pendingCount ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Claim Value: <strong>{formatCurrency(stats?.pendingAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Approved Claims */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.06)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: '#10b981'
          }} />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={24} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.04em' }}>
              Approved Claims
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, marginTop: '2px' }}>
              {stats?.approvedCount ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Approved Value: <strong>{formatCurrency(stats?.approvedAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Rejected Claims */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: '#ef4444'
          }} />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <XCircle size={24} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.04em' }}>
              Rejected Claims
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, marginTop: '2px' }}>
              {stats?.rejectedCount ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Value: <strong>{formatCurrency(stats?.rejectedAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Total Inbox Volume */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(148, 163, 184, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileText size={24} color="#94a3b8" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Total Processed Claims
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15, marginTop: '2px' }}>
              {stats?.totalCount ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total Turnover: <strong>{formatCurrency(stats?.totalAmount)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Content: Advanced AG Grid vs Standard Table */}
      {viewMode === 'aggrid' ? (
        <AdvancedDataGrid
          gridId="crm_approval_inbox_directory"
          title="Approval Inbox - Pending Field Visit Claims"
          subtitle="Managerial verification grid with real-time audit tools, distance checks, itemized receipts, and Excel/PDF export"
          rowData={filteredReports}
          columnDefs={agGridColumnDefs}
          isLoading={loading}
          onRefresh={() => loadInboxData(true)}
          currentUser={currentUser?.email || currentUser?.username || 'admin'}
          showToast={showToast}
          exportFilename="Approval_Inbox_Pending_Claims"
          defaultPageSize={25}
        />
      ) : (
        <>
          {/* 3. Navigation Filter & Search Bar */}
          <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Inbox Focus Badge: Pending Approval only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '0.86rem',
            fontWeight: 700
          }}>
            <Clock size={16} />
            <span>Pending Approval</span>
            <span style={{
              backgroundColor: '#f59e0b',
              color: '#000',
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              marginLeft: '4px'
            }}>
              {filteredReports.length}
            </span>
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing only claims awaiting manager approval
          </span>
        </div>

        {/* Right side: Search Bar & Optional Link to Daily Expenses */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate('daily-expenses')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '8px 14px',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="View all approved, rejected, and draft reports"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <FileText size={14} />
              <span>All Claims History</span>
              <ChevronRight size={14} />
            </button>
          )}

          {/* Column Visibility Customizer Dropdown */}
          <ColumnVisibilityDropdown
            columns={inboxColumns}
            visibleColumns={visibleInboxCols}
            onToggle={toggleInboxCol}
            onReset={resetInboxCols}
            onShowAll={showAllInboxCols}
          />

          {/* Export to Excel */}
          <ExportExcelButton
            data={filteredReports}
            columns={APPROVAL_INBOX_EXPORT_COLUMNS}
            filename="Approval_Inbox_Claims"
            sheetName="Approval_Inbox"
            showToast={showToast}
          />

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 14px',
            minWidth: '280px',
            maxWidth: '380px',
            flex: 1
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              id="inbox-search-input"
              type="text"
              placeholder="Search report #, employee, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Claims List / Table */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>Loading claims for approval...</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px' }}>
              All Caught Up!
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
              {searchQuery.trim()
                ? `No pending approval claims matching "${searchQuery}".`
                : `No pending visit & travel expense claims requiring your approval right now for ${selectedBranch === 'ALL' ? 'all branches' : selectedBranch}.`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}>
                  {isInboxColVisible('report') && <th style={{ padding: '14px 20px' }}>Report &amp; Date</th>}
                  {isInboxColVisible('employee') && <th style={{ padding: '14px 16px' }}>Employee</th>}
                  {isInboxColVisible('customer') && <th style={{ padding: '14px 16px' }}>Customer &amp; Activity</th>}
                  {isInboxColVisible('route') && <th style={{ padding: '14px 16px' }}>Route &amp; Travel</th>}
                  {isInboxColVisible('claimAmount') && <th style={{ padding: '14px 16px' }}>Claim Amount</th>}
                  {isInboxColVisible('status') && <th style={{ padding: '14px 16px' }}>Status</th>}
                  {isInboxColVisible('actions') && <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  return (
                    <tr
                      key={report._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Report & Date */}
                      {isInboxColVisible('report') && (
                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: 'var(--primary-300)', fontSize: '0.88rem' }}>
                            {report.reportNumber}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem',
                            marginTop: '4px'
                          }}>
                            <Calendar size={13} />
                            <span>{report.visitDate || 'N/A'}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {report.branch}
                          </div>
                        </td>
                      )}

                      {/* Employee */}
                      {isInboxColVisible('employee') && (
                        <td style={{ padding: '16px 16px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--primary-300)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {report.employeeName
                                ? report.employeeName.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
                                : 'EM'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                {report.employeeName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {report.employeeCode || 'EMP'} • {report.department || 'Field'}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Customer & Activity */}
                      {isInboxColVisible('customer') && (
                        <td style={{ padding: '16px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color="var(--text-muted)" />
                            <span>{report.customerName}</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Contact: {report.contactPerson}
                          </div>
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            marginTop: '6px'
                          }}>
                            {report.activity}
                          </div>
                        </td>
                      )}

                      {/* Route & Travel */}
                      {isInboxColVisible('route') && (
                        <td style={{ padding: '16px 16px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Navigation size={13} color="var(--text-muted)" />
                            <span>{report.placeFrom || '-'} ➔ {report.placeTo || '-'}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {report.startTime || '09:00'} - {report.endTime || '18:00'} ({report.personCount || 1} pax)
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600, marginTop: '2px' }}>
                            Distance: {report.totalKm || 0} km
                          </div>
                        </td>
                      )}

                      {/* Claim Amount */}
                      {isInboxColVisible('claimAmount') && (
                        <td style={{ padding: '16px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {formatCurrency(report.totalClaimAmount)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {(report.expenseLines || []).length} expense item(s)
                          </div>
                          {(report.attachments || []).length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>
                              <Paperclip size={11} />
                              <span>{report.attachments.length} file(s) attached</span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      {isInboxColVisible('status') && (
                        <td style={{ padding: '16px 16px', verticalAlign: 'top' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}>
                            <Clock size={12} />
                            Pending Approval
                          </span>
                        </td>
                      )}

                      {/* Actions */}
                      {isInboxColVisible('actions') && (
                        <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            {/* Review Details Button */}
                            <button
                              id={`review-btn-${report.reportNumber}`}
                              onClick={() => {
                                setSelectedReport(report);
                                setIsDetailModalOpen(true);
                              }}
                              title="Inspect complete visit & expense details"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                padding: '7px 11px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            >
                              <Eye size={14} />
                              <span>Review</span>
                            </button>

                            {/* Instant Approve Button */}
                            <button
                              id={`approve-btn-${report.reportNumber}`}
                              onClick={() => handleApproveReport(report)}
                              disabled={isProcessingAction}
                              title="One-click Approve claim"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '7px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>

                            {/* Instant Reject Button */}
                            <button
                              id={`reject-btn-${report.reportNumber}`}
                              onClick={() => handleOpenRejectModal(report)}
                              disabled={isProcessingAction}
                              title="Reject claim with reason"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '7px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.22)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'}
                            >
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* 5. Comprehensive Full Detail Review Modal */}
      {isDetailModalOpen && selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={20} color="var(--primary-400)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                      Daily Visit & Expense Claim — {selectedReport.reportNumber}
                    </h3>
                    <span style={{
                      backgroundColor: selectedReport.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' : selectedReport.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: selectedReport.status === 'APPROVED' ? '#10b981' : selectedReport.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      border: '1px solid currentColor'
                    }}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Submitted on {selectedReport.visitDate} by {selectedReport.employeeName} ({selectedReport.branch})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* 4 Cards Grid: Employee, Customer, Schedule, Total */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}>
                {/* Employee Details */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Employee & Branch
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
                    {selectedReport.employeeName}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {selectedReport.employeeCode || 'EMP'} • {selectedReport.department}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--primary-300)', fontWeight: 600, marginTop: '2px' }}>
                    📍 {selectedReport.branch}
                  </div>
                </div>

                {/* Customer Details */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Customer & Activity
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
                    {selectedReport.customerName}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Contact: {selectedReport.contactPerson}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#60a5fa', fontWeight: 600, marginTop: '2px' }}>
                    ⚡ {selectedReport.activity}
                  </div>
                </div>

                {/* Route & Schedule */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Route & Travel Time
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
                    {selectedReport.placeFrom} ➔ {selectedReport.placeTo}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {selectedReport.startTime} - {selectedReport.endTime} ({selectedReport.personCount} pax)
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--primary-400)', fontWeight: 700, marginTop: '2px' }}>
                    Total KM: {selectedReport.totalKm || 0} km
                  </div>
                </div>

                {/* Total Claim */}
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                    Total Claim Amount
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>
                    {formatCurrency(selectedReport.totalClaimAmount)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Machine: {selectedReport.productMachine || 'General Field'}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              {selectedReport.executiveSummary && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Executive Summary / Field Report Notes
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {selectedReport.executiveSummary}
                  </div>
                </div>
              )}

              {/* Itemized Expense Details Sub-Grid */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--primary-300)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Car size={16} />
                  <span>Itemized Expense Claim Sub-Grid</span>
                </div>

                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        borderBottom: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '0.72rem',
                        textTransform: 'uppercase'
                      }}>
                        <th style={{ padding: '10px 14px' }}>#</th>
                        <th style={{ padding: '10px 14px' }}>Expense Head</th>
                        <th style={{ padding: '10px 14px' }}>Start KM</th>
                        <th style={{ padding: '10px 14px' }}>End KM</th>
                        <th style={{ padding: '10px 14px' }}>Total KM</th>
                        <th style={{ padding: '10px 14px' }}>Fuel Rate</th>
                        <th style={{ padding: '10px 14px' }}>Toll Tax</th>
                        <th style={{ padding: '10px 14px' }}>Amount (₹)</th>
                        <th style={{ padding: '10px 14px' }}>Remarks</th>
                        <th style={{ padding: '10px 14px' }}>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReport.expenseLines || []).map((line, idx) => (
                        <tr key={line._id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{line.expenseHead}</td>
                          <td style={{ padding: '10px 14px' }}>{line.isFuel ? line.startKm : '-'}</td>
                          <td style={{ padding: '10px 14px' }}>{line.isFuel ? line.endKm : '-'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--primary-400)' }}>
                            {line.isFuel ? `${line.totalKm} km` : '-'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>{line.isFuel ? `₹${line.fuelRate}` : '-'}</td>
                          <td style={{ padding: '10px 14px' }}>{line.isFuel && line.tollTax ? `₹${line.tollTax}` : '-'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--text-main)' }}>
                            {formatCurrency(line.amount)}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {line.remarks || '-'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {line.receipt?.fileName ? (
                              <span style={{ color: '#38bdf8', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Paperclip size={12} />
                                {line.receipt.fileName}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>No bill</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attachments Section */}
              {(selectedReport.attachments || []).length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Attached Documents & Reports
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {selectedReport.attachments.map((att, idx) => (
                      <div
                        key={att._id || idx}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Paperclip size={13} color="var(--primary-400)" />
                        <span>{att.fileName}</span>
                        {att.fileSize && <span style={{ color: 'var(--text-muted)' }}>({att.fileSize})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Approver Remarks if any */}
              {selectedReport.approverRemarks && (
                <div style={{
                  backgroundColor: selectedReport.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${selectedReport.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: '12px',
                  padding: '14px 18px'
                }}>
                  <div style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: selectedReport.status === 'REJECTED' ? '#ef4444' : '#10b981',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    Approver Remarks & Audit
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                    {selectedReport.approverRemarks}
                  </div>
                  {selectedReport.approvedBy && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Approved by: {selectedReport.approvedBy} on {selectedReport.approvedAt ? new Date(selectedReport.approvedAt).toLocaleString() : ''}
                    </div>
                  )}
                  {selectedReport.rejectedBy && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Rejected by: {selectedReport.rejectedBy} on {selectedReport.rejectedAt ? new Date(selectedReport.rejectedAt).toLocaleString() : ''}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer with Direct Approve / Reject Buttons */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedReport.status === 'SUBMITTED' && (
                  <>
                    <button
                      id="modal-reject-btn"
                      onClick={() => handleOpenRejectModal(selectedReport)}
                      disabled={isProcessingAction}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                      <span>Reject Claim</span>
                    </button>

                    <button
                      id="modal-approve-btn"
                      onClick={() => handleApproveReport(selectedReport)}
                      disabled={isProcessingAction}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 20px',
                        borderRadius: '8px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Check size={16} />
                      <span>Approve Claim</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Reject Remarks Modal */}
      {isRejectModalOpen && reportToReject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <XCircle size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Reject Expense Claim
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Report {reportToReject.reportNumber} — {reportToReject.employeeName} ({formatCurrency(reportToReject.totalClaimAmount)})
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Rejection Reason / Approver Remarks <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="reject-remarks-input"
                rows={4}
                placeholder="Specify reason for rejection (e.g. Fuel claim exceeds approved policy limit, receipts missing for toll, travel route mismatch)..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setReportToReject(null);
                }}
                disabled={isProcessingAction}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                id="confirm-reject-btn"
                onClick={handleConfirmReject}
                disabled={isProcessingAction || !rejectRemarks.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isProcessingAction || !rejectRemarks.trim() ? 'not-allowed' : 'pointer',
                  opacity: isProcessingAction || !rejectRemarks.trim() ? 0.6 : 1
                }}
              >
                <X size={15} />
                <span>{isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
