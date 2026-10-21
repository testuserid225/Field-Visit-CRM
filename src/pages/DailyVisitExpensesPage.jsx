import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Printer,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Upload,
  ArrowUpCircle,
  Paperclip,
  Calendar,
  Building2,
  User,
  Briefcase,
  MapPin,
  Navigation,
  FileText,
  Check,
  X,
  Layers,
  Gauge,
  Car,
  ShieldCheck,
  FileCheck,
  Send,
  Users,
  LayoutGrid,
  Table
} from 'lucide-react';
import { api } from '../services/api';
import AdvancedDataGrid from '../components/grid/AdvancedDataGrid';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';

const DAILY_EXPENSE_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'reportNumber', label: 'Report Number', transform: (v, r) => r.reportNumber || '' },
  { key: 'visitDate', label: 'Visit Date', transform: (v, r) => r.visitDate ? String(r.visitDate).split('T')[0] : '' },
  { key: 'employeeName', label: 'Employee Name', transform: (v, r) => r.employeeName || '' },
  { key: 'employeeCode', label: 'Employee Code', transform: (v, r) => r.employeeCode || '' },
  { key: 'department', label: 'Department', transform: (v, r) => r.department || '' },
  { key: 'customerName', label: 'Customer Organization', transform: (v, r) => r.customerName || '' },
  { key: 'contactPerson', label: 'Contact Person', transform: (v, r) => r.contactPerson || '' },
  { key: 'activity', label: 'Activity Type', transform: (v, r) => r.activity || r.activityType || '' },
  { key: 'productMachine', label: 'Product / Machine', transform: (v, r) => r.productMachine || r.productCategory || '' },
  { key: 'route', label: 'Route', transform: (v, r) => `${r.placeFrom || r.startLocation || ''} -> ${r.placeTo || r.endLocation || ''}` },
  { key: 'personCount', label: 'Person Count', transform: (v, r) => r.personCount || '' },
  { key: 'totalKm', label: 'Total Distance (KM)', transform: (v, r) => {
      if (r.totalKm !== undefined && r.totalKm !== null && r.totalKm !== '') return r.totalKm;
      if (Array.isArray(r.expenseLines)) {
        return r.expenseLines.reduce((acc, l) => acc + (Number(l.totalKm) || 0), 0);
      }
      return 0;
    }
  },
  { key: 'totalAmount', label: 'Total Claim Amount (₹)', transform: (v, r) => {
      if (r.totalAmount !== undefined && r.totalAmount !== null && r.totalAmount !== '') return r.totalAmount;
      if (Array.isArray(r.expenseLines)) {
        return r.expenseLines.reduce((acc, l) => acc + (Number(l.lineTotal) || 0), 0);
      }
      return 0;
    }
  },
  { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
];

const DAILY_EXPENSE_COLUMNS = [
  { key: 'reportNumber', label: 'Report # & Date', defaultVisible: true },
  { key: 'employee', label: 'Employee & Dept', defaultVisible: true },
  { key: 'customer', label: 'Customer & Activity', defaultVisible: true },
  { key: 'productMachine', label: 'Product / Machine', defaultVisible: true },
  { key: 'route', label: 'Route & Persons', defaultVisible: true },
  { key: 'distance', label: 'Distance', defaultVisible: true },
  { key: 'claimAmount', label: 'Claim Amount', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

const ACTIVITY_OPTIONS = [
  'Machine Commissioning & Installation',
  'Routine Maintenance / AMC',
  'Emergency Breakdown Service',
  'Customer Operator Training',
  'Customer Courtesy / Relationship'
];

const STATUS_BADGES = {
  'DRAFT': {
    bg: 'rgba(100, 116, 139, 0.12)',
    text: '#64748b',
    border: 'rgba(100, 116, 139, 0.3)',
    icon: Clock
  },
  'SUBMITTED': {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: Send
  },
  'APPROVED': {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: CheckCircle2
  },
  'REJECTED': {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#ef4444',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: XCircle
  },
  'REIMBURSED': {
    bg: 'rgba(139, 92, 246, 0.12)',
    text: '#8b5cf6',
    border: 'rgba(139, 92, 246, 0.3)',
    icon: DollarSign
  }
};

export default function DailyVisitExpensesPage({ showToast, currentUser, initialStatusFilter }) {
  const {
    columns: expenseColumns,
    visibleColumns: visibleExpenseCols,
    isColumnVisible: isExpenseColVisible,
    toggleColumn: toggleExpenseCol,
    resetToDefaults: resetExpenseCols,
    showAllColumns: showAllExpenseCols
  } = useColumnVisibility('crm_cols_daily_expenses', DAILY_EXPENSE_COLUMNS);

  // Main Data States
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('aggrid');

  // Dropdown Dependencies
  const [customers, setCustomers] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenseHeads, setExpenseHeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activityOptions, setActivityOptions] = useState(ACTIVITY_OPTIONS);

  // UI Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Reactively synchronize status filter with initialStatusFilter prop
  useEffect(() => {
    if (initialStatusFilter !== undefined && initialStatusFilter !== null) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
  const [selectedReport, setSelectedReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Proforma Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  // File upload refs
  const attachmentInputRef = useRef(null);
  const receiptInputRefs = useRef({});

  // Form State matching the 5 Sections
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const defaultUserEmployee = useMemo(() => {
    return {
      id: currentUser?.id || currentUser?._id || null,
      employeeCode: currentUser?.employeeCode || '',
      name: currentUser?.fullName || currentUser?.name || '',
      department: currentUser?.department || '',
      branch: currentUser?.branch || ''
    };
  }, [currentUser]);

  const initialFormState = {
    // 1. Employee & Department
    employeeId: defaultUserEmployee.id,
    employeeCode: defaultUserEmployee.employeeCode,
    employeeName: defaultUserEmployee.name,
    department: defaultUserEmployee.department,
    branch: defaultUserEmployee.branch,

    // 2. Customer & Activity Details
    customerName: '',
    contactPerson: '',
    activity: '',
    productMachine: '',

    // 3. Visit Schedule & Route
    visitDate: getTodayDate(),
    startTime: '',
    endTime: '',
    personCount: '',
    placeFrom: '',
    placeTo: '',

    // 4. Sales Visit Report & Executive Summary
    executiveSummary: '',
    attachments: [],

    // 5. Itemized Expense Details Sub-Grid
    expenseLines: []
  };

  const [formData, setFormData] = useState(initialFormState);

  // Load Data on Mount
  useEffect(() => {
    fetchReports();
    fetchDropdownDependencies();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getDailyVisitExpenses();
      if (res && res.success) {
        setReports(res.reports || []);
        setStats(res.stats || null);
      } else {
        showToast?.('Unable to load visit expenses from server');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast?.('Error connecting to Daily Visit & Expenses API');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownDependencies = async () => {
    try {
      // 1. Customers
      const custRes = await api.getCustomers();
      const custList = Array.isArray(custRes) ? custRes : (custRes?.customers || []);
      setCustomers(custList);

      // 2. Contact Persons
      const cpRes = await api.getContactPersons();
      const cpList = Array.isArray(cpRes) ? cpRes : (cpRes?.contactPersons || cpRes?.contacts || []);
      setContactPersons(cpList);

      // 3. Products
      let prodList = [];
      try {
        if (typeof api.getMasterProducts === 'function') {
          const prodRes = await api.getMasterProducts();
          prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.products || prodRes?.items || []);
        }
      } catch (err) {
        console.warn('api.getMasterProducts error:', err);
      }
      if (!prodList || prodList.length === 0) {
        try {
          const prodRes = await api.getMasterItems('products');
          prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.products || prodRes?.items || []);
        } catch (err) {
          console.warn('api.getMasterItems products error:', err);
        }
      }
      setProducts(prodList || []);

      // 4. Expense Heads (Dynamic from Expense heads table)
      const expHeadRes = await api.getMasterExpenseHeads();
      const headList = Array.isArray(expHeadRes) ? expHeadRes : (expHeadRes?.items || []);
      setExpenseHeads(headList || []);

      // 5. Employees
      const empRes = await api.getEmployees();
      const empList = Array.isArray(empRes) ? empRes : (empRes?.employees || []);
      setEmployees(empList);

      // 6. Activity Types Master
      try {
        const actRes = await api.getMasterItems('activity-types');
        const actList = Array.isArray(actRes) ? actRes : (actRes?.items || []);
        if (actList && actList.length > 0) {
          setActivityOptions(actList.map(a => a.activityName));
        }
      } catch (err) {
        console.warn('api.getMasterItems activity-types error:', err);
      }
    } catch (err) {
      console.error('Error loading dropdown dependencies:', err);
    }
  };

  // Filter Contact Persons when Customer Name changes (only show contacts belonging to selected customer)
  const availableCustomerContacts = useMemo(() => {
    if (!formData.customerName) return contactPersons;
    const selectedOrg = (formData.customerName || '').trim().toLowerCase();
    const filtered = contactPersons.filter(cp => {
      const org = (cp.customerOrganizationName || cp.organization || '').trim().toLowerCase();
      return org === selectedOrg;
    });
    return filtered;
  }, [formData.customerName, contactPersons]);

  // When Customer is selected: auto populate contact person
  const handleCustomerSelect = (custOrgName) => {
    const cleanName = (custOrgName || '').trim().toLowerCase();
    const matchedCust = customers.find(c => (c.organizationName || c.name || '').trim().toLowerCase() === cleanName);
    let autoContact = '';
    if (matchedCust && matchedCust.primaryContactPerson) {
      autoContact = matchedCust.primaryContactPerson;
    }
    if (!autoContact) {
      const matchInContacts = contactPersons.find(cp =>
        (cp.customerOrganizationName || cp.organization || '').trim().toLowerCase() === cleanName
      );
      if (matchInContacts) {
        autoContact = matchInContacts.name || matchInContacts.fullName || '';
      }
    }

    setFormData(prev => ({
      ...prev,
      customerName: custOrgName,
      contactPerson: autoContact,
      placeTo: prev.placeTo || (matchedCust ? (matchedCust.city || matchedCust.organizationName || '') : '')
    }));
  };

  // Add Expense Line
  const handleAddExpenseLine = () => {
    const defaultHead = expenseHeads[0] || null;
    const isFuel = defaultHead ? (defaultHead.requiresKm === 'Yes (Fuel)' || /fuel/i.test(defaultHead.expenseHeadName)) : false;
    const rate = defaultHead ? (Number(defaultHead.defaultRate) || 0) : 0;

    const newLine = {
      expenseHead: defaultHead ? defaultHead.expenseHeadName : '',
      isFuel: isFuel,
      startKm: '',
      endKm: '',
      totalKm: '',
      fuelRate: rate,
      tollTax: '',
      amount: '',
      remarks: '',
      receipt: { fileName: '', fileUrl: '', fileSize: '' }
    };

    setFormData(prev => ({
      ...prev,
      expenseLines: [...prev.expenseLines, newLine]
    }));
  };

  // Change Expense Head on a line
  const handleExpenseHeadSelect = (index, headName) => {
    const matchedHead = expenseHeads.find(h => h.expenseHeadName === headName);
    const isFuel = matchedHead?.requiresKm === 'Yes (Fuel)' || /fuel/i.test(headName);
    const rate = Number(matchedHead?.defaultRate) || 0;

    const updated = [...formData.lineItems || formData.expenseLines];
    const current = { ...updated[index] };

    current.expenseHead = headName;
    current.isFuel = isFuel;
    current.fuelRate = isFuel ? rate : 0;

    if (isFuel) {
      const start = Number(current.startKm) || 0;
      const end = Number(current.endKm) || 0;
      current.totalKm = Math.max(0, end - start);
      current.amount = Math.round((current.totalKm * current.fuelRate) + (Number(current.tollTax) || 0));
    } else {
      current.startKm = 0;
      current.endKm = 0;
      current.totalKm = 0;
      current.tollTax = 0;
      current.amount = Number(matchedHead?.defaultRate) || current.amount || 0;
    }

    updated[index] = current;
    setFormData(prev => ({ ...prev, expenseLines: updated }));
  };

  // Change field in an expense line
  const handleExpenseLineChange = (index, field, value) => {
    const updated = [...formData.expenseLines];
    const current = { ...updated[index] };

    current[field] = value;

    // Auto-calculate for fuel lines
    if (current.isFuel) {
      if (field === 'startKm' || field === 'endKm' || field === 'tollTax' || field === 'fuelRate') {
        const start = Number(field === 'startKm' ? value : current.startKm) || 0;
        const end = Number(field === 'endKm' ? value : current.endKm) || 0;
        current.totalKm = Math.max(0, end - start);
        const rate = Number(field === 'fuelRate' ? value : current.fuelRate) || 0;
        const toll = Number(field === 'tollTax' ? value : current.tollTax) || 0;
        current.amount = Math.round((current.totalKm * rate) + toll);
      }
    } else {
      if (field === 'amount') {
        current.amount = Math.max(0, Number(value) || 0);
      }
    }

    updated[index] = current;
    setFormData(prev => ({ ...prev, expenseLines: updated }));
  };

  // Remove an expense line
  const handleRemoveExpenseLine = (index) => {
    const updated = formData.expenseLines.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, expenseLines: updated }));
  };

  // File Upload Handlers (Section 4 Attachments)
  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newAttachments = files.map(file => ({
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      fileType: file.type || 'document',
      fileUrl: URL.createObjectURL(file)
    }));

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));

    showToast?.(`Attached ${files.length} report document(s)`);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Receipt Upload Handler (Section 5 Up Arrow Icon)
  const handleReceiptUpload = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const updated = [...formData.expenseLines];
    updated[index].receipt = {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date()
    };

    setFormData(prev => ({ ...prev, expenseLines: updated }));
    showToast?.(`Receipt "${file.name}" attached to line #${index + 1}`);
  };

  // Compute live total claim amount
  const liveTotalClaimAmount = useMemo(() => {
    return formData.expenseLines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  }, [formData.expenseLines]);

  const liveTotalKm = useMemo(() => {
    return formData.expenseLines.reduce((sum, line) => sum + (Number(line.totalKm) || 0), 0);
  }, [formData.expenseLines]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    fetchDropdownDependencies();
    setModalMode('create');
    setSelectedReport(null);
    setFormData({
      ...initialFormState,
      employeeId: defaultUserEmployee.id,
      employeeCode: defaultUserEmployee.employeeCode,
      employeeName: defaultUserEmployee.name,
      department: defaultUserEmployee.department,
      branch: defaultUserEmployee.branch,
      expenseLines: []
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (report) => {
    fetchDropdownDependencies();
    setModalMode('edit');
    setSelectedReport(report);
    setFormData({
      employeeName: report.employeeName || defaultUserEmployee.name,
      department: report.department || defaultUserEmployee.department,
      branch: report.branch || defaultUserEmployee.branch,
      customerName: report.customerName || '',
      contactPerson: report.contactPerson || '',
      activity: report.activity || '',
      productMachine: report.productMachine || '',
      visitDate: report.visitDate || getTodayDate(),
      startTime: report.startTime || '',
      endTime: report.endTime || '',
      personCount: report.personCount || '',
      placeFrom: report.placeFrom || '',
      placeTo: report.placeTo || '',
      executiveSummary: report.executiveSummary || '',
      attachments: report.attachments || [],
      expenseLines: report.expenseLines && report.expenseLines.length > 0 ? report.expenseLines : []
    });
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.customerName) {
      showToast?.('Please select a Customer Name in Section 2.');
      return;
    }

    if (!formData.contactPerson) {
      showToast?.('Please specify a Contact Person in Section 2.');
      return;
    }

    if (!formData.productMachine) {
      showToast?.('Please select a Product / Machine.');
      return;
    }

    if (!formData.placeFrom || !formData.placeTo) {
      showToast?.('Please specify both Place From and Place To in Section 3.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        totalClaimAmount: liveTotalClaimAmount,
        totalKm: liveTotalKm
      };

      let res;
      if (modalMode === 'create') {
        res = await api.createDailyVisitExpense(payload);
      } else {
        res = await api.updateDailyVisitExpense(selectedReport._id, payload);
      }

      if (res && res.success) {
        showToast?.(modalMode === 'create' ? 'Daily Visit & Expenses claim submitted!' : 'Claim updated successfully!');
        setIsModalOpen(false);
        fetchReports();
      } else {
        showToast?.(res?.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast?.('Network error submitting claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Change (e.g. SUBMITTED -> APPROVED)
  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const res = await api.updateDailyVisitExpenseStatus(reportId, newStatus);
      if (res && res.success) {
        showToast?.(`Claim status updated to "${newStatus}"`);
        fetchReports();
      } else {
        showToast?.(res?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status change error:', err);
      showToast?.('Error updating status');
    }
  };

  // Delete Report
  const handleDeleteReport = async (reportId, reportNum) => {
    if (!window.confirm(`Are you sure you want to delete Daily Visit & Expense report ${reportNum}?`)) {
      return;
    }
    try {
      const res = await api.deleteDailyVisitExpense(reportId);
      if (res && res.success) {
        showToast?.(`Report ${reportNum} deleted.`);
        fetchReports();
      } else {
        showToast?.(res?.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast?.('Error deleting report');
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (report) => {
    setPreviewReport(report);
    setIsPreviewOpen(true);
  };

  // Status filter change with browser URL synchronization
  const handleStatusFilterChange = (st) => {
    setStatusFilter(st);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'daily-expenses');
      if (st && st !== 'ALL') {
        url.searchParams.set('status', st);
      } else {
        url.searchParams.delete('status');
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {}
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter === 'COMPLETED') {
        if (r.status !== 'APPROVED' && r.status !== 'REIMBURSED') return false;
      } else if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      if (activityFilter !== 'ALL' && r.activity !== activityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mNum = r.reportNumber?.toLowerCase().includes(q);
        const mEmp = r.employeeName?.toLowerCase().includes(q);
        const mCust = r.customerName?.toLowerCase().includes(q);
        const mAct = r.activity?.toLowerCase().includes(q);
        const mProd = r.productMachine?.toLowerCase().includes(q);
        const mRoute = `${r.placeFrom} ${r.placeTo}`.toLowerCase().includes(q);
        return mNum || mEmp || mCust || mAct || mProd || mRoute;
      }
      return true;
    });
  }, [reports, statusFilter, activityFilter, searchQuery]);

  // Currency format
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(val) || 0);
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
              {r.startTime && <span>• {r.startTime} - {r.endTime}</span>}
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
      headerName: 'Customer & Contact',
      flex: 1.4,
      minWidth: 210,
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
      headerName: 'Activity Type',
      flex: 1.2,
      minWidth: 170,
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
      field: 'productMachine',
      headerName: 'Product / Machine',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => {
        return (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>
            {params.value || '—'}
          </span>
        );
      }
    },
    {
      field: 'placeTo',
      headerName: 'Route',
      flex: 1.2,
      minWidth: 180,
      cellRenderer: (params) => {
        const r = params.data;
        if (!r) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.25' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <MapPin size={12} color="#10b981" />
              <span>{r.placeFrom || '—'} ➔ {r.placeTo || '—'}</span>
            </div>
            {r.personCount && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {r.personCount} Person(s)
              </span>
            )}
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
      headerName: 'Total Claim (₹)',
      width: 155,
      type: 'numericColumn',
      cellRenderer: (params) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.92rem' }}>
              {formatINR(params.value)}
            </span>
          </div>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 155,
      cellRenderer: (params) => {
        const st = params.value || 'DRAFT';
        const badge = STATUS_BADGES[st] || STATUS_BADGES['DRAFT'];
        const IconComponent = badge.icon || Clock;
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
              backgroundColor: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`
            }}>
              <IconComponent size={11} />
              <span>{st}</span>
            </span>
          </div>
        );
      }
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 140,
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
              onClick={() => handleOpenPreview(report)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title="View & Print Official Claim Sheet"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditModal(report)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title="Edit Report & Expenses"
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteReport(report._id, report.reportNumber)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                cursor: 'pointer'
              }}
              title="Delete Report"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], [reports]);

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* 1. Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Receipt size={24} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Daily Visit & Expenses
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              margin: '2px 0 0 0'
            }}>
              Customer field visit logs, technical activity reports & itemized travel expense reimbursement claims
            </p>
          </div>
        </div>

        {/* Action Buttons & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle: AG Grid vs Standard View */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-card)',
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

          <button
            onClick={fetchReports}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-new-visit-expense"
            onClick={handleOpenCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--primary-gradient)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Plus size={18} />
            <span>New Visit & Expense</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Claims */}
        <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Claims Logged
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats?.totalReportsCount || reports.length} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Claims</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginTop: '2px' }}>
              Gross Claim: {formatINR(stats?.totalClaimAmount || 0)}
            </div>
          </div>
        </div>

        {/* Card 2: Approved / Reimbursed */}
        <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Approved / Reimbursed
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {formatINR(stats?.approvedAmount || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {stats?.approvedCount || 0} Claims Verified & Passed
            </div>
          </div>
        </div>

        {/* Card 3: Pending Approval */}
        <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pending Manager Approval
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              {stats?.pendingCount || reports.filter(r => r.status === 'SUBMITTED').length} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Claims</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              Awaiting Audit Sign-off
            </div>
          </div>
        </div>

        {/* Card 4: Total Distance (KM) */}
        <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Gauge size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Distance Traveled
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats?.totalKmTraveled || 0} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>KM</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginTop: '2px' }}>
              Across Field Site Visits
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Content: Advanced AG Grid vs Standard Table */}
      {viewMode === 'aggrid' ? (
        <AdvancedDataGrid
          gridId="crm_daily_expenses_directory"
          title="Daily Visit & Expense Claims"
          subtitle="Enterprise field visit claim log with distance tracker, multi-level status audit, and Excel/PDF export"
          rowData={reports}
          columnDefs={agGridColumnDefs}
          isLoading={loading}
          onRefresh={fetchReports}
          currentUser={currentUser?.email || currentUser?.username || 'admin'}
          showToast={showToast}
          exportFilename="Daily_Visit_Expenses"
          defaultPageSize={25}
          primaryAction={{
            label: 'New Visit & Expense',
            onClick: handleOpenCreateModal,
            id: 'ag-primary-add-expense'
          }}
        />
      ) : (
        <>
          {/* 3. Filter & Search Toolbar */}
          <div className="card" style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Claims' },
            { id: 'SUBMITTED', label: 'SUBMITTED' },
            { id: 'APPROVED', label: 'APPROVED' },
            { id: 'COMPLETED', label: 'COMPLETED (Settled)' },
            { id: 'REIMBURSED', label: 'REIMBURSED' },
            { id: 'DRAFT', label: 'DRAFT' },
            { id: 'REJECTED', label: 'REJECTED' }
          ].map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusFilterChange(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  border: isActive ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
                  color: isActive ? '#10b981' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Column Visibility Customizer Dropdown */}
          <ColumnVisibilityDropdown
            columns={expenseColumns}
            visibleColumns={visibleExpenseCols}
            onToggle={toggleExpenseCol}
            onReset={resetExpenseCols}
            onShowAll={showAllExpenseCols}
          />

          {/* Export to Excel */}
          <ExportExcelButton
            data={filteredReports}
            columns={DAILY_EXPENSE_EXPORT_COLUMNS}
            filename="Daily_Visit_Expenses"
            sheetName="Visit_Expenses"
            showToast={showToast}
          />

          {/* Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            minWidth: '280px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by employee, customer, activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Datalist Table */}
      <div className="card" style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#10b981' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Daily Visit & Expense Records...</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Receipt size={44} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              No Visit Expense Reports Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 18px auto' }}>
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Click "+ New Visit & Expense" to log your first client visit and expense claim.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--primary-gradient)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Create First Report
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-main)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {isExpenseColVisible('reportNumber') && <th style={{ padding: '14px 18px' }}>Report # &amp; Date</th>}
                  {isExpenseColVisible('employee') && <th style={{ padding: '14px 18px' }}>Employee &amp; Dept</th>}
                  {isExpenseColVisible('customer') && <th style={{ padding: '14px 18px' }}>Customer &amp; Activity</th>}
                  {isExpenseColVisible('productMachine') && <th style={{ padding: '14px 18px' }}>Product / Machine</th>}
                  {isExpenseColVisible('route') && <th style={{ padding: '14px 18px' }}>Route &amp; Persons</th>}
                  {isExpenseColVisible('distance') && <th style={{ padding: '14px 18px', textAlign: 'center' }}>Distance</th>}
                  {isExpenseColVisible('claimAmount') && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Claim Amount</th>}
                  {isExpenseColVisible('status') && <th style={{ padding: '14px 18px' }}>Status</th>}
                  {isExpenseColVisible('actions') && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const isExpanded = expandedReportId === report._id;
                  const statusInfo = STATUS_BADGES[report.status] || STATUS_BADGES['SUBMITTED'];

                  return (
                    <React.Fragment key={report._id}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s ease',
                          backgroundColor: isExpanded ? 'rgba(16, 185, 129, 0.03)' : 'transparent'
                        }}
                      >
                        {/* Report # & Date */}
                        {isExpenseColVisible('reportNumber') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => setExpandedReportId(isExpanded ? null : report._id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: 'var(--text-muted)'
                                }}
                                title="Expand/Collapse Details"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                                  {report.reportNumber}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                                  <Calendar size={12} />
                                  <span>{report.visitDate}</span>
                                  <span>•</span>
                                  <span>{report.startTime} - {report.endTime}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Employee & Dept */}
                        {isExpenseColVisible('employee') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {report.employeeName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {report.department} • <span style={{ color: 'var(--primary-300)' }}>{report.branch}</span>
                            </div>
                          </td>
                        )}

                        {/* Customer & Activity */}
                        {isExpenseColVisible('customer') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {report.customerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', marginTop: '2px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                fontWeight: 600,
                                fontSize: '0.72rem'
                              }}>
                                {report.activity}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>Attn: {report.contactPerson}</span>
                            </div>
                          </td>
                        )}

                        {/* Product / Machine */}
                        {isExpenseColVisible('productMachine') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {report.productMachine}
                            </div>
                          </td>
                        )}

                        {/* Route & Persons */}
                        {isExpenseColVisible('route') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
                              <MapPin size={13} color="#10b981" />
                              <span>{report.placeFrom} ➔ {report.placeTo}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={12} />
                              <span>{report.personCount} Person(s) Traveling</span>
                            </div>
                          </td>
                        )}

                        {/* Distance (KM) */}
                        {isExpenseColVisible('distance') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              color: '#8b5cf6',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}>
                              {report.totalKm || 0} KM
                            </span>
                          </td>
                        )}

                        {/* Total Claim Amount */}
                        {isExpenseColVisible('claimAmount') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>
                              {formatINR(report.totalClaimAmount)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {report.expenseLines?.length || 0} Expense Line(s)
                            </div>
                          </td>
                        )}

                        {/* Status */}
                        {isExpenseColVisible('status') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <select
                                value={report.status}
                                onChange={(e) => handleStatusChange(report._id, e.target.value)}
                                style={{
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  padding: '5px 24px 5px 10px',
                                  borderRadius: '14px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: statusInfo.bg,
                                  color: statusInfo.text,
                                  border: `1px solid ${statusInfo.border}`,
                                  cursor: 'pointer',
                                  outline: 'none'
                                }}
                              >
                                {Object.keys(STATUS_BADGES).map(st => (
                                  <option key={st} value={st} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: statusInfo.text }} />
                            </div>
                          </td>
                        )}

                        {/* Actions */}
                        {isExpenseColVisible('actions') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {/* Formal Preview / Print */}
                              <button
                                onClick={() => handleOpenPreview(report)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer'
                                }}
                                title="View & Print Official Claim Sheet"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditModal(report)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer'
                                }}
                                title="Edit Report & Expenses"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteReport(report._id, report.reportNumber)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                                title="Delete Report"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expandable Accordion: Section 4 Notes & Section 5 Itemized Expense Sub-Grid */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <td colSpan={visibleExpenseCols.length} style={{ padding: '20px 24px' }}>

                            {/* Section 4 Preview: Executive Summary & Attachments */}
                            <div style={{
                              marginBottom: '20px',
                              backgroundColor: 'var(--bg-card)',
                              padding: '16px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)'
                            }}>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', marginBottom: '8px' }}>
                                4. Sales Visit Report & Executive Summary:
                              </div>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                                {report.executiveSummary || 'No discussion notes logged.'}
                              </p>

                              {report.attachments && report.attachments.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Attached Files:</span>
                                  {report.attachments.map((att, attIdx) => (
                                    <span key={attIdx} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      color: '#3b82f6',
                                      fontSize: '0.75rem',
                                      fontWeight: 600
                                    }}>
                                      <Paperclip size={12} />
                                      {att.fileName} ({att.fileSize})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Section 5 Preview: Itemized Expense Details Sub-Grid */}
                            <div style={{
                              backgroundColor: 'var(--bg-card)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                padding: '12px 16px',
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                borderBottom: '1px solid var(--border-subtle)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981' }}>
                                  5. Itemized Expense Details Sub-Grid ({report.expenseLines?.length || 0} Lines)
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                                  TOTAL CLAIM: {formatINR(report.totalClaimAmount)}
                                </span>
                              </div>

                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '8px 12px' }}>Expense Head</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Start Km</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>End Km</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Total Km</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Fuel Rate (₹)</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Toll Tax (₹)</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount (₹)</th>
                                    <th style={{ padding: '8px 12px' }}>Remarks / Justification</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Receipt</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.expenseLines?.map((line, lIdx) => (
                                    <tr key={lIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)' }}>
                                        {line.expenseHead}
                                        {line.isFuel && (
                                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>
                                            (Fuel Line)
                                          </span>
                                        )}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center', color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {line.isFuel ? line.startKm : '-'}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center', color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {line.isFuel ? line.endKm : '-'}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: line.isFuel ? '#10b981' : 'var(--text-muted)' }}>
                                        {line.isFuel ? `${line.totalKm} KM` : '-'}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right', color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {line.isFuel ? `₹${line.fuelRate}/km` : '-'}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right', color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {line.isFuel ? formatINR(line.tollTax) : '-'}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                                        {formatINR(line.amount)}
                                      </td>
                                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                                        {line.remarks || 'None'}
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        {line.receipt?.fileName ? (
                                          <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            fontSize: '0.72rem',
                                            fontWeight: 600
                                          }}>
                                            ✓ {line.receipt.fileName}
                                          </span>
                                        ) : (
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No bill</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT DAILY VISIT & EXPENSES MODAL                             */}
      {/* Sections: 1. Employee & Department                                       */}
      {/*           2. Customer & Activity Details                                  */}
      {/*           3. Visit Schedule & Route                                       */}
      {/*           4. Sales Visit Report & Executive Summary                      */}
      {/*           5. Itemized Expense Details Sub-Grid (with TOTAL CLAIM AMOUNT)  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.2s ease-out'
          }}>

            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-main)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {modalMode === 'create' ? 'New Daily Visit & Expenses Report' : `Edit Report: ${selectedReport?.reportNumber}`}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Complete all 5 sections: Employee, Customer/Activity, Route, Summary, and Itemized Expenses
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable Form with Unified Seamless Canvas */}
            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '30px 36px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 1. Employee & Department                              */}
                {/* ------------------------------------------------------------- */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={18} />
                    </div>
                    <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      1. Employee & Department
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '20px'
                  }}>
                    {/* Employee Name (Read Only) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Employee Name <span style={{ color: '#ef4444' }}>*</span> (Current Login User)
                      </label>
                      <input
                        type="text"
                        value={formData.employeeName}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          fontWeight: 700,
                          cursor: 'default'
                        }}
                      />
                    </div>

                    {/* Department (Read Only) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Department <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'default'
                        }}
                      />
                    </div>

                    {/* Branch (Read Only) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Branch <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.branch}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'default'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '26px 0' }} />

                {/* ------------------------------------------------------------- */}
                {/* SECTION 2. Customer & Activity Details                        */}
                {/* ------------------------------------------------------------- */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Building2 size={18} />
                    </div>
                    <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      2. Customer & Activity Details
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px'
                  }}>
                    {/* Row 1, Col 1: Customer Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Customer Name <span style={{ color: '#ef4444' }}>*</span> (From Customer Table)
                      </label>
                      <select
                        value={formData.customerName}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Select Customer Account --</option>
                        {customers.map((c, idx) => {
                          const orgName = c.organizationName || c.name || '';
                          return (
                            <option key={c._id || idx} value={orgName}>
                              {orgName} {c.customerType ? `(${c.customerType})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Row 1, Col 2: Contact Person */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Contact Person <span style={{ color: '#ef4444' }}>*</span> (Filtered on Selected Customer)
                      </label>
                      <select
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Select Contact Person --</option>
                        {formData.contactPerson && !availableCustomerContacts.some(cp => (cp.name || cp.fullName) === formData.contactPerson) && (
                          <option value={formData.contactPerson}>{formData.contactPerson}</option>
                        )}
                        {availableCustomerContacts.map((cp, idx) => {
                          const contactName = cp.name || cp.fullName || '';
                          const desig = cp.designation ? ` (${cp.designation})` : '';
                          return (
                            <option key={cp._id || idx} value={contactName}>
                              {contactName}{desig}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Row 2, Col 1: Product / Machine */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Product / Machine <span style={{ color: '#ef4444' }}>*</span> (From Product Table)
                      </label>
                      <select
                        value={formData.productMachine}
                        onChange={(e) => setFormData(prev => ({ ...prev, productMachine: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Select Product / Machine Model --</option>
                        {products.map((p, idx) => {
                          const pName = p.productName || p.name || '';
                          const brand = p.principal || p.category || 'OEM';
                          return (
                            <option key={p._id || idx} value={pName}>
                              {pName} ({brand})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Row 2, Col 2: Activity */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Activity <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        value={formData.activity}
                        onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Select Activity --</option>
                        {activityOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '26px 0' }} />

                {/* ------------------------------------------------------------- */}
                {/* SECTION 3. Visit Schedule & Route                             */}
                {/* ------------------------------------------------------------- */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <MapPin size={18} />
                    </div>
                    <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      3. Visit Schedule & Route
                    </span>
                  </div>

                  {/* Row 1: 4 columns for Schedule */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '16px'
                  }}>
                    {/* Visit Date */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Visit Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.visitDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Start Time <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        End Time <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Person Count */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Person Count <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.personCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, personCount: Math.max(1, Number(e.target.value) || 1) }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2: 2 columns for Route (From & To) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginTop: '16px'
                  }}>
                    {/* Place From */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Place From <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Branch Office / Residence"
                        value={formData.placeFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, placeFrom: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Place To */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                        Place To <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Customer Plant / Facility Address"
                        value={formData.placeTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, placeTo: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '26px 0' }} />

                {/* ------------------------------------------------------------- */}
                {/* SECTION 4. Sales Visit Report & Executive Summary             */}
                {/* ------------------------------------------------------------- */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '14px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} />
                    </div>
                    <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      4. Sales Visit Report & Executive Summary
                    </span>
                  </div>

                  {/* Required Note Banner */}
                  <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.07)',
                    border: '1px solid rgba(59, 130, 246, 0.22)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    marginBottom: '16px',
                    fontSize: '0.8125rem',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} color="#3b82f6" flexShrink={0} />
                    <span>
                      <strong>Note:</strong> Attach field sales visit reports, customer requirement sheets, machine specifications or discussion sign-offs
                    </span>
                  </div>

                  {/* Textarea */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '7px' }}>
                      Executive Summary / Discussion Notes
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Detail the technical activities performed, discussions with client stakeholders, machine operating status, trial cut outcomes, or follow-up action items..."
                      value={formData.executiveSummary}
                      onChange={(e) => setFormData(prev => ({ ...prev, executiveSummary: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Document Attachment Field with Up-Arrow Icon */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Attachment Documents (PDF, Word, Images, Service Slips)
                      </label>
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid #10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowUpCircle size={16} />
                        <span>Upload Document</span>
                      </button>
                      <input
                        type="file"
                        ref={attachmentInputRef}
                        multiple
                        onChange={handleAttachmentUpload}
                        style={{ display: 'none' }}
                      />
                    </div>

                    {/* Attachment Chips List */}
                    {formData.attachments.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {formData.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-main)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.8rem',
                              color: 'var(--text-main)'
                            }}
                          >
                            <Paperclip size={14} color="#3b82f6" />
                            <span style={{ fontWeight: 600 }}>{att.fileName}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({att.fileSize})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: '#ef4444',
                                padding: '2px',
                                marginLeft: '4px'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: '16px',
                        border: '1px dashed var(--border-subtle)',
                        borderRadius: '10px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8125rem',
                        backgroundColor: 'var(--bg-main)'
                      }}>
                        No report documents attached yet. Click <strong>"Upload Document"</strong> with the up-arrow icon above to attach files.
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtle Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '26px 0' }} />

                {/* ------------------------------------------------------------- */}
                {/* SECTION 5. Itemized Expense Details Sub-Grid                  */}
                {/* ------------------------------------------------------------- */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Receipt size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                          5. Itemized Expense Details Sub-Grid
                        </span>
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {formData.expenseLines.length} Line(s)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-add-expense-line"
                      onClick={handleAddExpenseLine}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--primary-gradient)',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-glow)'
                      }}
                    >
                      <Plus size={16} />
                      <span>Add Expense Line</span>
                    </button>
                  </div>

                  {/* Required Note Banner */}
                  <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    marginBottom: '16px',
                    fontSize: '0.8125rem',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} color="#f59e0b" flexShrink={0} />
                    <span>
                      <strong>Note:</strong> Fuel lines auto-calculate KM amount. Non-fuel lines disable KM/fuel/toll fields and enable direct Amount entry.
                    </span>
                  </div>

                  {/* Sub-Grid Table */}
                  <div style={{
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    overflowX: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '11px 12px', minWidth: '180px', textAlign: 'left' }}>Expense Head *</th>
                          <th style={{ padding: '11px 8px', textAlign: 'center', width: '90px' }}>Start Km</th>
                          <th style={{ padding: '11px 8px', textAlign: 'center', width: '90px' }}>End Km</th>
                          <th style={{ padding: '11px 8px', textAlign: 'center', width: '80px' }}>Total Km</th>
                          <th style={{ padding: '11px 8px', textAlign: 'right', width: '100px' }}>Fuel Rate (₹)</th>
                          <th style={{ padding: '11px 8px', textAlign: 'right', width: '90px' }}>Toll Tax (₹)</th>
                          <th style={{ padding: '11px 10px', textAlign: 'right', minWidth: '120px' }}>Amount (₹) *</th>
                          <th style={{ padding: '11px 12px', minWidth: '180px', textAlign: 'left' }}>Remarks / Justification</th>
                          <th style={{ padding: '11px 10px', textAlign: 'center', minWidth: '110px' }}>Receipt</th>
                          <th style={{ padding: '11px 8px', textAlign: 'center', width: '50px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.expenseLines.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No expense lines added yet. Click <strong>"+ Add Expense Line"</strong> above to record fuel or direct expense entries.
                            </td>
                          </tr>
                        ) : (
                          formData.expenseLines.map((line, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                              {/* 1. Expense Head Dropdown */}
                              <td style={{ padding: '8px 10px' }}>
                                <select
                                  value={line.expenseHead}
                                  onChange={(e) => handleExpenseHeadSelect(index, e.target.value)}
                                  required
                                  style={{
                                    width: '100%',
                                    padding: '7px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    outline: 'none'
                                  }}
                                >
                                  <option value="">-- Select Expense Head --</option>
                                  {expenseHeads.map((h, hIdx) => (
                                    <option key={h._id || hIdx} value={h.expenseHeadName}>
                                      {h.expenseHeadName}
                                    </option>
                                  ))}
                                </select>
                                {line.isFuel && (
                                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                                    ✓ Auto-calculates with KM
                                  </div>
                                )}
                              </td>

                              {/* 2. Start Km */}
                              <td style={{ padding: '8px 6px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!line.isFuel}
                                  value={line.isFuel ? line.startKm : ''}
                                  onChange={(e) => handleExpenseLineChange(index, 'startKm', e.target.value)}
                                  placeholder={line.isFuel ? '0' : 'N/A'}
                                  style={{
                                    width: '100%',
                                    padding: '7px 4px',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: line.isFuel ? 'var(--bg-card)' : 'rgba(0,0,0,0.04)',
                                    color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontSize: '0.8125rem',
                                    outline: 'none'
                                  }}
                                />
                              </td>

                              {/* 3. End Km */}
                              <td style={{ padding: '8px 6px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!line.isFuel}
                                  value={line.isFuel ? line.endKm : ''}
                                  onChange={(e) => handleExpenseLineChange(index, 'endKm', e.target.value)}
                                  placeholder={line.isFuel ? '0' : 'N/A'}
                                  style={{
                                    width: '100%',
                                    padding: '7px 4px',
                                    textAlign: 'center',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: line.isFuel ? 'var(--bg-card)' : 'rgba(0,0,0,0.04)',
                                    color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontSize: '0.8125rem',
                                    outline: 'none'
                                  }}
                                />
                              </td>

                              {/* 4. Total Km (Auto-calculated) */}
                              <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: line.isFuel ? '#10b981' : 'var(--text-muted)' }}>
                                {line.isFuel ? line.totalKm : '-'}
                              </td>

                              {/* 5. Fuel Rate (₹) from table */}
                              <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  step="0.5"
                                  disabled={!line.isFuel}
                                  value={line.isFuel ? line.fuelRate : ''}
                                  onChange={(e) => handleExpenseLineChange(index, 'fuelRate', e.target.value)}
                                  placeholder={line.isFuel ? 'Rate' : 'N/A'}
                                  style={{
                                    width: '100%',
                                    padding: '7px 6px',
                                    textAlign: 'right',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: line.isFuel ? 'var(--bg-card)' : 'rgba(0,0,0,0.04)',
                                    color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontSize: '0.8125rem',
                                    outline: 'none'
                                  }}
                                />
                              </td>

                              {/* 6. Toll Tax (₹) */}
                              <td style={{ padding: '8px 6px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!line.isFuel}
                                  value={line.isFuel ? line.tollTax : ''}
                                  onChange={(e) => handleExpenseLineChange(index, 'tollTax', e.target.value)}
                                  placeholder={line.isFuel ? '0' : 'N/A'}
                                  style={{
                                    width: '100%',
                                    padding: '7px 6px',
                                    textAlign: 'right',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: line.isFuel ? 'var(--bg-card)' : 'rgba(0,0,0,0.04)',
                                    color: line.isFuel ? 'var(--text-main)' : 'var(--text-muted)',
                                    fontSize: '0.8125rem',
                                    outline: 'none'
                                  }}
                                />
                              </td>

                              {/* 7. Amount (₹) * */}
                              <td style={{ padding: '8px 8px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={line.isFuel}
                                  value={line.amount}
                                  onChange={(e) => handleExpenseLineChange(index, 'amount', e.target.value)}
                                  required
                                  style={{
                                    width: '100%',
                                    padding: '7px 8px',
                                    textAlign: 'right',
                                    borderRadius: '6px',
                                    border: line.isFuel ? '1px solid var(--border-subtle)' : '1.5px solid #10b981',
                                    backgroundColor: line.isFuel ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                                    color: line.isFuel ? '#10b981' : 'var(--text-main)',
                                    fontWeight: 800,
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                  }}
                                />
                              </td>

                              {/* 8. Remarks / Justification */}
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  placeholder="Trip purpose / justification notes..."
                                  value={line.remarks}
                                  onChange={(e) => handleExpenseLineChange(index, 'remarks', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '7px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.8125rem',
                                    outline: 'none'
                                  }}
                                />
                              </td>

                              {/* 9. Receipt (Up Arrow Icon triggers attachment option) */}
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <input
                                    type="file"
                                    ref={(el) => (receiptInputRefs.current[index] = el)}
                                    onChange={(e) => handleReceiptUpload(index, e)}
                                    style={{ display: 'none' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => receiptInputRefs.current[index]?.click()}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-subtle)',
                                      backgroundColor: line.receipt?.fileName ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                                      color: line.receipt?.fileName ? '#10b981' : 'var(--text-main)',
                                      cursor: 'pointer'
                                    }}
                                    title="Click up-arrow icon to attach bill/receipt from system"
                                  >
                                    <ArrowUpCircle size={15} color={line.receipt?.fileName ? '#10b981' : 'var(--text-muted)'} />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                      {line.receipt?.fileName ? 'Bill Added' : 'Attach'}
                                    </span>
                                  </button>
                                  {line.receipt?.fileName && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...formData.expenseLines];
                                        updated[index].receipt = { fileName: '', fileUrl: '', fileSize: '' };
                                        setFormData(prev => ({ ...prev, expenseLines: updated }));
                                      }}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                      title="Remove Receipt"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* 10. Action: Delete Icon */}
                              <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExpenseLine(index)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    padding: '4px'
                                  }}
                                  title="Delete Expense Line"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* BOTTOM RIGHT SIDE OF THIS SECTION: GRAND TOTAL CLAIM AMOUNT */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginTop: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 24px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase'
                      }}>
                        GRAND TOTAL CLAIMED AMOUNT:
                      </span>
                      <span style={{
                        fontSize: '1.45rem',
                        fontWeight: 900,
                        color: '#10b981',
                        letterSpacing: '-0.02em'
                      }}>
                        {formatINR(liveTotalClaimAmount)}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '18px 36px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Total KM: <strong>{liveTotalKm} KM</strong> • Final Claim: <strong style={{ color: '#10b981' }}>{formatINR(liveTotalClaimAmount)}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 24px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'var(--primary-gradient)',
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>{modalMode === 'create' ? 'Submit Claim & Visit Report' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FORMAL CLAIM SHEET PREVIEW / PRINT MODAL                               */}
      {/* ========================================================================= */}
      {isPreviewOpen && previewReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '920px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Top Toolbar */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
                <Receipt size={18} color="#10b981" />
                <span>Field Visit & Travel Expense Claim Sheet: {previewReport.reportNumber}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div style={{ padding: '36px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff', color: '#1e293b' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    FIELD VISIT CRM PVT LTD
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                    Official Field Visit Log & Employee Travel Expense Voucher<br />
                    Headquarters: Mumbai West Operations • GSTIN: 27AAAAA0000A1Z5
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>
                    EXPENSE CLAIM VOUCHER
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {previewReport.reportNumber}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>
                    Date: {previewReport.visitDate}
                  </div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                    Status: {previewReport.status}
                  </div>
                </div>
              </div>

              {/* 1. Employee & Visit Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    1. EMPLOYEE & DEPARTMENT:
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {previewReport.employeeName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '2px' }}>
                    Department: <strong>{previewReport.department}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '2px' }}>
                    Branch: <strong>{previewReport.branch}</strong>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    2. CUSTOMER & ACTIVITY:
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {previewReport.customerName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '2px' }}>
                    Contact Person: <strong>{previewReport.contactPerson}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '2px' }}>
                    Activity: <strong>{previewReport.activity}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '2px' }}>
                    Product / Machine: <strong>{previewReport.productMachine}</strong>
                  </div>
                </div>
              </div>

              {/* 3. Schedule & Route */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                  3. VISIT SCHEDULE & ROUTE:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#0f172a' }}>
                  <span>Route: <strong>{previewReport.placeFrom} ➔ {previewReport.placeTo}</strong></span>
                  <span>Time: <strong>{previewReport.startTime} to {previewReport.endTime}</strong></span>
                  <span>Person Count: <strong>{previewReport.personCount}</strong></span>
                  <span>Total Distance: <strong>{previewReport.totalKm} KM</strong></span>
                </div>
              </div>

              {/* 4. Executive Summary */}
              {previewReport.executiveSummary && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    4. SALES VISIT REPORT & EXECUTIVE SUMMARY:
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.825rem', lineHeight: 1.6, color: '#334155' }}>
                    {previewReport.executiveSummary}
                  </div>
                </div>
              )}

              {/* 5. Itemized Expense Table */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  5. ITEMIZED EXPENSE DETAILS SUB-GRID:
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Expense Head</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Start Km</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>End Km</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Total Km</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Fuel Rate (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Toll Tax (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewReport.expenseLines?.map((line, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{line.expenseHead}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{line.isFuel ? line.startKm : '-'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{line.isFuel ? line.endKm : '-'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{line.isFuel ? `${line.totalKm} KM` : '-'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{line.isFuel ? `₹${line.fuelRate}` : '-'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{line.isFuel ? formatINR(line.tollTax) : '-'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatINR(line.amount)}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{line.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Claim Amount Callout */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                padding: '16px 24px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '40px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                    TOTAL CLAIM AMOUNT:
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>
                    {formatINR(previewReport.totalClaimAmount)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ height: '35px' }} />
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    Employee Signature
                  </div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ height: '35px' }} />
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    Accounts / Auditor
                  </div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ height: '35px' }} />
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    Branch Manager Approval
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
