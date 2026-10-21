import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
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
  Percent, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  Check, 
  X, 
  Copy, 
  Send, 
  Layers, 
  Briefcase,
  TrendingUp,
  Receipt,
  Download,
  Share2,
  CheckSquare,
  Mail,
  LayoutGrid,
  Table
} from 'lucide-react';
import { api } from '../services/api';
import AdvancedDataGrid from '../components/grid/AdvancedDataGrid';
import ViewModeSwitcher from '../components/grid/ViewModeSwitcher';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';

const QUOTATION_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'quotationNumber', label: 'Quotation Number', transform: (v, r) => r.quotationNumber || '' },
  { key: 'revisionNumber', label: 'Revision', transform: (v, r) => `Rev ${r.revisionNumber ?? 0}` },
  { key: 'opportunityCode', label: 'Opportunity Code', transform: (v, r) => r.opportunityCode || '' },
  { key: 'customerName', label: 'Customer Organization', transform: (v, r) => r.customerName || '' },
  { key: 'contactPersonName', label: 'Contact Person', transform: (v, r) => r.contactPersonName || '' },
  { key: 'salesRepresentative', label: 'Sales Engineer', transform: (v, r) => r.salesRepresentative || '' },
  { key: 'validityDays', label: 'Validity (Days)', transform: (v, r) => r.validityDays ? `${r.validityDays} Days` : '' },
  { key: 'subtotalAmount', label: 'Subtotal (₹)', transform: (v, r) => r.subtotalAmount || 0 },
  { key: 'discountPercent', label: 'Discount (%)', transform: (v, r) => r.discountPercent != null ? `${r.discountPercent}%` : '' },
  { key: 'discountAmount', label: 'Discount Amount (₹)', transform: (v, r) => r.discountAmount || 0 },
  { key: 'gstAmount', label: 'GST (18%) (₹)', transform: (v, r) => r.gstAmount || 0 },
  { key: 'grandTotal', label: 'Grand Total (₹)', transform: (v, r) => r.grandTotal || 0 },
  { key: 'status', label: 'Status', transform: (v, r) => r.status || '' },
  { key: 'createdAt', label: 'Created Date', transform: (v, r) => r.createdAt ? String(r.createdAt).split('T')[0] : '' }
];

const QUOTATION_COLUMNS = [
  { key: 'select', label: '# / Select', defaultVisible: true, locked: true },
  { key: 'quotationNumber', label: 'Quotation # & Rev', defaultVisible: true },
  { key: 'opportunity', label: 'Opportunity & Client', defaultVisible: true },
  { key: 'contactPerson', label: 'Contact Person', defaultVisible: true },
  { key: 'salesRep', label: 'Sales Rep', defaultVisible: true },
  { key: 'validity', label: 'Validity', defaultVisible: true },
  { key: 'grossDiscount', label: 'Gross & Discount', defaultVisible: true },
  { key: 'grandTotal', label: 'Grand Total (18% GST)', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

const QUOTATION_STATUSES = [
  'DRAFT',
  'SENT TO CLIENT',
  'ACCEPTED (ORDER WON)',
  'REJECTED'
];

const STATUS_BADGES = {
  'DRAFT': {
    bg: 'rgba(100, 116, 139, 0.12)',
    text: '#64748b',
    border: 'rgba(100, 116, 139, 0.3)',
    icon: Clock
  },
  'SENT TO CLIENT': {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: Send
  },
  'ACCEPTED (ORDER WON)': {
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
  }
};

const STATIC_COMMERCIAL_TERMS = `1. Price Basis: Ex-works manufacturing facility, standard export/factory packaging included.
2. Payment Terms: 40% advance with formal Purchase Order, 50% proforma remittance against dispatch inspection, balance 10% post commissioning or within 30 days.
3. Delivery Schedule: 4 to 6 weeks from receipt of technically and commercially clear Purchase Order with agreed advance.
4. Warranty Period: 12 months comprehensive warranty from the date of commissioning or 15 months from dispatch against manufacturing defects.
5. Statutory Taxes: GST @ 18% is applicable as per Government of India statutory regulations at the time of invoicing.
6. Proposal Validity: This commercial proposal remains firm and binding for 30 days from issuance date.`;

const TEST_COMPANY_INFO = {
  name: 'TEST COMPANY INDUSTRIAL SYSTEMS PVT. LTD.',
  shortName: 'TEST COMPANY',
  division: 'Industrial Machinery, Automation & Systems Engineering',
  tagline: 'Precision Machinery • Industrial Robotics • Plant Automation Solutions',
  address: 'Plot No. 42-A, Peenya Industrial Area, Phase II, Bengaluru, Karnataka - 560058, India',
  cin: 'U29100KA2021PTC145890',
  gstin: '29AAACT9876Q1Z5',
  pan: 'AAACT9876Q',
  msme: 'UDYAM-KR-03-0012345',
  phone: '+91 80 4123 5678, +91 98765 43210',
  email: 'quotes@testcompany.com',
  website: 'www.testcompany-industrial.com',
  bankDetails: {
    accountName: 'TEST COMPANY INDUSTRIAL SYSTEMS PVT. LTD.',
    bankName: 'HDFC Bank Limited',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0001234',
    branch: 'Peenya Industrial Estate Branch, Bengaluru - 560058',
    accountType: 'Current Account'
  }
};

const numberToWordsINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const n = Math.round(Number(num));
  if (n === 0) return 'Rupees Zero Only';
  if (n < 0) return 'Minus ' + numberToWordsINR(Math.abs(n));

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertTwoDigits = (val) => {
    if (val < 20) return units[val];
    const unit = val % 10;
    return tens[Math.floor(val / 10)] + (unit > 0 ? ' ' + units[unit] : '');
  };

  const convertThreeDigits = (val) => {
    const hundred = Math.floor(val / 100);
    const rest = val % 100;
    let res = '';
    if (hundred > 0) {
      res += units[hundred] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  };

  let remainder = n;
  const crores = Math.floor(remainder / 10000000);
  remainder %= 10000000;
  const lakhs = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousands = Math.floor(remainder / 1000);
  remainder %= 1000;

  const parts = [];
  if (crores > 0) parts.push(convertThreeDigits(crores) + ' Crore');
  if (lakhs > 0) parts.push(convertTwoDigits(lakhs) + ' Lakh');
  if (thousands > 0) parts.push(convertTwoDigits(thousands) + ' Thousand');
  if (remainder > 0) parts.push(convertThreeDigits(remainder));

  return 'Rupees ' + parts.join(' ').trim() + ' Only';
};

const getValidUntilDate = (dateStr, days = 30) => {
  try {
    const base = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(base.getTime())) return `${days || 30} Days from issue`;
    base.setDate(base.getDate() + (Number(days) || 30));
    return base.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return `${days || 30} Days from issue`;
  }
};

const formatQuoteDate = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export default function QuotationsPage({
  showToast,
  initialStatusFilter,
  currentUser,
  initialOpenReport,
  onClearOpenReport
}) {
  const {
    columns: quoteColumns,
    visibleColumns: visibleQuoteCols,
    isColumnVisible: isQuoteColVisible,
    toggleColumn: toggleQuoteCol,
    resetToDefaults: resetQuoteCols,
    showAllColumns: showAllQuoteCols
  } = useColumnVisibility('crm_cols_quotations', QUOTATION_COLUMNS);

  // Quotations List State
  const [quotations, setQuotations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('aggrid');

  // Master Dependencies for Section 1 & Section 2
  const [opportunities, setOpportunities] = useState([]);
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(initialStatusFilter || 'ALL');
  const [expandedQuoteId, setExpandedQuoteId] = useState(null);

  // Selected Quotations Base for Report Generator
  const [selectedQuoteIds, setSelectedQuoteIds] = useState(new Set());
  const [reportScope, setReportScope] = useState('ALL'); // 'ALL' or 'SELECTED'

  // Reactively synchronize status filter with initialStatusFilter prop
  useEffect(() => {
    if (initialStatusFilter !== undefined && initialStatusFilter !== null) {
      setSelectedStatusFilter(initialStatusFilter);
      setReportStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Modal Controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'revision'
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview & Print Proforma Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);

  // Send Quotation Report Email Modal State
  const [sendEmailModal, setSendEmailModal] = useState({
    isOpen: false,
    quote: null,
    recipientEmail: '',
    customNote: '',
    appPassword: '',
    isSmtpConfigured: false,
    checkingSmtp: false,
    isSending: false
  });

  // Quotations & Revisions Audit Report Generator State
  const [isReportModalOpen, setIsReportModalOpen] = useState(Boolean(initialOpenReport));
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportStatus, setReportStatus] = useState(initialStatusFilter || 'ALL');
  const [reportCustomer, setReportCustomer] = useState('ALL');
  const [reportSalesRep, setReportSalesRep] = useState('ALL');
  const [reportRevisionType, setReportRevisionType] = useState('ALL'); // 'ALL', 'ORIGINAL', 'REVISED'
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportViewMode, setReportViewMode] = useState('DOCUMENT'); // 'DOCUMENT' (Quotation Document) or 'LEDGER' (Audit Register Table)
  const [reportActiveQuoteId, setReportActiveQuoteId] = useState(null);

  // Synchronize initialOpenReport trigger
  useEffect(() => {
    if (initialOpenReport) {
      handleOpenReportModal('ALL');
      if (onClearOpenReport) onClearOpenReport();
    }
  }, [initialOpenReport]);

  // Quotation row selection handlers for report generator
  const handleToggleSelectQuote = (id) => {
    setSelectedQuoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (filteredQuotations.length > 0 && filteredQuotations.every(q => selectedQuoteIds.has(q._id))) {
      setSelectedQuoteIds(prev => {
        const next = new Set(prev);
        filteredQuotations.forEach(q => next.delete(q._id));
        return next;
      });
    } else {
      setSelectedQuoteIds(prev => {
        const next = new Set(prev);
        filteredQuotations.forEach(q => next.add(q._id));
        return next;
      });
    }
  };

  const handleClearSelectedQuotes = () => {
    setSelectedQuoteIds(new Set());
    if (reportScope === 'SELECTED') {
      setReportScope('ALL');
    }
  };

  const handleOpenReportModal = (scope = 'AUTO', targetQuote = null) => {
    if (targetQuote) {
      setReportScope('SELECTED');
      setSelectedQuoteIds(new Set([targetQuote._id]));
      setReportActiveQuoteId(targetQuote._id);
      setReportViewMode('DOCUMENT');
    } else if (scope === 'SELECTED' || (scope === 'AUTO' && selectedQuoteIds.size > 0)) {
      setReportScope('SELECTED');
      setReportViewMode('DOCUMENT');
      const firstId = Array.from(selectedQuoteIds)[0];
      setReportActiveQuoteId(firstId || null);
    } else {
      setReportScope('ALL');
      setReportViewMode('DOCUMENT');
      if (quotations.length > 0) {
        setReportActiveQuoteId(quotations[0]._id);
      }
    }
    setIsReportModalOpen(true);
  };

  // Form State matching User Specification:
  // Section 1: Sales Opportunity, Customer Client, Contact Person, Validity Period (Days), Quotation Status, Sales Representative
  // Section 2: Quotation Line Items & Machinery Models (product detail in grid based on selected Sales Opportunity)
  // Section 3: Commercial Terms & Pricing Summary (Static 5-clause box, Gross Subtotal, Overall Discount %, GST 18%, GRAND TOTAL)
  const initialFormState = {
    opportunityId: '',
    opportunityCode: '',
    opportunityName: '',
    customerClient: '',
    contactPerson: '',
    validityDays: 30,
    status: 'DRAFT',
    salesRepresentative: '',
    revision: 'Rev 0',
    revisionNotes: '',
    commercialTerms: STATIC_COMMERCIAL_TERMS,
    lineItems: [
      {
        productId: '',
        productCode: '',
        productName: '',
        modelNumber: '',
        category: '',
        principal: '',
        unitPrice: 0,
        quantity: 1,
        totalPrice: 0,
        specifications: '',
        notes: ''
      }
    ],
    discountPercent: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  // Load all data on mount
  useEffect(() => {
    fetchQuotations();
    fetchDependencies();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.getQuotations();
      if (res && res.success) {
        setQuotations(res.quotations || []);
        setStats(res.stats || null);
      } else {
        showToast?.('Unable to load quotations from server');
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      showToast?.('Error connecting to Quotation API');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      // 1. Opportunities
      const oppsRes = await api.getOpportunities();
      setOpportunities(Array.isArray(oppsRes) ? oppsRes : (oppsRes?.opportunities || []));

      // 2. Employees (Filter strictly for Department Sales)
      const empRes = await api.getEmployees();
      const allEmps = Array.isArray(empRes) ? empRes : (empRes?.employees || []);
      const salesOnly = allEmps.filter(emp => 
        emp.department && /sales/i.test(emp.department)
      );
      setSalesEmployees(salesOnly);

      // 3. Customers
      const custRes = await api.getCustomers();
      setCustomers(Array.isArray(custRes) ? custRes : (custRes?.customers || []));

      // 4. Contact Persons
      const cpRes = await api.getContactPersons();
      setContactPersons(Array.isArray(cpRes) ? cpRes : (cpRes?.contacts || cpRes?.contactPersons || []));

      // 5. Products Master (for custom line items if needed)
      const prodRes = await api.getMasterProducts();
      setAllProducts(Array.isArray(prodRes) ? prodRes : (prodRes?.products || []));
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  // Reactive Line Items & Calculation helper
  const calculatePricing = (items = [], discountPct = 0) => {
    const grossSubtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unitPrice) || 0;
      return sum + (qty * rate);
    }, 0);

    const safeDiscount = Math.max(0, Math.min(100, Number(discountPct) || 0));
    const discountAmount = Math.round((grossSubtotal * safeDiscount) / 100);
    const taxableAmount = Math.max(0, grossSubtotal - discountAmount);
    const gstRate = 18;
    const gstAmount = Math.round((taxableAmount * gstRate) / 100);
    const grandTotal = taxableAmount + gstAmount;

    return {
      grossSubtotal,
      discountPercent: safeDiscount,
      discountAmount,
      taxableAmount,
      gstRate,
      gstAmount,
      grandTotal
    };
  };

  // Live pricing values for form
  const currentPricing = useMemo(() => {
    return calculatePricing(formData.lineItems, formData.discountPercent);
  }, [formData.lineItems, formData.discountPercent]);

  // When Sales Opportunity is selected in Section 1:
  // Auto-populate: Customer Client, Contact Person, Sales Representative, and Section 2 line items from that opportunity!
  const handleOpportunitySelect = (oppId) => {
    const selectedOpp = opportunities.find(o => o._id === oppId);
    if (!selectedOpp) {
      setFormData(prev => ({
        ...prev,
        opportunityId: '',
        opportunityCode: '',
        opportunityName: '',
        customerClient: '',
        contactPerson: '',
        salesRepresentative: ''
      }));
      return;
    }

    // Resolve Customer
    const customerName = selectedOpp.customerClient || '';

    // Resolve Contact Person: from Opportunity, or from Customer's primary contact
    let contactName = selectedOpp.contactPerson || '';
    if (!contactName && customerName) {
      const matchedCust = customers.find(c => c.organizationName?.toLowerCase() === customerName.toLowerCase());
      if (matchedCust?.primaryContactPerson) {
        contactName = matchedCust.primaryContactPerson;
      }
    }

    // Resolve Sales Representative: from Opportunity assigned salesperson
    let salesRep = selectedOpp.assignedSalesperson || '';
    if (!salesRep && salesEmployees.length > 0) {
      salesRep = salesEmployees[0].fullName;
    }

    // Section 2: Populate product detail in grid based on selected Sales Opportunity
    let populatedLineItems = [];
    if (selectedOpp.machines && selectedOpp.machines.length > 0) {
      populatedLineItems = selectedOpp.machines.map(m => ({
        productId: m.productId || '',
        productCode: m.productCode || 'PROD-OPP',
        productName: m.productName || 'Industrial Machinery',
        modelNumber: m.modelNumber || 'Standard Model',
        category: m.category || 'Machinery',
        principal: m.principal || selectedOpp.principalBrand || 'Standard Principal',
        unitPrice: Number(m.unitPrice) || 0,
        quantity: Number(m.quantity) || 1,
        totalPrice: (Number(m.quantity) || 1) * (Number(m.unitPrice) || 0),
        specifications: m.specifications || '',
        notes: m.notes || ''
      }));
    } else {
      // Fallback: create default line item with opportunity title & value
      populatedLineItems = [
        {
          productId: '',
          productCode: 'PROD-MAIN',
          productName: selectedOpp.opportunityName || 'Custom Industrial Machine',
          modelNumber: 'Custom Spec',
          category: 'Machinery',
          principal: selectedOpp.principalBrand || 'Principal OEM',
          unitPrice: Number(selectedOpp.dealValue) || 1000000,
          quantity: 1,
          totalPrice: Number(selectedOpp.dealValue) || 1000000,
          specifications: selectedOpp.technicalNotes || '',
          notes: ''
        }
      ];
    }

    setFormData(prev => ({
      ...prev,
      opportunityId: selectedOpp._id,
      opportunityCode: selectedOpp.opportunityCode,
      opportunityName: selectedOpp.opportunityName,
      customerClient: customerName,
      contactPerson: contactName,
      salesRepresentative: salesRep,
      lineItems: populatedLineItems
    }));
  };

  // Contacts available for currently selected customer
  const availableCustomerContacts = useMemo(() => {
    if (!formData.customerClient) return contactPersons;
    const filtered = contactPersons.filter(cp => 
      cp.organization && cp.organization.toLowerCase() === formData.customerClient.toLowerCase()
    );
    return filtered.length > 0 ? filtered : contactPersons;
  }, [formData.customerClient, contactPersons]);

  // Line item manipulation
  const handleLineItemChange = (index, field, value) => {
    const updated = [...formData.lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto recalculate total price for this line
    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : updated[index].quantity) || 0;
      const u = Number(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
      updated[index].totalPrice = q * u;
    }

    setFormData(prev => ({ ...prev, lineItems: updated }));
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          productId: '',
          productCode: `PROD-${prev.lineItems.length + 101}`,
          productName: '',
          modelNumber: '',
          category: 'Machinery Equipment',
          principal: '',
          unitPrice: 0,
          quantity: 1,
          totalPrice: 0,
          specifications: '',
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveLineItem = (index) => {
    if (formData.lineItems.length <= 1) {
      showToast?.('At least one machinery line item is required.');
      return;
    }
    const updated = formData.lineItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, lineItems: updated }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedQuotation(null);
    setFormData({
      ...initialFormState,
      salesRepresentative: salesEmployees[0]?.fullName || ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (quotation) => {
    setModalMode('edit');
    setSelectedQuotation(quotation);
    setFormData({
      opportunityId: quotation.opportunityId?._id || quotation.opportunityId || '',
      opportunityCode: quotation.opportunityCode || '',
      opportunityName: quotation.opportunityName || '',
      customerClient: quotation.customerClient || '',
      contactPerson: quotation.contactPerson || '',
      validityDays: quotation.validityDays || 30,
      status: quotation.status || 'DRAFT',
      salesRepresentative: quotation.salesRepresentative || '',
      revision: quotation.revision || 'Rev 0',
      revisionNotes: quotation.revisionNotes || '',
      commercialTerms: quotation.commercialTerms || STATIC_COMMERCIAL_TERMS,
      lineItems: quotation.lineItems && quotation.lineItems.length > 0 ? quotation.lineItems : initialFormState.lineItems,
      discountPercent: quotation.discountPercent || 0
    });
    setIsModalOpen(true);
  };

  // Open New Revision Modal
  const handleOpenRevisionModal = (quotation) => {
    setModalMode('revision');
    setSelectedQuotation(quotation);
    
    // Extract next revision number
    let nextRev = 'Rev 1';
    if (quotation.revision && quotation.revision.startsWith('Rev ')) {
      const curNum = parseInt(quotation.revision.replace('Rev ', ''), 10);
      nextRev = `Rev ${isNaN(curNum) ? 1 : curNum + 1}`;
    }

    setFormData({
      opportunityId: quotation.opportunityId?._id || quotation.opportunityId || '',
      opportunityCode: quotation.opportunityCode || '',
      opportunityName: quotation.opportunityName || '',
      customerClient: quotation.customerClient || '',
      contactPerson: quotation.contactPerson || '',
      validityDays: quotation.validityDays || 30,
      status: 'DRAFT', // Revisions start as draft until submitted
      salesRepresentative: quotation.salesRepresentative || '',
      revision: nextRev,
      revisionNotes: `Revision created to modify specifications & commercial terms.`,
      commercialTerms: quotation.commercialTerms || STATIC_COMMERCIAL_TERMS,
      lineItems: JSON.parse(JSON.stringify(quotation.lineItems || initialFormState.lineItems)),
      discountPercent: quotation.discountPercent || 0
    });
    setIsModalOpen(true);
  };

  // Open Preview Modal
  const handleOpenPreview = (quotation) => {
    setPreviewQuotation(quotation);
    setIsPreviewModalOpen(true);
  };

  // Submit Handler
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.opportunityId) {
      showToast?.('Please select a Sales Opportunity in Section 1.');
      return;
    }

    if (!formData.customerClient) {
      showToast?.('Customer Client is required.');
      return;
    }

    if (!formData.salesRepresentative) {
      showToast?.('Please assign a Sales Representative.');
      return;
    }

    if (!formData.lineItems || formData.lineItems.length === 0) {
      showToast?.('Please provide at least one machinery model line item in Section 2.');
      return;
    }

    setIsSubmitting(true);
    try {
      const pricing = calculatePricing(formData.lineItems, formData.discountPercent);
      const payload = {
        ...formData,
        ...pricing
      };

      let res;
      if (modalMode === 'create') {
        res = await api.createQuotation(payload);
      } else if (modalMode === 'edit') {
        res = await api.updateQuotation(selectedQuotation._id, payload);
      } else if (modalMode === 'revision') {
        res = await api.createQuotationRevision(selectedQuotation._id, payload);
      }

      if (res && res.success) {
        showToast?.(
          modalMode === 'create' 
            ? 'Quotation created successfully!' 
            : modalMode === 'edit'
            ? 'Quotation updated successfully!'
            : `Quotation revision ${payload.revision} created successfully!`
        );
        setIsModalOpen(false);
        fetchQuotations();
      } else {
        showToast?.(res?.message || 'Failed to save quotation.');
      }
    } catch (err) {
      console.error('Error submitting quotation:', err);
      showToast?.('Error processing request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Send Email Modal (for SENT TO CLIENT status or manual trigger)
  const handleInitiateSendEmail = async (quoteOrId) => {
    const targetQuote = typeof quoteOrId === 'object' && quoteOrId !== null
      ? quoteOrId
      : quotations.find(q => q._id === quoteOrId);

    if (!targetQuote) return;

    let resolvedEmail = (targetQuote.clientEmail || '').trim();
    if (!resolvedEmail && targetQuote.contactPerson) {
      const cp = contactPersons.find(c => c.name?.toLowerCase() === targetQuote.contactPerson?.toLowerCase());
      if (cp?.email) resolvedEmail = cp.email.trim();
    }
    if (!resolvedEmail && targetQuote.customerClient) {
      const cust = customers.find(c => c.organizationName?.toLowerCase() === targetQuote.customerClient?.toLowerCase());
      if (cust?.email) resolvedEmail = cust.email.trim();
    }

    setSendEmailModal({
      isOpen: true,
      quote: targetQuote,
      recipientEmail: resolvedEmail || '',
      customNote: '',
      appPassword: '',
      isSmtpConfigured: false,
      checkingSmtp: true,
      isSending: false
    });

    try {
      const smtpRes = await api.getQuotationSmtpStatus();
      setSendEmailModal(prev => ({
        ...prev,
        isSmtpConfigured: Boolean(smtpRes?.isConfigured),
        checkingSmtp: false
      }));
    } catch {
      setSendEmailModal(prev => ({ ...prev, checkingSmtp: false }));
    }
  };

  // Confirm and Send Quotation Report Email to Client
  const handleConfirmSendEmail = async () => {
    if (!sendEmailModal.quote) return;
    const targetEmail = sendEmailModal.recipientEmail?.trim();
    if (!targetEmail) {
      showToast?.('Please enter client recipient email address');
      return;
    }

    setSendEmailModal(prev => ({ ...prev, isSending: true }));
    try {
      const res = await api.updateQuotationStatus(sendEmailModal.quote._id, {
        status: 'SENT TO CLIENT',
        recipientEmail: targetEmail,
        customNote: sendEmailModal.customNote,
        appPassword: sendEmailModal.appPassword
      });

      if (res && res.success && res.emailResult?.isLive) {
        showToast?.(`Quotation report delivered live to ${targetEmail} from iqratareq@gmail.com!`);
        setSendEmailModal({
          isOpen: false,
          quote: null,
          recipientEmail: '',
          customNote: '',
          appPassword: '',
          isSmtpConfigured: true,
          checkingSmtp: false,
          isSending: false
        });
        fetchQuotations();
      } else if (res && res.statusUpdated && !res.emailResult?.isLive) {
        showToast?.(res.message || 'Status updated, but Google App Password required for live inbox delivery.');
        setSendEmailModal(prev => ({ ...prev, isSending: false, isSmtpConfigured: false }));
        fetchQuotations();
      } else {
        showToast?.(res?.message || 'Failed to dispatch quotation email');
        setSendEmailModal(prev => ({ ...prev, isSending: false }));
      }
    } catch (err) {
      console.error('Email dispatch error:', err);
      showToast?.('Error sending quotation report to client');
      setSendEmailModal(prev => ({ ...prev, isSending: false }));
    }
  };

  // Quick Status Update: Intercept SENT TO CLIENT to generate & send report
  const handleStatusChange = async (quoteId, newStatus) => {
    if (newStatus === 'SENT TO CLIENT') {
      handleInitiateSendEmail(quoteId);
      return;
    }

    try {
      const res = await api.updateQuotationStatus(quoteId, newStatus);
      if (res && res.success) {
        showToast?.(`Quotation status changed to "${newStatus}"`);
        fetchQuotations();
      } else {
        showToast?.(res?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status change error:', err);
      showToast?.('Network error updating status');
    }
  };

  // Delete Quotation
  const handleDelete = async (quoteId, quoteNum) => {
    if (!window.confirm(`Are you sure you want to delete Quotation ${quoteNum}?`)) {
      return;
    }
    try {
      const res = await api.deleteQuotation(quoteId);
      if (res && res.success) {
        showToast?.(`Quotation ${quoteNum} deleted successfully.`);
        fetchQuotations();
      } else {
        showToast?.(res?.message || 'Failed to delete quotation');
      }
    } catch (err) {
      console.error('Delete quotation error:', err);
      showToast?.('Error deleting quotation');
    }
  };

  // Filter change with browser URL synchronization
  const handleStatusFilterChange = (st) => {
    setSelectedStatusFilter(st);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'quotations');
      if (st && st !== 'ALL') {
        url.searchParams.set('status', st);
      } else {
        url.searchParams.delete('status');
      }
      window.history.replaceState(null, '', url.toString());
    } catch (e) {}
  };

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Status filter
      if (selectedStatusFilter === 'PENDING') {
        if (q.status !== 'DRAFT' && q.status !== 'SENT TO CLIENT') {
          return false;
        }
      } else if (selectedStatusFilter !== 'ALL' && q.status !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNum = q.quotationNumber?.toLowerCase().includes(query);
        const matchesOpp = q.opportunityName?.toLowerCase().includes(query) || q.opportunityCode?.toLowerCase().includes(query);
        const matchesCust = q.customerClient?.toLowerCase().includes(query);
        const matchesRep = q.salesRepresentative?.toLowerCase().includes(query);
        return matchesNum || matchesOpp || matchesCust || matchesRep;
      }
      return true;
    });
  }, [quotations, selectedStatusFilter, searchQuery]);

  // Format currency
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
      field: 'quotationNumber',
      headerName: 'Quotation # & Revision',
      flex: 1.3,
      minWidth: 195,
      cellRenderer: (params) => {
        const q = params.data;
        if (!q) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}>
            <span className="crm-code-pill" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              {q.quotationNumber}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: Number(q.revisionNumber) > 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.12)',
              color: Number(q.revisionNumber) > 0 ? '#3b82f6' : '#64748b',
              border: Number(q.revisionNumber) > 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(100, 116, 139, 0.25)'
            }}>
              Rev {q.revisionNumber ?? 0}
            </span>
          </div>
        );
      }
    },
    {
      field: 'opportunityName',
      headerName: 'Opportunity & Client',
      flex: 1.4,
      minWidth: 220,
      cellRenderer: (params) => {
        const q = params.data;
        if (!q) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.25' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.84rem' }}>
              {q.opportunityName || q.customerClient}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {q.opportunityCode ? `Opp: ${q.opportunityCode}` : q.customerClient}
            </div>
          </div>
        );
      }
    },
    {
      field: 'customerClient',
      headerName: 'Customer / Client',
      flex: 1.2,
      minWidth: 180,
      cellRenderer: (params) => {
        const q = params.data;
        if (!q) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <Building2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.82rem' }}>
              {q.customerClient || '—'}
            </span>
          </div>
        );
      }
    },
    {
      field: 'contactPersonName',
      headerName: 'Contact Person',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => {
        const q = params.data;
        if (!q) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <User size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
              {q.contactPersonName || '—'}
            </span>
          </div>
        );
      }
    },
    {
      field: 'salesRepresentative',
      headerName: 'Sales Rep',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => {
        const q = params.data;
        if (!q) return null;
        return (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>
            {q.salesRepresentative || '—'}
          </span>
        );
      }
    },
    {
      field: 'validityDays',
      headerName: 'Validity',
      width: 120,
      cellRenderer: (params) => {
        const val = params.value;
        if (!val) return '30 Days';
        return `${val} Days`;
      }
    },
    {
      field: 'grossSubtotal',
      headerName: 'Gross Subtotal',
      width: 140,
      type: 'numericColumn',
      valueFormatter: (params) => formatINR(params.value)
    },
    {
      field: 'discountAmount',
      headerName: 'Discount',
      width: 140,
      type: 'numericColumn',
      cellRenderer: (params) => {
        const q = params.data;
        if (!q) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%', lineHeight: '1.2' }}>
            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.82rem' }}>
              -{formatINR(q.discountAmount)}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({q.discountPercent || 0}%)
            </span>
          </div>
        );
      }
    },
    {
      field: 'gstAmount',
      headerName: 'GST (18%)',
      width: 130,
      type: 'numericColumn',
      valueFormatter: (params) => formatINR(params.value)
    },
    {
      field: 'grandTotal',
      headerName: 'Grand Total',
      width: 160,
      type: 'numericColumn',
      cellRenderer: (params) => {
        return (
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#10b981' }}>
            {formatINR(params.value)}
          </span>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      cellRenderer: (params) => {
        const st = params.value || 'DRAFT';
        const badge = STATUS_BADGES[st] || STATUS_BADGES['DRAFT'];
        const IconComponent = badge.icon || Clock;
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`
            }}>
              <IconComponent size={12} />
              <span>{st}</span>
            </span>
          </div>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Created Date',
      width: 130,
      valueFormatter: (params) => formatQuoteDate(params.value)
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 220,
      pinned: 'right',
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const quote = params.data;
        if (!quote) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <button
              type="button"
              onClick={() => handleOpenPreview(quote)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title="View & Print Formal Proforma Quotation"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenReportModal('SELECTED', quote)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                cursor: 'pointer'
              }}
              title="Generate & Print Official Quotation Report"
            >
              <Printer size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleInitiateSendEmail(quote)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                cursor: 'pointer'
              }}
              title="Email Quotation to Client"
            >
              <Send size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenRevisionModal(quote)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                color: '#3b82f6',
                cursor: 'pointer'
              }}
              title="Create New Revision (Rev +1)"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenEditModal(quote)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title="Edit Quotation Details"
            >
              <Edit3 size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(quote._id, quote.quotationNumber)}
              style={{
                padding: '5px 7px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                cursor: 'pointer'
              }}
              title="Delete Quotation"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], [quotations]);

  // Unique lists for report dropdown filters
  const uniqueReportCustomers = useMemo(() => {
    const set = new Set();
    quotations.forEach(q => {
      if (q.customerClient) set.add(q.customerClient);
    });
    customers.forEach(c => {
      if (c.companyName || c.name) set.add(c.companyName || c.name);
    });
    return Array.from(set).sort();
  }, [quotations, customers]);

  const uniqueReportSalesReps = useMemo(() => {
    const set = new Set();
    quotations.forEach(q => {
      if (q.salesRepresentative) set.add(q.salesRepresentative);
    });
    salesEmployees.forEach(e => {
      if (e.fullName) set.add(e.fullName);
    });
    return Array.from(set).sort();
  }, [quotations, salesEmployees]);

  // Quick date presets for report generator
  const handleDatePreset = (preset) => {
    const today = new Date();
    const toStr = today.toISOString().split('T')[0];
    
    if (preset === 'ALL') {
      setReportDateFrom('');
      setReportDateTo('');
      return;
    }
    
    if (preset === 'THIS_MONTH') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setReportDateFrom(from);
      setReportDateTo(toStr);
      return;
    }

    if (preset === 'LAST_30_DAYS') {
      const from = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      setReportDateFrom(from);
      setReportDateTo(toStr);
      return;
    }

    if (preset === 'THIS_QUARTER') {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const from = new Date(today.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
      setReportDateFrom(from);
      setReportDateTo(toStr);
      return;
    }

    if (preset === 'THIS_YEAR') {
      const from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      setReportDateFrom(from);
      setReportDateTo(toStr);
      return;
    }
  };

  // Base filtered quotations matching audit filters (date, status, customer, rep, revision)
  const baseReportQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Date filter
      const qDate = q.quotationDate || (q.createdAt ? q.createdAt.split('T')[0] : '');
      if (reportDateFrom && qDate && qDate < reportDateFrom) return false;
      if (reportDateTo && qDate && qDate > reportDateTo) return false;

      // Status filter
      if (reportStatus === 'PENDING') {
        if (q.status !== 'DRAFT' && q.status !== 'SENT TO CLIENT') return false;
      } else if (reportStatus !== 'ALL' && q.status !== reportStatus) {
        return false;
      }

      // Customer filter
      if (reportCustomer !== 'ALL' && q.customerClient !== reportCustomer) {
        return false;
      }

      // Sales Rep filter
      if (reportSalesRep !== 'ALL' && q.salesRepresentative !== reportSalesRep) {
        return false;
      }

      // Revision filter
      if (reportRevisionType === 'ORIGINAL') {
        if (q.revision && q.revision !== 'Rev 0') return false;
      } else if (reportRevisionType === 'REVISED') {
        if (!q.revision || q.revision === 'Rev 0') return false;
      }

      // Search
      if (reportSearchQuery.trim()) {
        const query = reportSearchQuery.toLowerCase();
        const matchesNum = (q.quotationNumber || '').toLowerCase().includes(query);
        const matchesCust = (q.customerClient || '').toLowerCase().includes(query);
        const matchesRep = (q.salesRepresentative || '').toLowerCase().includes(query);
        const matchesContact = (q.contactPerson || '').toLowerCase().includes(query);
        const matchesOpp = (q.opportunityName || '').toLowerCase().includes(query);
        return matchesNum || matchesCust || matchesRep || matchesContact || matchesOpp;
      }

      return true;
    });
  }, [quotations, reportDateFrom, reportDateTo, reportStatus, reportCustomer, reportSalesRep, reportRevisionType, reportSearchQuery]);

  // Scoped filtered report list: if reportScope is 'SELECTED', only include selected items
  const filteredReportQuotations = useMemo(() => {
    if (reportScope === 'SELECTED') {
      return baseReportQuotations.filter(q => selectedQuoteIds.has(q._id));
    }
    return baseReportQuotations;
  }, [baseReportQuotations, reportScope, selectedQuoteIds]);

  // Executive summary metrics computed live from filtered report records
  const reportMetrics = useMemo(() => {
    const totalCount = filteredReportQuotations.length;
    let originalCount = 0;
    let revisedCount = 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let grandTotal = 0;
    let wonCount = 0;
    let wonAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;

    filteredReportQuotations.forEach(q => {
      const isOriginal = !q.revision || q.revision === 'Rev 0';
      if (isOriginal) originalCount++;
      else revisedCount++;

      const gross = Number(q.grossSubtotal) || 0;
      const disc = Number(q.discountAmount) || 0;
      const tax = Number(q.taxableAmount) || 0;
      const gst = Number(q.gstAmount) || 0;
      const total = Number(q.grandTotal) || 0;

      totalGross += gross;
      totalDiscount += disc;
      totalTaxable += tax;
      totalGst += gst;
      grandTotal += total;

      if (q.status === 'ACCEPTED (ORDER WON)') {
        wonCount++;
        wonAmount += total;
      } else if (q.status === 'REJECTED') {
        rejectedCount++;
        rejectedAmount += total;
      } else {
        pendingCount++;
        pendingAmount += total;
      }
    });

    const winRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;
    const avgDiscountRate = totalGross > 0 ? ((totalDiscount / totalGross) * 100).toFixed(1) : '0.0';

    return {
      totalCount,
      originalCount,
      revisedCount,
      totalGross,
      totalDiscount,
      totalTaxable,
      totalGst,
      grandTotal,
      wonCount,
      wonAmount,
      pendingCount,
      pendingAmount,
      rejectedCount,
      rejectedAmount,
      winRate,
      avgDiscountRate
    };
  }, [filteredReportQuotations]);

  // Determine quotation list for DOCUMENT view
  const documentQuotesList = useMemo(() => {
    if (reportScope === 'SELECTED' && selectedQuoteIds.size > 0) {
      const selected = quotations.filter(q => selectedQuoteIds.has(q._id));
      if (selected.length > 0) return selected;
    }
    if (filteredReportQuotations.length > 0) {
      return filteredReportQuotations;
    }
    return quotations;
  }, [reportScope, selectedQuoteIds, quotations, filteredReportQuotations]);

  // Currently active quotation for single document view
  const activeDocumentQuotation = useMemo(() => {
    if (!reportActiveQuoteId || reportActiveQuoteId === 'ALL_SELECTED') {
      return documentQuotesList[0] || null;
    }
    return documentQuotesList.find(q => q._id === reportActiveQuoteId) || documentQuotesList[0] || null;
  }, [reportActiveQuoteId, documentQuotesList]);

  // Keep reportActiveQuoteId in sync
  useEffect(() => {
    if (isReportModalOpen && reportActiveQuoteId !== 'ALL_SELECTED') {
      const exists = documentQuotesList.some(q => q._id === reportActiveQuoteId);
      if (!exists && documentQuotesList.length > 0) {
        setReportActiveQuoteId(documentQuotesList[0]._id);
      }
    }
  }, [isReportModalOpen, documentQuotesList, reportActiveQuoteId]);

  // Matched customer & sales rep details resolver
  const getMatchedCustomerDetails = (quote) => {
    if (!quote) {
      return {
        customerName: 'Valued Commercial Client',
        contactPerson: 'Authorized Representative',
        contactDesignation: 'Procurement Head',
        address: 'Plot 18, Industrial Estate, Bengaluru, Karnataka - 560100',
        phone: '+91 98450 12345',
        email: 'procurement@client.com',
        gstin: '29AAACB1234F1Z1',
        salesRepName: 'Commercial Sales Specialist',
        salesRepPhone: '+91 80 4123 5678',
        salesRepEmail: 'quotes@testcompany.com',
        salesRepDept: 'Industrial Systems'
      };
    }

    const custName = (quote.customerClient || '').trim();
    const matchedCustomer = customers.find(c => 
      (c.organizationName || c.companyName || c.name || '').trim().toLowerCase() === custName.toLowerCase()
    );

    const contactName = (quote.contactPerson || '').trim();
    const matchedContact = contactPersons.find(cp => 
      (cp.name || cp.fullName || '').trim().toLowerCase() === contactName.toLowerCase()
    );

    const repName = (quote.salesRepresentative || '').trim();
    const matchedRep = salesEmployees.find(e => 
      (e.fullName || e.name || '').trim().toLowerCase() === repName.toLowerCase()
    );

    const fullAddress = matchedCustomer?.fullAddress || 
      ([matchedCustomer?.city, matchedCustomer?.state].filter(Boolean).join(', ')) || 
      'Plot 18, Electronic City Phase 1, Bengaluru, Karnataka - 560100';

    return {
      customerName: quote.customerClient || matchedCustomer?.organizationName || 'Valued Commercial Client',
      contactPerson: quote.contactPerson || matchedCustomer?.primaryContactPerson || matchedContact?.name || 'Authorized Technical / Purchasing Authority',
      contactDesignation: matchedContact?.designation || 'Head of Engineering & Procurement',
      address: fullAddress,
      phone: matchedContact?.phone || matchedContact?.mobile || matchedCustomer?.phone || matchedCustomer?.mobile || '+91 98450 12345',
      email: matchedContact?.email || matchedCustomer?.email || 'procurement@client.com',
      gstin: matchedCustomer?.gstin || matchedCustomer?.taxId || '29AAACB1234F1Z1',
      salesRepName: quote.salesRepresentative || matchedRep?.fullName || 'Commercial Sales Engineer',
      salesRepPhone: matchedRep?.mobile || matchedRep?.phone || '+91 80 4123 5678',
      salesRepEmail: matchedRep?.email || 'quotes@testcompany.com',
      salesRepDept: matchedRep?.department || 'Industrial Machinery Division'
    };
  };

  // Reusable Quotation Document Renderer (Header + Customer Details + Line Items + Bottom Totals + Test Company Footer)
  const renderQuotationDocument = (quote, docIndex = 0, totalDocs = 1) => {
    if (!quote) return null;
    const custInfo = getMatchedCustomerDetails(quote);
    const validUntilStr = getValidUntilDate(quote.quotationDate || quote.createdAt, quote.validityDays);
    const formattedDate = formatQuoteDate(quote.quotationDate || quote.createdAt);

    // Ensure line items list is non-empty
    const itemsToRender = quote.lineItems && quote.lineItems.length > 0 ? quote.lineItems : [
      {
        productName: quote.opportunityName || 'Industrial Machinery Automation System',
        modelNumber: 'Standard Heavy-Duty',
        category: 'Machinery Equipment',
        principal: 'Test Company Engineering',
        hsnCode: '84798999',
        quantity: 1,
        unit: 'Set',
        unitPrice: quote.grossSubtotal || quote.grandTotal || 0,
        totalPrice: quote.grossSubtotal || quote.grandTotal || 0,
        specifications: 'Standard industrial specification conforming to technical requirements',
        notes: ''
      }
    ];

    const isMultiple = totalDocs > 1;

    return (
      <div
        key={quote._id || docIndex}
        className={`printable-quotation-document ${docIndex < totalDocs - 1 ? 'page-break-document' : ''}`}
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '24px 28px',
          marginBottom: isMultiple ? '32px' : '0',
          border: isMultiple ? '1px solid #e2e8f0' : 'none',
          borderRadius: isMultiple ? '8px' : '0'
        }}
      >
        {/* ======================================================== */}
        {/* 1. STANDARD HEADER FOR TEST COMPANY                       */}
        {/* ======================================================== */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '3px solid #0f172a',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          {/* Test Company Branding & Letterhead */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.45rem',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
              flexShrink: 0
            }}>
              TC
            </div>
            <div>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                marginBottom: '4px'
              }}>
                TEST COMPANY &bull; INDUSTRIAL SYSTEMS DIVISION
              </div>
              <h1 style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                color: '#0f172a',
                margin: '0 0 3px 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                {TEST_COMPANY_INFO.name}
              </h1>
              <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.45 }}>
                <div>{TEST_COMPANY_INFO.address}</div>
                <div>
                  <strong>GSTIN:</strong> {TEST_COMPANY_INFO.gstin} &bull;{' '}
                  <strong>CIN:</strong> {TEST_COMPANY_INFO.cin} &bull;{' '}
                  <strong>PAN:</strong> {TEST_COMPANY_INFO.pan}
                </div>
                <div>
                  <strong>Phone:</strong> {TEST_COMPANY_INFO.phone} &bull;{' '}
                  <strong>Email:</strong> {TEST_COMPANY_INFO.email} &bull;{' '}
                  <strong>Web:</strong> {TEST_COMPANY_INFO.website}
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Identity Card */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '2px solid #0f172a',
            borderRadius: '10px',
            padding: '10px 16px',
            minWidth: '270px',
            textAlign: 'right'
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              color: '#10b981',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              COMMERCIAL PROFORMA QUOTATION
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#0f172a',
              fontFamily: 'monospace',
              letterSpacing: '-0.01em'
            }}>
              {quote.quotationNumber}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#334155', marginTop: '4px' }}>
              <strong>Revision:</strong>{' '}
              <span style={{
                backgroundColor: quote.revision && quote.revision !== 'Rev 0' ? '#fef3c7' : '#ecfdf5',
                color: quote.revision && quote.revision !== 'Rev 0' ? '#b45309' : '#047857',
                padding: '1px 7px',
                borderRadius: '4px',
                fontWeight: 800
              }}>
                {quote.revision || 'Rev 0'}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
              <strong>Date:</strong> {formattedDate}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
              <strong>Valid Until:</strong> {validUntilStr} ({quote.validityDays || 30} Days)
            </div>
            <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '2px' }}>
              <strong>Status:</strong>{' '}
              <span style={{
                fontWeight: 800,
                color: quote.status === 'ACCEPTED (ORDER WON)' ? '#10b981' : quote.status === 'REJECTED' ? '#ef4444' : '#0284c7'
              }}>
                {quote.status}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SELECTED QUOTATION CUSTOMER DETAILS IN HEADER         */}
        {/* ======================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Customer Client Info */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>QUOTATION ISSUED TO (CUSTOMER CLIENT DETAILS)</span>
              <span style={{ color: '#10b981' }}>BUYER / CLIENT</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginBottom: '3px' }}>
              {custInfo.customerName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '3px' }}>
              <strong>Attn:</strong> {custInfo.contactPerson} &bull; <span style={{ color: '#64748b' }}>{custInfo.contactDesignation}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, marginBottom: '3px' }}>
              <strong>Address:</strong> {custInfo.address}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              <strong>Phone:</strong> {custInfo.phone} &bull; <strong>Email:</strong> {custInfo.email}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
              <strong>Client GSTIN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{custInfo.gstin}</span>
            </div>
          </div>

          {/* Proposal & Commercial Reference */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px'
            }}>
              PROPOSAL & COMMERCIAL REFERENCE
            </div>
            <div style={{ fontSize: '0.84rem', color: '#0f172a', marginBottom: '3px' }}>
              <strong>Project / Opportunity:</strong> {quote.opportunityName || 'Direct Industrial Machine Supply'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '3px' }}>
              <strong>Opportunity Ref Code:</strong> <span style={{ fontFamily: 'monospace' }}>{quote.opportunityCode || 'OPP-DIRECT'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: '3px' }}>
              <strong>Assigned Sales Rep:</strong> {custInfo.salesRepName} ({custInfo.salesRepDept})
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '3px' }}>
              <strong>Sales Contact:</strong> {custInfo.salesRepPhone} &bull; {custInfo.salesRepEmail}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569' }}>
              <strong>Place of Supply:</strong> Karnataka (State Code: 29) &bull; <strong>Currency:</strong> INR (₹)
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. LINE DETAIL IN BODY (MACHINERY & PRODUCTS)             */}
        {/* ======================================================== */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: '#0f172a',
            letterSpacing: '0.04em',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>SECTION 2: QUOTATION LINE ITEMS & MACHINERY CONFIGURATION</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {itemsToRender.length} Line Item{itemsToRender.length > 1 ? 's' : ''} Included
            </span>
          </div>

          <table
            className="printable-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              lineHeight: 1.35
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 6px', border: '1px solid #334155', width: '32px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '8px 10px', border: '1px solid #334155' }}>Machine Model & Description</th>
                <th style={{ padding: '8px 8px', border: '1px solid #334155', width: '120px' }}>Principal OEM</th>
                <th style={{ padding: '8px 6px', border: '1px solid #334155', width: '70px', textAlign: 'center' }}>HSN</th>
                <th style={{ padding: '8px 6px', border: '1px solid #334155', width: '45px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 6px', border: '1px solid #334155', width: '45px', textAlign: 'center' }}>Unit</th>
                <th style={{ padding: '8px 8px', border: '1px solid #334155', width: '105px', textAlign: 'right' }}>Unit Rate (₹)</th>
                <th style={{ padding: '8px 8px', border: '1px solid #334155', width: '115px', textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {itemsToRender.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                      {item.productName || 'Industrial Machinery Equipment'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                      <strong>Model:</strong> {item.modelNumber || 'Standard Industrial'}
                      {item.category ? ` • Category: ${item.category}` : ''}
                      {item.specifications ? ` • Specs: ${item.specifications}` : ''}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginTop: '1px' }}>
                        Note: {item.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600 }}>
                    {item.principal || 'Test Company OEM'}
                  </td>
                  <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {item.hsnCode || '8479'}
                  </td>
                  <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                    {item.quantity || 1}
                  </td>
                  <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                    {item.unit || 'Nos'}
                  </td>
                  <td style={{ padding: '8px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                    {formatINR(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                    {formatINR(item.totalPrice || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* 4. BOTTOM SHOW TOTAL & FINANCIAL RECONCILIATION          */}
        {/* ======================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '20px',
          marginBottom: '24px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}>
          {/* Left: Total in Words & Tax Note */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                TOTAL AMOUNT IN WORDS (INR):
              </div>
              <div style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px dashed #cbd5e1',
                lineHeight: 1.4
              }}>
                {numberToWordsINR(quote.grandTotal)}
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.45 }}>
              <div>&bull; <strong>GST Summary:</strong> CGST 9% (₹{formatINR(Math.round((quote.gstAmount || 0) / 2)).replace('₹', '')}) + SGST 9% (₹{formatINR(Math.round((quote.gstAmount || 0) / 2)).replace('₹', '')}) = Total 18% GST (₹{formatINR(quote.gstAmount || 0).replace('₹', '')})</div>
              <div>&bull; <strong>Statutory Terms:</strong> Prices valid for {quote.validityDays || 30} days from issuance date. Standard warranties apply.</div>
            </div>
          </div>

          {/* Right: Itemized Financial Breakdown */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '14px 18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: '#64748b' }}>Gross Subtotal:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(quote.grossSubtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: '#b45309' }}>
              <span>Trade Discount ({quote.discountPercent || 0}%):</span>
              <span style={{ fontWeight: 700 }}>-{formatINR(quote.discountAmount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
              <span style={{ color: '#475569' }}>Net Taxable Value:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(quote.taxableAmount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem', color: '#2563eb' }}>
              <span>CGST @ 9%:</span>
              <span>+{formatINR(Math.round((quote.gstAmount || 0) / 2))}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem', color: '#2563eb' }}>
              <span>SGST @ 9%:</span>
              <span>+{formatINR(Math.round((quote.gstAmount || 0) / 2))}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem', color: '#1d4ed8', fontWeight: 700 }}>
              <span>Total Statutory GST (18%):</span>
              <span>+{formatINR(quote.gstAmount)}</span>
            </div>

            <div style={{
              borderTop: '2px solid #0f172a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#ecfdf5',
              margin: '6px -8px -6px -8px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1.5px solid #10b981'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#047857', textTransform: 'uppercase' }}>
                  GRAND TOTAL (INR)
                </div>
                <div style={{ fontSize: '0.68rem', color: '#047857' }}>
                  Inclusive of 18% GST
                </div>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.02em' }}>
                {formatINR(quote.grandTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. STANDARD FOOTER FOR TEST COMPANY                      */}
        {/* ======================================================== */}
        <div style={{
          marginTop: '16px',
          breakInside: 'avoid',
          pageBreakInside: 'avoid'
        }}>
          {/* Section 1: Standard Commercial Terms & Conditions */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '14px'
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              color: '#0f172a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '3px'
            }}>
              SECTION 3: STANDARD COMMERCIAL TERMS & CONDITIONS &bull; TEST COMPANY
            </div>
            <div style={{
              fontSize: '0.74rem',
              lineHeight: 1.5,
              color: '#334155',
              whiteSpace: 'pre-line'
            }}>
              {quote.commercialTerms || STATIC_COMMERCIAL_TERMS}
            </div>
          </div>

          {/* Section 2: Company Bank Details */}
          <div style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.75rem',
            color: '#1e293b'
          }}>
            <div>
              <strong style={{ color: '#0f172a' }}>COMPANY BANK REMITTANCE DETAILS (RTGS / NEFT):</strong>
              <div style={{ marginTop: '2px', color: '#475569' }}>
                Beneficiary: <strong>{TEST_COMPANY_INFO.bankDetails.accountName}</strong> &bull; Bank: <strong>{TEST_COMPANY_INFO.bankDetails.bankName}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>A/C No: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{TEST_COMPANY_INFO.bankDetails.accountNumber}</strong> &bull; IFSC: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{TEST_COMPANY_INFO.bankDetails.ifscCode}</strong></div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Branch: {TEST_COMPANY_INFO.bankDetails.branch} ({TEST_COMPANY_INFO.bankDetails.accountType})</div>
            </div>
          </div>

          {/* Section 3: Dual Signature Blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            paddingTop: '16px',
            borderTop: '2px solid #cbd5e1',
            marginBottom: '16px'
          }}>
            {/* Left: Customer Acceptance */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Authorized Signatory & Seal</span>
              </div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>
                  Customer Acceptance (Confirmed & Accepted)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {custInfo.customerName} &bull; Date & Official Seal
                </div>
              </div>
            </div>

            {/* Right: For Test Company */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800 }}>
                  {custInfo.salesRepName}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>
                  For {TEST_COMPANY_INFO.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Authorized Commercial Signatory & Official Seal
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Document Disclaimer */}
          <div style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.68rem',
            color: '#94a3b8'
          }}>
            <span>{TEST_COMPANY_INFO.name} &bull; Registered under Companies Act, 2013 &bull; CIN: {TEST_COMPANY_INFO.cin}</span>
            <span>Computer Generated Official Commercial Quotation Document &bull; Valid with digital authorization</span>
          </div>
        </div>
      </div>
    );
  };

  // CSV Export for filtered report records
  const handleExportCSV = () => {
    if (filteredReportQuotations.length === 0) {
      showToast?.('No quotation records found for the selected report filters.');
      return;
    }

    const headers = [
      'Sr No',
      'Quotation Number',
      'Revision',
      'Quotation Date',
      'Validity Days',
      'Customer Client',
      'Contact Person',
      'Sales Representative',
      'Opportunity Name',
      'Status',
      'Machinery Items Count',
      'Gross Subtotal (INR)',
      'Discount %',
      'Discount Amount (INR)',
      'Taxable Amount (INR)',
      'GST Rate %',
      'GST Amount (INR)',
      'Grand Total (INR)'
    ];

    const rows = filteredReportQuotations.map((q, idx) => [
      idx + 1,
      `"${q.quotationNumber || ''}"`,
      `"${q.revision || 'Rev 0'}"`,
      `"${q.quotationDate || ''}"`,
      q.validityDays || 30,
      `"${(q.customerClient || '').replace(/"/g, '""')}"`,
      `"${(q.contactPerson || '').replace(/"/g, '""')}"`,
      `"${(q.salesRepresentative || '').replace(/"/g, '""')}"`,
      `"${(q.opportunityName || '').replace(/"/g, '""')}"`,
      `"${q.status || 'DRAFT'}"`,
      q.lineItems?.length || 0,
      q.grossSubtotal || 0,
      q.discountPercent || 0,
      q.discountAmount || 0,
      q.taxableAmount || 0,
      q.gstRate || 18,
      q.gstAmount || 0,
      q.grandTotal || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quotations_Revisions_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Quotations & Revisions CSV report exported successfully!');
  };

  // Dedicated Isolated Print Engine (Guarantees ONLY the quotation document is printed - never background lists or pages)
  const handlePrintDocument = (targetContainerId = 'printable-quotation-root') => {
    const el = document.getElementById(targetContainerId);
    if (!el) {
      window.print();
      return;
    }

    // Remove any previous temporary print iframe
    const existingIframe = document.getElementById('quotation-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'quotation-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Quotation_${activeDocumentQuotation?.quotationNumber || 'Document'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          .page-break-document {
            page-break-after: always !important;
            break-after: page !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .page-break-document {
              page-break-after: always !important;
              break-after: page !important;
            }
          }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        try {
          iframe.remove();
        } catch (e) {}
      }, 1500);
    }, 250);
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Screen Content Wrapper: completely hidden when native print is used */}
      <div className="quotations-screen-content">
        {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                Quotations & Revisions
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0'
              }}>
                Commercial proposals, multi-version revision control, line-item machinery pricing & 18% GST calculations
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle: AG Grid vs Standard View */}
          <ViewModeSwitcher viewMode={viewMode} onChange={setViewMode} />

          <button
            onClick={fetchQuotations}
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
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="quotations-generate-report-btn"
            onClick={() => handleOpenReportModal(selectedQuoteIds.size > 0 ? 'SELECTED' : 'ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: selectedQuoteIds.size > 0 ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.4)',
              backgroundColor: selectedQuoteIds.size > 0 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
              color: 'var(--primary-emerald, #10b981)',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)'
            }}
            title={selectedQuoteIds.size > 0 ? `Generate Report for ${selectedQuoteIds.size} selected quotations` : "Generate & Print Quotations and Revisions Audit Report"}
          >
            <Printer size={17} />
            <span>{selectedQuoteIds.size > 0 ? `Generate Report (${selectedQuoteIds.size} Selected)` : 'Generate Report'}</span>
          </button>

          <button
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
              boxShadow: 'var(--shadow-glow)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={18} />
            <span>+ New Quotation</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Quotations */}
        <div className="card" style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
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
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Active Quotes
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats?.totalQuotesCount || quotations.length} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Proposals</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginTop: '2px' }}>
              Gross: {formatINR(stats?.totalGrossValue || 0)}
            </div>
          </div>
        </div>

        {/* Card 2: Order Won Revenue */}
        <div className="card" style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
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
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Orders Won (Accepted)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {formatINR(stats?.wonOrdersValue || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              {stats?.wonCount || 0} Deals Won • {stats?.winRate || 0}% Win Ratio
            </div>
          </div>
        </div>

        {/* Card 3: Pending with Client */}
        <div className="card" style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
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
            <Send size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sent To Client
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
              {stats?.sentCount || quotations.filter(q => q.status === 'SENT TO CLIENT').length} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Under Review</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
              Drafts: {stats?.draftCount || quotations.filter(q => q.status === 'DRAFT').length} in preparation
            </div>
          </div>
        </div>

        {/* Card 4: Cumulative Grand Total */}
        <div className="card" style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
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
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Grand Total (With GST)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {formatINR(stats?.totalGrandTotal || 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginTop: '2px' }}>
              Avg. Discount: {stats?.avgDiscount || 0}% • Fixed GST: 18%
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Content: Advanced AG Grid vs Standard Table */}
      {viewMode === 'aggrid' ? (
        <AdvancedDataGrid
          gridId="crm_quotations_directory"
          title="Quotations & Commercial Proposals"
          subtitle="Enterprise commercial data grid with revision control, 18% GST calculation, line-items, and Excel/PDF export"
          rowData={quotations}
          columnDefs={agGridColumnDefs}
          isLoading={loading}
          onRefresh={fetchQuotations}
          currentUser={currentUser?.email || currentUser?.username || 'admin'}
          showToast={showToast}
          exportFilename="Quotations_Register"
          defaultPageSize={25}
          primaryAction={{
            label: 'New Quotation',
            onClick: handleOpenCreateModal,
            id: 'ag-primary-add-quote'
          }}
        />
      ) : (
        <>
          {/* Filter & Search Bar */}
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
            { id: 'ALL', label: 'All Quotations' },
            { id: 'PENDING', label: 'Pending (Draft/Sent)' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'SENT TO CLIENT', label: 'Sent to Client' },
            { id: 'ACCEPTED (ORDER WON)', label: 'Accepted (Order Won)' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(tab => {
            const isActive = selectedStatusFilter === tab.id;
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
            columns={quoteColumns}
            visibleColumns={visibleQuoteCols}
            onToggle={toggleQuoteCol}
            onReset={resetQuoteCols}
            onShowAll={showAllQuoteCols}
          />

          {/* Export to Excel Button */}
          <ExportExcelButton
            data={filteredQuotations}
            columns={QUOTATION_EXPORT_COLUMNS}
            filename="Quotations_and_Revisions"
            sheetName="Quotations"
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
              placeholder="Search by quote #, client, rep..."
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

      {/* Selected Quotations Action Banner */}
      {selectedQuoteIds.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 20px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                {selectedQuoteIds.size} {selectedQuoteIds.size === 1 ? 'Quotation' : 'Quotations'} Selected
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ready to generate and print commercial audit report for these selected records
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleOpenReportModal('SELECTED')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
              }}
              title="Open Report Generator based on selected quotations"
            >
              <Printer size={16} />
              <span>Generate Report for {selectedQuoteIds.size} Selected</span>
            </button>

            <button
              onClick={handleClearSelectedQuotes}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Clear quotation selection"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Quotations Datalist Table */}
      <div className="card" style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#10b981' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading Quotations & Revisions...</div>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileSpreadsheet size={44} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              No Quotations Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 18px auto' }}>
              {searchQuery || selectedStatusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filter tabs.'
                : 'No quotations created yet. Click "+ New Quotation" to create an official commercial proposal.'}
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
              + Create First Quotation
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
                  {/* Select All Checkbox */}
                  {isQuoteColVisible('select') && (
                    <th style={{ padding: '14px 14px', width: '42px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredQuotations.length > 0 && filteredQuotations.every(q => selectedQuoteIds.has(q._id))}
                        onChange={handleSelectAllFiltered}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#10b981' }}
                        title="Select all filtered quotations"
                      />
                    </th>
                  )}
                  {isQuoteColVisible('quotationNumber') && <th style={{ padding: '14px 18px' }}>Quotation # &amp; Rev</th>}
                  {isQuoteColVisible('opportunity') && <th style={{ padding: '14px 18px' }}>Opportunity &amp; Client</th>}
                  {isQuoteColVisible('contactPerson') && <th style={{ padding: '14px 18px' }}>Contact Person</th>}
                  {isQuoteColVisible('salesRep') && <th style={{ padding: '14px 18px' }}>Sales Rep</th>}
                  {isQuoteColVisible('validity') && <th style={{ padding: '14px 18px' }}>Validity</th>}
                  {isQuoteColVisible('grossDiscount') && <th style={{ padding: '14px 18px' }}>Gross &amp; Discount</th>}
                  {isQuoteColVisible('grandTotal') && <th style={{ padding: '14px 18px' }}>Grand Total (18% GST)</th>}
                  {isQuoteColVisible('status') && <th style={{ padding: '14px 18px' }}>Status</th>}
                  {isQuoteColVisible('actions') && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => {
                  const isExpanded = expandedQuoteId === quote._id;
                  const isSelected = selectedQuoteIds.has(quote._id);
                  const statusInfo = STATUS_BADGES[quote.status] || STATUS_BADGES['DRAFT'];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <React.Fragment key={quote._id}>
                      <tr 
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s ease',
                          backgroundColor: isSelected 
                            ? 'rgba(16, 185, 129, 0.08)' 
                            : isExpanded 
                            ? 'rgba(16, 185, 129, 0.03)' 
                            : 'transparent'
                        }}
                      >
                        {/* Row Selection Checkbox */}
                        {isQuoteColVisible('select') && (
                          <td style={{ padding: '16px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectQuote(quote._id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#10b981' }}
                              title="Select quotation for report"
                            />
                          </td>
                        )}

                        {/* Quote Number & Revision */}
                        {isQuoteColVisible('quotationNumber') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => setExpandedQuoteId(isExpanded ? null : quote._id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Expand/Collapse Line Items"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                                  {quote.quotationNumber}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.25)'
                                  }}>
                                    {quote.revision || 'Rev 0'}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {quote.quotationDate || new Date(quote.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Opportunity & Client */}
                        {isQuoteColVisible('opportunity') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {quote.opportunityName || 'Machinery Proposal'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <Building2 size={13} color="#10b981" />
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{quote.customerClient}</span>
                              <span>•</span>
                              <span style={{ color: 'var(--primary-300)' }}>{quote.opportunityCode}</span>
                            </div>
                          </td>
                        )}

                        {/* Contact Person */}
                        {isQuoteColVisible('contactPerson') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600 }}>
                              <User size={14} color="var(--text-muted)" />
                              <span>{quote.contactPerson || 'Direct Client'}</span>
                            </div>
                          </td>
                        )}

                        {/* Sales Rep */}
                        {isQuoteColVisible('salesRep') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {quote.salesRepresentative?.charAt(0) || 'S'}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                {quote.salesRepresentative}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Validity */}
                        {isQuoteColVisible('validity') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: 600 }}>
                              <Calendar size={13} color="var(--text-muted)" />
                              <span>{quote.validityDays || 30} Days</span>
                            </div>
                          </td>
                        )}

                        {/* Gross & Discount */}
                        {isQuoteColVisible('grossDiscount') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {formatINR(quote.grossSubtotal)}
                            </div>
                            {quote.discountPercent > 0 ? (
                              <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                -{quote.discountPercent}% ({formatINR(quote.discountAmount)})
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                No Discount
                              </div>
                            )}
                          </td>
                        )}

                        {/* Grand Total */}
                        {isQuoteColVisible('grandTotal') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                              {formatINR(quote.grandTotal)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Includes 18% GST ({formatINR(quote.gstAmount)})
                            </div>
                          </td>
                        )}

                        {/* Quotation Status */}
                        {isQuoteColVisible('status') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <select
                                value={quote.status}
                                onChange={(e) => handleStatusChange(quote._id, e.target.value)}
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
                                {QUOTATION_STATUSES.map(st => (
                                  <option key={st} value={st} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: statusInfo.text }} />
                            </div>
                            {quote.emailSentTo && (
                              <div
                                style={{ fontSize: '0.68rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                title={`Quotation report emailed from ${quote.emailSentFrom || 'iqratareq@gmail.com'} to ${quote.emailSentTo} at ${quote.emailSentAt ? new Date(quote.emailSentAt).toLocaleString() : 'recently'}`}
                              >
                                <Mail size={11} />
                                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Sent: {quote.emailSentTo}
                                </span>
                              </div>
                            )}
                          </td>
                        )}

                        {/* Actions */}
                        {isQuoteColVisible('actions') && (
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {/* Formal Preview / Print */}
                              <button
                                onClick={() => handleOpenPreview(quote)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer'
                                }}
                                title="View & Print Formal Proforma Quotation"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Direct Print Quotation Report */}
                              <button
                                onClick={() => handleOpenReportModal('SELECTED', quote)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                  color: '#10b981',
                                  cursor: 'pointer'
                                }}
                                title="Generate & Print Official Quotation Report (Customer Header, Lines & Totals)"
                              >
                                <Printer size={15} />
                              </button>

                              {/* Email Quotation Report to Client */}
                              <button
                                onClick={() => handleInitiateSendEmail(quote)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(245, 158, 11, 0.4)',
                                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                  color: '#f59e0b',
                                  cursor: 'pointer'
                                }}
                                title="Generate Report & Send to Client Email (From: iqratareq@gmail.com)"
                              >
                                <Send size={15} />
                              </button>

                              {/* Create New Revision */}
                              <button
                                onClick={() => handleOpenRevisionModal(quote)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                  color: '#3b82f6',
                                  cursor: 'pointer'
                                }}
                                title="Create New Revision (Rev +1)"
                              >
                                <Copy size={15} />
                              </button>

                              {/* Edit Quotation */}
                              <button
                                onClick={() => handleOpenEditModal(quote)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer'
                                }}
                                title="Edit Quotation Details"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(quote._id, quote.quotationNumber)}
                                style={{
                                  padding: '6px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                  color: '#ef4444',
                                  cursor: 'pointer'
                                }}
                                title="Delete Quotation"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expandable Accordion: Section 2 Line Items & Section 3 Commercial Terms */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-subtle)' }}>
                          <td colSpan={visibleQuoteCols.length} style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
                              
                              {/* Section 2 Details: Machinery Line Items Grid */}
                              <div>
                                <div style={{
                                  fontSize: '0.8125rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  color: '#10b981',
                                  marginBottom: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <Layers size={15} />
                                  <span>Section 2. Quotation Line Items & Machinery Models ({quote.lineItems?.length || 0})</span>
                                </div>

                                <div style={{
                                  backgroundColor: 'var(--bg-card)',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--border-subtle)',
                                  overflow: 'hidden'
                                }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '8px 12px' }}>Product & Model</th>
                                        <th style={{ padding: '8px 12px' }}>Principal</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Rate</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (₹)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {quote.lineItems?.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                          <td style={{ padding: '10px 12px' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.productName}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                              Model: {item.modelNumber || 'N/A'} {item.specifications ? `• ${item.specifications}` : ''}
                                            </div>
                                          </td>
                                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                                            {item.principal || 'Standard'}
                                          </td>
                                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>
                                            {item.quantity}
                                          </td>
                                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                            {formatINR(item.unitPrice)}
                                          </td>
                                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                                            {formatINR(item.totalPrice)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Section 3 Details: Commercial Terms & Pricing Summary */}
                              <div>
                                <div style={{
                                  fontSize: '0.8125rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  color: '#10b981',
                                  marginBottom: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <FileText size={15} />
                                  <span>Section 3. Commercial Terms & Pricing Summary</span>
                                </div>

                                {/* Static Commercial Terms Box */}
                                <div style={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '12px 16px',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-main)',
                                  lineHeight: 1.6,
                                  marginBottom: '14px',
                                  whiteSpace: 'pre-line'
                                }}>
                                  {quote.commercialTerms || STATIC_COMMERCIAL_TERMS}
                                </div>

                                {/* Pricing Breakdown */}
                                <div style={{
                                  backgroundColor: 'var(--bg-card)',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--border-subtle)',
                                  padding: '14px 18px',
                                  fontSize: '0.8125rem'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Gross Subtotal:</span>
                                    <span style={{ fontWeight: 700 }}>{formatINR(quote.grossSubtotal)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#f59e0b' }}>
                                    <span>Overall Discount ({quote.discountPercent}%):</span>
                                    <span>-{formatINR(quote.discountAmount)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Taxable Subtotal:</span>
                                    <span style={{ fontWeight: 600 }}>{formatINR(quote.taxableAmount)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#3b82f6' }}>
                                    <span>Applicable GST (%): 18</span>
                                    <span>+{formatINR(quote.gstAmount)}</span>
                                  </div>
                                  <div style={{
                                    borderTop: '1px dashed var(--border-subtle)',
                                    paddingTop: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>GRAND TOTAL:</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>{formatINR(quote.grandTotal)}</span>
                                  </div>
                                </div>
                              </div>

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
      </div>

      {/* ========================================================================= */}
      {/* CREATE / EDIT / REVISION MODAL                                            */}
      {/* Sections: 1. Quotation & Client Details                                   */}
      {/*           2. Quotation Line Items & Machinery Models (1)                  */}
      {/*           3. Commercial Terms & Pricing Summary                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '1050px',
            maxHeight: '92vh',
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
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {modalMode === 'create' && 'New Commercial Quotation'}
                    {modalMode === 'edit' && `Edit Quotation: ${selectedQuotation?.quotationNumber}`}
                    {modalMode === 'revision' && `Create ${formData.revision} for: ${selectedQuotation?.quotationNumber}`}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Follow Section 1, Section 2 (Machinery Models), and Section 3 (Commercial Terms & GST)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable Form */}
            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* ------------------------------------------------------------- */}
                {/* SECTION 1. Quotation & Client Details                          */}
                {/* ------------------------------------------------------------- */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    color: '#10b981',
                    fontSize: '0.95rem',
                    fontWeight: 800
                  }}>
                    <Briefcase size={18} />
                    <span>Section 1. Quotation & Client Details</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {/* Sales Opportunity Dropdown */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Sales Opportunity <span style={{ color: '#ef4444' }}>*</span> (From Opportunity Table)
                      </label>
                      <select
                        value={formData.opportunityId}
                        onChange={(e) => handleOpportunitySelect(e.target.value)}
                        required
                        disabled={modalMode === 'edit' || modalMode === 'revision'}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Select Sales Opportunity to Auto-Populate Details --</option>
                        {opportunities.map(opp => (
                          <option key={opp._id} value={opp._id}>
                            [{opp.opportunityCode}] {opp.opportunityName} — {opp.customerClient}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                        * Once selected, Client, Contact Person, Sales Rep, and Machinery Line Items will auto-populate below.
                      </span>
                    </div>

                    {/* Customer Client */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Customer Client <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customerClient}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerClient: e.target.value }))}
                        placeholder="Customer Client Name"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Contact Person */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Contact Person (Selected on Customer) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={formData.contactPerson}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.875rem',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="">-- Select Contact Person --</option>
                          {formData.contactPerson && !availableCustomerContacts.some(c => c.fullName === formData.contactPerson) && (
                            <option value={formData.contactPerson}>{formData.contactPerson}</option>
                          )}
                          {availableCustomerContacts.map((cp, idx) => (
                            <option key={cp._id || idx} value={cp.fullName}>
                              {cp.fullName} {cp.designation ? `(${cp.designation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Validity Period (Days) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Validity Period (Days) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.validityDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, validityDays: Number(e.target.value) || 30 }))}
                          required
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.875rem',
                            outline: 'none'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[15, 30, 45, 60].map(days => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, validityDays: days }))}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: formData.validityDays === days ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                                backgroundColor: formData.validityDays === days ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                                color: formData.validityDays === days ? '#10b981' : 'var(--text-muted)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {days}d
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quotation Status Dropdown */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Quotation Status <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {QUOTATION_STATUSES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sales Representative Dropdown (from Employee with Department Sales) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Sales Representative (Dept: Sales) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        value={formData.salesRepresentative}
                        onChange={(e) => setFormData(prev => ({ ...prev, salesRepresentative: e.target.value }))}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Select Sales Representative --</option>
                        {salesEmployees.map(emp => (
                          <option key={emp._id || emp.employeeCode} value={emp.fullName}>
                            {emp.fullName} ({emp.designation || 'Sales'} • {emp.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Revision Tracker Info */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Version Revision Level
                      </label>
                      <input
                        type="text"
                        value={formData.revision}
                        onChange={(e) => setFormData(prev => ({ ...prev, revision: e.target.value }))}
                        placeholder="e.g. Rev 0, Rev 1"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 2. Quotation Line Items & Machinery Models (1)         */}
                {/* ------------------------------------------------------------- */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#10b981',
                      fontSize: '0.95rem',
                      fontWeight: 800
                    }}>
                      <Layers size={18} />
                      <span>Section 2. Quotation Line Items & Machinery Models ({formData.lineItems.length})</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={15} />
                      <span>Add Machine Model</span>
                    </button>
                  </div>

                  {/* Grid Table of Line Items */}
                  <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    overflowX: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '180px' }}>Product & Model Name *</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '130px' }}>Principal / OEM</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px' }}>Qty *</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', minWidth: '140px' }}>Unit Price (₹) *</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', minWidth: '140px' }}>Line Total (₹)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.lineItems.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            {/* Product Name & Model */}
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                value={item.productName}
                                onChange={(e) => handleLineItemChange(index, 'productName', e.target.value)}
                                placeholder="e.g. CNC Turning Center Lynx 2100"
                                required
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.8125rem',
                                  marginBottom: '4px'
                                }}
                              />
                              <input
                                type="text"
                                value={item.modelNumber}
                                onChange={(e) => handleLineItemChange(index, 'modelNumber', e.target.value)}
                                placeholder="Model / Spec Number (e.g. LYNX-2100-LS)"
                                style={{
                                  width: '100%',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </td>

                            {/* Principal / OEM */}
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                value={item.principal}
                                onChange={(e) => handleLineItemChange(index, 'principal', e.target.value)}
                                placeholder="e.g. Ace Micromatic"
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.8125rem'
                                }}
                              />
                            </td>

                            {/* Quantity */}
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                required
                                style={{
                                  width: '100%',
                                  padding: '8px 6px',
                                  textAlign: 'center',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.8125rem',
                                  fontWeight: 700
                                }}
                              />
                            </td>

                            {/* Unit Price */}
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                                required
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  textAlign: 'right',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-subtle)',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.8125rem',
                                  fontWeight: 600
                                }}
                              />
                            </td>

                            {/* Line Total */}
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>
                              {formatINR(item.totalPrice)}
                            </td>

                            {/* Delete Action */}
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(index)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  padding: '4px'
                                }}
                                title="Remove Line Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 3. Commercial Terms & Pricing Summary                          */}
                {/* ------------------------------------------------------------- */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    color: '#10b981',
                    fontSize: '0.95rem',
                    fontWeight: 800
                  }}>
                    <FileText size={18} />
                    <span>3. Commercial Terms & Pricing Summary</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                    
                    {/* Statick field in box of below */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                        Commercial Terms & Conditions (Fixed Proforma Clauses)
                      </label>
                      <div style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        fontSize: '0.8125rem',
                        lineHeight: 1.7,
                        color: 'var(--text-main)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          Standard Commercial Clauses:
                        </div>
                        <ol style={{ margin: 0, paddingLeft: '18px' }}>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Price Basis:</strong> Ex-works warehouse, packaging & forwarding extra as applicable.
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Payment Terms:</strong> 30% advance with order, balance 70% against dispatch proforma.
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Delivery:</strong> 4 to 6 weeks from receipt of technically & commercially clear order.
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Warranty:</strong> 12 months from commissioning date.
                          </li>
                          <li>
                            <strong>Taxes:</strong> GST @ 18% extra as applicable.
                          </li>
                        </ol>
                      </div>
                    </div>

                    {/* Pricing Summary Fields */}
                    <div style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      padding: '18px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Financial Calculation
                      </div>

                      {/* Gross Subtotal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          Gross Subtotal:
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {formatINR(currentPricing.grossSubtotal)}
                        </span>
                      </div>

                      {/* Overall Discount (%) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            Overall Discount (%):
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginLeft: '6px' }}>
                            (-{formatINR(currentPricing.discountAmount)})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '110px' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={formData.discountPercent}
                            onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))}
                            style={{
                              width: '70px',
                              padding: '6px 8px',
                              textAlign: 'right',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: 'var(--bg-main)',
                              color: 'var(--text-main)',
                              fontSize: '0.875rem',
                              fontWeight: 700
                            }}
                          />
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                        </div>
                      </div>

                      {/* Taxable Subtotal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Taxable Amount:
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          {formatINR(currentPricing.taxableAmount)}
                        </span>
                      </div>

                      {/* Applicable GST (%): 18 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            Applicable GST (%):
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            border: '1px solid rgba(59, 130, 246, 0.25)'
                          }}>
                            18%
                          </span>
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3b82f6' }}>
                          +{formatINR(currentPricing.gstAmount)}
                        </span>
                      </div>

                      {/* GRAND TOTAL */}
                      <div style={{
                        borderTop: '2px solid var(--border-subtle)',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                          GRAND TOTAL:
                        </span>
                        <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em' }}>
                          {formatINR(currentPricing.grandTotal)}
                        </span>
                      </div>

                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Total Items: <strong>{formData.lineItems.length}</strong> • Calculated Grand Total: <strong style={{ color: '#10b981' }}>{formatINR(currentPricing.grandTotal)}</strong>
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>
                          {modalMode === 'create' && 'Save & Issue Quotation'}
                          {modalMode === 'edit' && 'Update Quotation'}
                          {modalMode === 'revision' && `Publish ${formData.revision}`}
                        </span>
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
      {/* FORMAL PRINTABLE PROFORMA QUOTATION PREVIEW MODAL                         */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && previewQuotation && (
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
            maxWidth: '900px',
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
                <span>Commercial Proforma Quotation Preview: {previewQuotation.quotationNumber}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handlePrintDocument('printable-preview-root')}
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
                  <span>Print Proforma</span>
                </button>
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handleInitiateSendEmail(previewQuotation);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#f59e0b',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Generate Report & Send to Client Email (From: iqratareq@gmail.com)"
                >
                  <Send size={15} />
                  <span>Send to Client</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Body (Print friendly) */}
            <div id="printable-preview-root" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff', color: '#1e293b' }}>
              {renderQuotationDocument(previewQuotation, 0, 1)}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUOTATIONS & REVISIONS AUDIT REPORT GENERATOR & PRINT MODAL */}
      {/* ======================================================== */}
      {isReportModalOpen && (
        <div
          className="printable-report-wrapper"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="printable-report-dialog"
            style={{
              backgroundColor: 'var(--bg-card, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              width: '100%',
              maxWidth: '1420px',
              height: '94vh',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle, #e2e8f0)'
            }}
          >
            {/* Modal Control Header (Hidden in Print) */}
            <div
              className="no-print"
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: reportViewMode === 'DOCUMENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: reportViewMode === 'DOCUMENT' ? '#10b981' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {reportViewMode === 'DOCUMENT' ? <FileText size={20} /> : <Printer size={20} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                      {reportViewMode === 'DOCUMENT' ? 'Commercial Quotation Report' : 'Quotations & Revisions Audit Register'}
                    </h2>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      backgroundColor: reportViewMode === 'DOCUMENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: reportViewMode === 'DOCUMENT' ? '#10b981' : '#2563eb',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {reportViewMode === 'DOCUMENT' 
                        ? (reportActiveQuoteId === 'ALL_SELECTED' ? `${documentQuotesList.length} Quotes Sequential` : `Quote: ${activeDocumentQuotation?.quotationNumber || 'Selected'}`)
                        : `${filteredReportQuotations.length} records matching`}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    {reportViewMode === 'DOCUMENT' 
                      ? 'Test Company standard letterhead, customer detail in header, line items body & financial totals'
                      : 'Commercial pricing audit, revision tracking, 18% GST liability analysis & A4 summary ledger'}
                  </p>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-main, #f1f5f9)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle, #cbd5e1)'
              }}>
                <button
                  type="button"
                  onClick={() => setReportViewMode('DOCUMENT')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: reportViewMode === 'DOCUMENT' ? '#10b981' : 'transparent',
                    color: reportViewMode === 'DOCUMENT' ? '#ffffff' : 'var(--text-main, #334155)',
                    boxShadow: reportViewMode === 'DOCUMENT' ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Official Quotation Document with Test Company Header, Customer Details, Line Items & Totals"
                >
                  <FileText size={15} />
                  <span>Quotation Document</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportViewMode('LEDGER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: reportViewMode === 'LEDGER' ? '#0f172a' : 'transparent',
                    color: reportViewMode === 'LEDGER' ? '#ffffff' : 'var(--text-main, #334155)',
                    boxShadow: reportViewMode === 'LEDGER' ? '0 2px 6px rgba(15, 23, 42, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Commercial Audit Register Ledger (All Quotes Summary Table)"
                >
                  <FileSpreadsheet size={15} />
                  <span>Audit Register (Table List)</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  id="quotations-report-print-btn"
                  onClick={() => handlePrintDocument(reportViewMode === 'DOCUMENT' ? 'printable-quotation-root' : 'printable-ledger-root')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Print Report or Save as PDF"
                >
                  <Printer size={16} />
                  <span>{reportViewMode === 'DOCUMENT' ? (reportActiveQuoteId === 'ALL_SELECTED' ? `Print All (${documentQuotesList.length} Quotes)` : 'Print Report') : 'Print Audit Register'}</span>
                </button>

                <button
                  id="quotations-report-export-csv-btn"
                  onClick={handleExportCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    color: 'var(--text-main, #0f172a)',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Export filtered records to CSV spreadsheet"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>

                <button
                  id="quotations-report-close-btn"
                  onClick={() => setIsReportModalOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    color: 'var(--text-muted, #64748b)',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    cursor: 'pointer'
                  }}
                  title="Close Report Modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Control Bar (Hidden in Print) */}
            <div
              className="no-print"
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {reportViewMode === 'DOCUMENT' ? (
                /* Document View Mode Toolbar */
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                      SELECT QUOTATION TO PRINT:
                    </label>
                    <select
                      value={reportActiveQuoteId || ''}
                      onChange={e => setReportActiveQuoteId(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: '1.5px solid #10b981',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        minWidth: '360px',
                        cursor: 'pointer'
                      }}
                    >
                      {documentQuotesList.length > 1 && (
                        <option value="ALL_SELECTED">
                          📄 Print All Selected Quotations ({documentQuotesList.length} Quotes Sequential)
                        </option>
                      )}
                      {documentQuotesList.map((q, idx) => (
                        <option key={q._id} value={q._id}>
                          #{idx + 1}: {q.quotationNumber} ({q.revision || 'Rev 0'}) &bull; {q.customerClient} &bull; {formatINR(q.grandTotal)}
                        </option>
                      ))}
                    </select>

                    {reportScope === 'SELECTED' && selectedQuoteIds.size > 0 && (
                      <button
                        onClick={handleClearSelectedQuotes}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-muted, #64748b)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Reset to All Quotes"
                      >
                        Reset to All Quotes
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: '#475569' }}>
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#047857',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {reportActiveQuoteId === 'ALL_SELECTED'
                        ? `${documentQuotesList.length} Quotation Documents Ready for Sequential Print`
                        : `Client: ${activeDocumentQuotation?.customerClient || 'Selected'} • Total: ${formatINR(activeDocumentQuotation?.grandTotal || 0)}`}
                    </span>
                    <span style={{ color: '#64748b' }}>
                      Standard: <strong>A4 Formal Company Letterhead</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Row 0: Report Base Scope: All Filtered vs Selected Quotes */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-subtle, #e2e8f0)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                        REPORT BASE:
                      </span>
                      <button
                        onClick={() => setReportScope('ALL')}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: reportScope === 'ALL' ? '2px solid #10b981' : '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: reportScope === 'ALL' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card, #ffffff)',
                          color: reportScope === 'ALL' ? '#10b981' : 'var(--text-muted, #64748b)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FileSpreadsheet size={14} />
                        <span>All Matching Records ({baseReportQuotations.length})</span>
                      </button>

                      <button
                        onClick={() => setReportScope('SELECTED')}
                        disabled={selectedQuoteIds.size === 0}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: selectedQuoteIds.size === 0 ? 'not-allowed' : 'pointer',
                          opacity: selectedQuoteIds.size === 0 ? 0.45 : 1,
                          border: reportScope === 'SELECTED' ? '2px solid #10b981' : '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: reportScope === 'SELECTED' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card, #ffffff)',
                          color: reportScope === 'SELECTED' ? '#10b981' : 'var(--text-muted, #64748b)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title={selectedQuoteIds.size === 0 ? 'Select quotations in table or modal below' : `Generate report based on ${selectedQuoteIds.size} selected items`}
                      >
                        <CheckCircle2 size={14} />
                        <span>Selected Quotations Only ({selectedQuoteIds.size} Selected)</span>
                      </button>
                    </div>

                    {selectedQuoteIds.size > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                          ✓ {selectedQuoteIds.size} quotation{selectedQuoteIds.size > 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={handleClearSelectedQuotes}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-subtle, #cbd5e1)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-muted, #64748b)',
                            cursor: 'pointer'
                          }}
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Row 1: Date Range Presets */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginRight: '4px' }}>
                      Date Presets:
                    </span>
                    {[
                      { label: 'All Dates', value: 'ALL' },
                      { label: 'This Month', value: 'THIS_MONTH' },
                      { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
                      { label: 'This Quarter', value: 'THIS_QUARTER' },
                      { label: 'This Year', value: 'THIS_YEAR' }
                    ].map(p => (
                      <button
                        key={p.value}
                        onClick={() => handleDatePreset(p.value)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #334155)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Row 2: Filter Form Controls */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    {/* Date From */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                        FROM DATE
                      </label>
                      <input
                        type="date"
                        value={reportDateFrom}
                        onChange={e => setReportDateFrom(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                        TO DATE
                      </label>
                      <input
                        type="date"
                        value={reportDateTo}
                        onChange={e => setReportDateTo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                        STATUS
                      </label>
                      <select
                        value={reportStatus}
                        onChange={e => setReportStatus(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending (Draft & Sent)</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SENT TO CLIENT">Sent to Client</option>
                        <option value="ACCEPTED (ORDER WON)">Accepted (Order Won)</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {/* Customer */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                        CUSTOMER CLIENT
                      </label>
                      <select
                        value={reportCustomer}
                        onChange={e => setReportCustomer(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="ALL">All Customer Clients</option>
                        {uniqueReportCustomers.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sales Rep */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                        SALES REPRESENTATIVE
                      </label>
                      <select
                        value={reportSalesRep}
                        onChange={e => setReportSalesRep(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="ALL">All Sales Representatives</option>
                        {uniqueReportSalesReps.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    {/* Revision Depth */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                        REVISION DEPTH
                      </label>
                      <select
                        value={reportRevisionType}
                        onChange={e => setReportRevisionType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-main, #0f172a)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="ALL">All Versions (Original + Revs)</option>
                        <option value="ORIGINAL">Original Only (Rev 0)</option>
                        <option value="REVISED">Revisions Only (Rev &gt; 0)</option>
                      </select>
                    </div>

                    {/* Search & Reset */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                          SEARCH
                        </label>
                        <input
                          type="text"
                          placeholder="Ref #, Contact, Opp..."
                          value={reportSearchQuery}
                          onChange={e => setReportSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle, #cbd5e1)',
                            backgroundColor: 'var(--bg-card, #ffffff)',
                            color: 'var(--text-main, #0f172a)',
                            fontSize: '0.82rem'
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setReportDateFrom('');
                          setReportDateTo('');
                          setReportStatus('ALL');
                          setReportCustomer('ALL');
                          setReportSalesRep('ALL');
                          setReportRevisionType('ALL');
                          setReportSearchQuery('');
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #cbd5e1)',
                          backgroundColor: 'var(--bg-card, #ffffff)',
                          color: 'var(--text-muted, #64748b)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                        title="Reset all filters to defaults"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Printable Report Document Body */}
            <div
              className="printable-report-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px',
                backgroundColor: '#ffffff',
                color: '#0f172a'
              }}
            >
              {reportViewMode === 'DOCUMENT' ? (
                <div id="printable-quotation-root" className="printable-report-document" style={{ maxWidth: '100%', margin: '0 auto' }}>
                  {reportActiveQuoteId === 'ALL_SELECTED' ? (
                    documentQuotesList && documentQuotesList.length > 0 ? (
                      documentQuotesList.map((q, idx) => renderQuotationDocument(q, idx, documentQuotesList.length))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No quotation records selected to display.</p>
                      </div>
                    )
                  ) : (
                    activeDocumentQuotation ? (
                      renderQuotationDocument(activeDocumentQuotation, 0, 1)
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No quotation record found to display.</p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div id="printable-ledger-root" className="printable-report-document" style={{ maxWidth: '100%', margin: '0 auto' }}>
                
                {/* 1. Formal Corporate Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '3px solid #0f172a',
                  paddingBottom: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      marginBottom: '6px'
                    }}>
                      FIELD VISIT CRM COMMERCIAL SYSTEM
                    </div>
                    <h1 style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      letterSpacing: '-0.02em',
                      margin: 0
                    }}>
                      QUOTATIONS & REVISIONS AUDIT REGISTER
                    </h1>
                    <p style={{
                      fontSize: '0.82rem',
                      color: '#475569',
                      margin: '4px 0 0 0'
                    }}>
                      Commercial proforma pricing, revision iterations, 18% GST statutory audit & revenue status report
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    minWidth: '240px',
                    fontSize: '0.75rem',
                    textAlign: 'right'
                  }}>
                    <div style={{ color: '#64748b', marginBottom: '3px' }}>
                      <strong style={{ color: '#0f172a' }}>Generated:</strong> {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <div style={{ color: '#64748b', marginBottom: '3px' }}>
                      <strong style={{ color: '#0f172a' }}>Generated By:</strong> {currentUser?.name || currentUser?.fullName || 'Commercial Operations'}
                    </div>
                    <div style={{ color: '#64748b', marginBottom: '3px' }}>
                      <strong style={{ color: '#0f172a' }}>Status Filter:</strong> {reportStatus === 'ALL' ? 'All Statuses' : reportStatus}
                    </div>
                    <div style={{ color: '#64748b' }}>
                      <strong style={{ color: '#0f172a' }}>Report Base:</strong> {reportScope === 'SELECTED' ? `Selected (${filteredReportQuotations.length} quotes)` : 'All Matching Records'}
                    </div>
                  </div>
                </div>

                {/* Filter Summary Banner */}
                <div style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '0.75rem',
                  color: '#334155'
                }}>
                  <div>
                    <strong>Report Base:</strong> {reportScope === 'SELECTED' ? `Selected Quotations (${filteredReportQuotations.length})` : 'All Matching Filtered Records'} &bull;{' '}
                    <strong>Date Range:</strong> {reportDateFrom || 'All Prior'} to {reportDateTo || 'Current'} &bull;{' '}
                    <strong>Customer:</strong> {reportCustomer === 'ALL' ? 'All Customers' : reportCustomer} &bull;{' '}
                    <strong>Sales Rep:</strong> {reportSalesRep === 'ALL' ? 'All Reps' : reportSalesRep} &bull;{' '}
                    <strong>Revisions:</strong> {reportRevisionType}
                  </div>
                  <div>
                    <strong>Total Count:</strong> {filteredReportQuotations.length} records matching
                  </div>
                </div>

                {/* 2. Executive Summary Metrics Cards */}
                <div
                  className="printable-card-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '12px',
                    marginBottom: '24px'
                  }}
                >
                  {/* Metric 1 */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Total Quotes
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px 0' }}>
                      {reportMetrics.totalCount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {reportMetrics.originalCount} Orig &bull; {reportMetrics.revisedCount} Rev
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Gross Subtotal
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px 0' }}>
                      {formatINR(reportMetrics.totalGross)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Before discounts
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                      Total Discounts
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#b45309', margin: '4px 0 2px 0' }}>
                      -{formatINR(reportMetrics.totalDiscount)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#b45309' }}>
                      Avg: {reportMetrics.avgDiscountRate}% off
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
                      GST (18%)
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1d4ed8', margin: '4px 0 2px 0' }}>
                      +{formatINR(reportMetrics.totalGst)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#1d4ed8' }}>
                      Tax liability
                    </div>
                  </div>

                  {/* Metric 5 */}
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                      Grand Total
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857', margin: '4px 0 2px 0' }}>
                      {formatINR(reportMetrics.grandTotal)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#047857' }}>
                      Total pipeline value
                    </div>
                  </div>

                  {/* Metric 6 */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Won Revenue
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981', margin: '4px 0 2px 0' }}>
                      {formatINR(reportMetrics.wonAmount)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {reportMetrics.wonCount} won ({reportMetrics.winRate}% win rate)
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Ledger Table */}
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table
                    className="printable-table"
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.78rem',
                      lineHeight: '1.3'
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                        <th className="no-print" style={{ padding: '8px 6px', border: '1px solid #334155', width: '36px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={filteredReportQuotations.length > 0 && filteredReportQuotations.every(q => selectedQuoteIds.has(q._id))}
                            onChange={() => {
                              const allSelected = filteredReportQuotations.every(q => selectedQuoteIds.has(q._id));
                              setSelectedQuoteIds(prev => {
                                const next = new Set(prev);
                                if (allSelected) {
                                  filteredReportQuotations.forEach(q => next.delete(q._id));
                                } else {
                                  filteredReportQuotations.forEach(q => next.add(q._id));
                                }
                                return next;
                              });
                            }}
                            style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#10b981' }}
                            title="Toggle all quotations in report"
                          />
                        </th>
                        <th style={{ padding: '8px 6px', border: '1px solid #334155', width: '30px', textAlign: 'center' }}>#</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155' }}>Quote Ref #</th>
                        <th style={{ padding: '8px 6px', border: '1px solid #334155', width: '45px', textAlign: 'center' }}>Rev</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155', width: '75px' }}>Date</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155' }}>Customer Client & Contact</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155' }}>Sales Rep</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155', width: '100px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155' }}>Machinery / Items</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155', textAlign: 'right' }}>Gross (₹)</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155', textAlign: 'right' }}>Disc (₹)</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155', textAlign: 'right' }}>GST 18% (₹)</th>
                        <th style={{ padding: '8px 8px', border: '1px solid #334155', textAlign: 'right' }}>Grand Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReportQuotations.length === 0 ? (
                        <tr>
                          <td colSpan="13" style={{ padding: '36px', textAlign: 'center', color: '#64748b', border: '1px solid #cbd5e1' }}>
                            No quotations found matching the selected report criteria. Try adjusting date filters or search query.
                          </td>
                        </tr>
                      ) : (
                        filteredReportQuotations.map((q, idx) => {
                          const isEven = idx % 2 === 0;
                          const revNumber = q.revision || 'Rev 0';
                          const isRevised = revNumber !== 'Rev 0';
                          
                          // Status styling for print
                          let statusBg = '#f1f5f9';
                          let statusColor = '#334155';
                          let statusLabel = q.status || 'DRAFT';
                          if (q.status === 'ACCEPTED (ORDER WON)') {
                            statusBg = '#dcfce7';
                            statusColor = '#15803d';
                            statusLabel = 'WON';
                          } else if (q.status === 'REJECTED') {
                            statusBg = '#fee2e2';
                            statusColor = '#b91c1c';
                            statusLabel = 'REJECTED';
                          } else if (q.status === 'SENT TO CLIENT') {
                            statusBg = '#fef3c7';
                            statusColor = '#b45309';
                            statusLabel = 'SENT';
                          } else {
                            statusLabel = 'DRAFT';
                          }

                          return (
                            <tr
                              key={q._id || idx}
                              style={{
                                backgroundColor: isEven ? '#ffffff' : '#f8fafc',
                                pageBreakInside: 'avoid'
                              }}
                            >
                              <td className="no-print" style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedQuoteIds.has(q._id)}
                                  onChange={() => handleToggleSelectQuote(q._id)}
                                  style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#10b981' }}
                                  title="Toggle inclusion in selected report"
                                />
                              </td>
                              <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                                {q.quotationNumber}
                              </td>
                              <td style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <span style={{
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  backgroundColor: isRevised ? '#eff6ff' : '#f1f5f9',
                                  color: isRevised ? '#1d4ed8' : '#475569',
                                  border: isRevised ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                                }}>
                                  {revNumber}
                                </span>
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', color: '#334155', whiteSpace: 'nowrap' }}>
                                {q.quotationDate || (q.createdAt ? q.createdAt.split('T')[0] : '—')}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{q.customerClient || '—'}</div>
                                {q.contactPerson && (
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Attn: {q.contactPerson}</div>
                                )}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', color: '#334155' }}>
                                {q.salesRepresentative || '—'}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  backgroundColor: statusBg,
                                  color: statusColor,
                                  display: 'inline-block'
                                }}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', maxWidth: '180px' }}>
                                {q.lineItems && q.lineItems.length > 0 ? (
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                      {q.lineItems[0].productName}
                                    </div>
                                    {q.lineItems.length > 1 && (
                                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                        +{q.lineItems.length - 1} additional item{q.lineItems.length > 2 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                {formatINR(q.grossSubtotal)}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#b45309' }}>
                                {Number(q.discountAmount) > 0 ? `-${formatINR(q.discountAmount)}` : '0'}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', color: '#2563eb' }}>
                                +{formatINR(q.gstAmount)}
                              </td>
                              <td style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                                {formatINR(q.grandTotal)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 900 }}>
                        <td className="no-print" style={{ border: '1px solid #334155' }} />
                        <td colSpan="8" style={{ padding: '10px 8px', border: '1px solid #334155', textAlign: 'right', letterSpacing: '0.04em' }}>
                          TOTAL AUDIT CONSOLIDATION ({filteredReportQuotations.length} RECORDS):
                        </td>
                        <td style={{ padding: '10px 8px', border: '1px solid #334155', textAlign: 'right' }}>
                          {formatINR(reportMetrics.totalGross)}
                        </td>
                        <td style={{ padding: '10px 8px', border: '1px solid #334155', textAlign: 'right', color: '#fde68a' }}>
                          -{formatINR(reportMetrics.totalDiscount)}
                        </td>
                        <td style={{ padding: '10px 8px', border: '1px solid #334155', textAlign: 'right', color: '#bfdbfe' }}>
                          +{formatINR(reportMetrics.totalGst)}
                        </td>
                        <td style={{ padding: '10px 8px', border: '1px solid #334155', textAlign: 'right', color: '#4ade80', fontSize: '0.85rem' }}>
                          {formatINR(reportMetrics.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. Signature & Commercial Sign-off Block */}
                <div
                  className="printable-sign-block"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                    marginTop: '40px',
                    paddingTop: '20px',
                    borderTop: '2px solid #cbd5e1',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '42px' }} />
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                      Prepared By: {currentUser?.name || currentUser?.fullName || 'Sales Operations Specialist'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Quotation & Revision Desk
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '42px' }} />
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                      Verified By: Sales Head / Manager
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Regional Commercial Division
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '42px' }} />
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                      Approved By: Commercial Finance Audit
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Internal Compliance & Taxation
                    </div>
                  </div>
                </div>

                {/* Print Footer Disclaimer */}
                <div style={{
                  marginTop: '24px',
                  paddingTop: '10px',
                  borderTop: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.68rem',
                  color: '#94a3b8'
                }}>
                  <span>Field Visit CRM Commercial System &bull; Confidential & Proprietary</span>
                  <span>All amounts quoted in Indian National Rupees (INR) &bull; Standard GST 18% included</span>
                </div>

              </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Send Quotation Report Email Modal */}
      {sendEmailModal.isOpen && sendEmailModal.quote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '580px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border-subtle, #cbd5e1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Email Quotation Report to Client</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                    Standard Proforma Report &bull; Status will update to Sent to Client
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSendEmailModal({ isOpen: false, quote: null, recipientEmail: '', customNote: '', isSending: false })}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Sender Details (Fixed to iqratareq@gmail.com) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                  FROM (SENDER EMAIL)
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)'
                }}>
                  <Mail size={16} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', fontFamily: 'monospace' }}>
                    iqratareq@gmail.com
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em'
                  }}>
                    REQUIRED SENDER
                  </span>
                </div>
              </div>

              {/* Gmail SMTP Status / App Password configuration */}
              {!sendEmailModal.isSmtpConfigured ? (
                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#b45309', fontSize: '0.8125rem' }}>
                    <AlertCircle size={16} color="#f59e0b" />
                    <span>Google App Password Required to Deliver to Real Inboxes</span>
                  </div>
                  <p style={{ margin: '6px 0 8px 0', fontSize: '0.75rem', color: '#92400e', lineHeight: 1.45 }}>
                    Google requires a <strong>16-character App Password</strong> for <code>iqratareq@gmail.com</code> to deliver messages directly to external email inboxes. Please enter it below (it will be remembered automatically).
                  </p>
                  <div>
                    <input
                      type="password"
                      value={sendEmailModal.appPassword}
                      onChange={(e) => setSendEmailModal(prev => ({ ...prev, appPassword: e.target.value }))}
                      placeholder="Enter 16-character Google App Password (e.g. abcd efgh ijkl mnop)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d97706',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#b45309', lineHeight: 1.4 }}>
                    💡 <strong>How to get this:</strong> Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords</a> and create an app password for <em>Field Visit CRM</em>.
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #10b981',
                  color: '#047857',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>Gmail SMTP Active: Ready to deliver live emails to client inbox from iqratareq@gmail.com</span>
                </div>
              )}

              {/* Recipient Details */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '4px' }}>
                  TO (CLIENT RECIPIENT EMAIL) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #64748b)' }} />
                  <input
                    type="email"
                    value={sendEmailModal.recipientEmail}
                    onChange={(e) => setSendEmailModal(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="e.g. client@company.com"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      color: 'var(--text-main, #0f172a)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                  Auto-resolved from customer/contact profile. You can modify or verify before dispatch.
                </p>
              </div>

              {/* Document Summary Card */}
              <div style={{
                backgroundColor: 'var(--bg-main, #f8fafc)',
                border: '1px solid var(--border-subtle, #cbd5e1)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block' }}>Quotation Number</span>
                    <strong style={{ color: 'var(--text-main, #0f172a)', fontFamily: 'monospace' }}>{sendEmailModal.quote.quotationNumber}</strong>
                    <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>({sendEmailModal.quote.revision || 'Rev 0'})</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block' }}>Grand Total (Inc. 18% GST)</span>
                    <strong style={{ color: '#047857', fontSize: '0.95rem' }}>
                      ₹{Number(sendEmailModal.quote.grandTotal || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block' }}>Client Organization</span>
                    <strong style={{ color: 'var(--text-main, #0f172a)' }}>{sendEmailModal.quote.customerClient}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.72rem', display: 'block' }}>Attention To</span>
                    <span style={{ color: 'var(--text-main, #0f172a)' }}>{sendEmailModal.quote.contactPerson || 'Procurement Team'}</span>
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '0.72rem', color: '#64748b' }}>
                  ✓ Includes standard Test Company header, line items table, 18% GST breakdown, bank RTGS details & commercial footer.
                </div>
              </div>

              {/* Custom Note (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: '4px' }}>
                  OPTIONAL COVER NOTE / REMARKS TO CLIENT
                </label>
                <textarea
                  value={sendEmailModal.customNote}
                  onChange={(e) => setSendEmailModal(prev => ({ ...prev, customNote: e.target.value }))}
                  placeholder="e.g. Please find our official proposal for your machinery automation requirement. Please review and feel free to contact us."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    backgroundColor: 'var(--bg-card, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: 'var(--bg-main, #f8fafc)',
              borderTop: '1px solid var(--border-subtle, #cbd5e1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setSendEmailModal({ isOpen: false, quote: null, recipientEmail: '', customNote: '', isSending: false })}
                disabled={sendEmailModal.isSending}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: sendEmailModal.isSending ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendEmail}
                disabled={sendEmailModal.isSending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: sendEmailModal.isSending ? 'wait' : 'pointer',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
              >
                {sendEmailModal.isSending ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Generating & Sending Report...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Generate Report & Send Email</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
