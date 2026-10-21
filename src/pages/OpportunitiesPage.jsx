import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Building2, 
  User, 
  Plus, 
  PlusCircle,
  Search, 
  Filter, 
  CheckCircle2, 
  CheckCircle,
  TrendingUp, 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  X, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  AlertTriangle, 
  Award, 
  FileSpreadsheet, 
  Printer, 
  Copy, 
  Check, 
  LayoutGrid, 
  List,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  ExternalLink,
  Tag,
  Table
} from 'lucide-react';
import { api } from '../services/api';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';
import AdvancedDataGrid from '../components/grid/AdvancedDataGrid';

const OPPORTUNITY_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'opportunityCode', label: 'Opportunity Code', transform: (v, r) => r.opportunityCode || '' },
  { key: 'title', label: 'Opportunity Title', transform: (v, r) => r.title || '' },
  { key: 'customerName', label: 'Customer Organization', transform: (v, r) => r.customerName || '' },
  { key: 'principalName', label: 'Principal OEM Brand', transform: (v, r) => r.principalName || '' },
  { key: 'dealValue', label: 'Deal Value (₹)', transform: (v, r) => r.dealValue || 0 },
  { key: 'pipelineStage', label: 'Pipeline Stage', transform: (v, r) => r.pipelineStage || '' },
  { key: 'winProbability', label: 'Win Probability (%)', transform: (v, r) => r.winProbability != null ? `${r.winProbability}%` : '' },
  { key: 'assignedSalesperson', label: 'Salesperson', transform: (v, r) => r.assignedSalesperson || '' },
  { key: 'quotationNumber', label: 'Quotation Number', transform: (v, r) => r.quotationNumber || 'N/A' },
  { key: 'revisionNumber', label: 'Revision', transform: (v, r) => r.revisionNumber != null ? `Rev ${r.revisionNumber}` : '' },
  { key: 'leadSource', label: 'Lead Source', transform: (v, r) => r.leadSource || '' },
  { key: 'expectedCloseDate', label: 'Expected Closing Date', transform: (v, r) => r.expectedCloseDate ? String(r.expectedCloseDate).split('T')[0] : '' }
];

const OPPORTUNITY_COLUMNS = [
  { key: 'index', label: '#', defaultVisible: true, locked: true },
  { key: 'opportunity', label: 'Opportunity Code & Title', defaultVisible: true },
  { key: 'customer', label: 'Customer Client', defaultVisible: true },
  { key: 'principal', label: 'Principal OEM Brand', defaultVisible: true },
  { key: 'dealValue', label: 'Deal Value (₹)', defaultVisible: true },
  { key: 'stage', label: 'Pipeline Stage', defaultVisible: true },
  { key: 'quotation', label: 'Quotation (Rev)', defaultVisible: true },
  { key: 'salesperson', label: 'Assigned Salesperson', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

const PIPELINE_STAGES = [
  'New Leads',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won Deals',
  'Lost Deals'
];

const LEAD_SOURCES = [
  'Direct Daily Visit',
  'Exhibition / Trade Show',
  'OEM Principal Referral',
  'Website / Inbound',
  'Cold Outreach',
  'Repeat Customer Order'
];

const THREAT_LEVELS = [
  '🟢 Low Threat - We Have Strong Preference',
  '🟡 Medium Threat - Active Evaluation by Client',
  '🟠 High Threat - Strong Price / Feature Rivalry',
  '🔴 Dominant Threat - Incumbent Supplier'
];

const STAGE_COLORS = {
  'New Leads': { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  'Qualified': { bg: 'rgba(168, 85, 247, 0.12)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  'Proposal Sent': { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  'Negotiation': { bg: 'rgba(234, 88, 12, 0.12)', text: '#ea580c', border: 'rgba(234, 88, 12, 0.3)' },
  'Won Deals': { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  'Lost Deals': { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
};

export default function OpportunitiesPage({ showToast, onNavigateQuotations, currentUser }) {
  const {
    columns: oppColumns,
    visibleColumns: visibleOppCols,
    isColumnVisible: isOppColVisible,
    toggleColumn: toggleOppCol,
    resetToDefaults: resetOppCols,
    showAllColumns: showAllOppCols
  } = useColumnVisibility('crm_cols_opportunities', OPPORTUNITY_COLUMNS);
  // Data state
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Masters data for dropdown dependencies
  const [principals, setPrincipals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // UI view controls - Default to AG Grid Advanced view!
  const [viewMode, setViewMode] = useState('aggrid'); // 'aggrid' (default), 'list', or 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('All Stages');
  const [selectedPrincipalFilter, setSelectedPrincipalFilter] = useState('All Principals');
  const [selectedLeadSourceFilter, setSelectedLeadSourceFilter] = useState('All Sources');
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1); // 1, 2, or 3
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // View Details Modal State
  const [viewDetailsOpp, setViewDetailsOpp] = useState(null);
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState(null);

  // Form State
  const initialFormState = {
    // Tab 1: Section 1
    opportunityName: '',
    principalBrand: '',
    customerClient: '',
    contactPerson: '',
    leadSource: '',
    assignedSalesperson: '',
    stage: 'New Leads',
    dealValue: '',
    leadDate: new Date().toISOString().split('T')[0],
    expectedClosureDate: '',
    isNewClientAcquisition: false,

    // Tab 1: Section 2
    technicalRequirements: '',

    // Tab 1: Section 3
    competitorBrandName: '',
    competitorModelOffering: '',
    competitorEstimatedPrice: '',
    competitorThreatLevel: '',
    competitorWeaknesses: '',
    competitorKeyStrengths: '',
    winLossRationale: '',

    // Tab 2: Machines / Products
    machines: [],

    // Tab 3: Commercial Quotations
    autoGenerateQuote: false
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch Master Data on Mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        // 1. Principals
        const princData = await api.getMasterItems('principals');
        if (Array.isArray(princData)) {
          setPrincipals(princData);
        }

        // 2. Customers
        const custData = await api.getCustomers();
        const custList = Array.isArray(custData) ? custData : (custData?.customers || []);
        setCustomers(custList);

        // 3. Contact Persons
        const contactsData = await api.getContactPersons();
        const contactList = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || contactsData?.contactPersons || []);
        setContactPersons(contactList);

        // 4. Employees with Sales department strictly
        const empData = await api.getEmployees();
        const allEmps = Array.isArray(empData) ? empData : (empData?.employees || []);
        const salesOnly = allEmps.filter(e => 
          e.department && e.department.toLowerCase().includes('sales')
        );
        setSalesEmployees(salesOnly);

        // 5. Products Master
        const prodData = await api.getMasterItems('products');
        if (Array.isArray(prodData)) {
          setAllProducts(prodData);
        }
      } catch (err) {
        console.warn('Could not load some masters for opportunities:', err.message);
      }
    };

    loadMasters();
  }, []);

  // Fetch Opportunities from Backend
  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.getOpportunities({
        search: searchQuery,
        stage: selectedStageFilter,
        principal: selectedPrincipalFilter
      });
      if (res && res.success) {
        setOpportunities(res.opportunities || []);
        setStats(res.stats || null);
      }
    } catch (err) {
      showToast?.('Error loading opportunities: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [selectedPrincipalFilter]);

  // Locally filtered opportunities for fast responsive UI
  const filteredOpportunities = useMemo(() => {
    return (opportunities || []).filter(opp => {
      // Stage filter
      if (selectedStageFilter !== 'All Stages' && opp.stage !== selectedStageFilter) {
        return false;
      }
      // Principal filter
      if (selectedPrincipalFilter !== 'All Principals' && opp.principalBrand !== selectedPrincipalFilter) {
        return false;
      }
      // Lead Source filter
      if (selectedLeadSourceFilter !== 'All Sources' && opp.leadSource !== selectedLeadSourceFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (opp.opportunityCode || '').toLowerCase();
        const name = (opp.opportunityName || '').toLowerCase();
        const cust = (opp.customerClient || '').toLowerCase();
        const contact = (opp.contactPerson || '').toLowerCase();
        const brand = (opp.principalBrand || '').toLowerCase();
        const rep = (opp.assignedSalesperson || '').toLowerCase();
        const src = (opp.leadSource || '').toLowerCase();
        return code.includes(q) || name.includes(q) || cust.includes(q) || contact.includes(q) || brand.includes(q) || rep.includes(q) || src.includes(q);
      }
      return true;
    });
  }, [opportunities, selectedStageFilter, selectedPrincipalFilter, selectedLeadSourceFilter, searchQuery]);

  // Stage breakdown statistics
  const stageStats = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach(st => {
      map[st] = { count: 0, totalValue: 0 };
    });
    (opportunities || []).forEach(opp => {
      if (map[opp.stage]) {
        map[opp.stage].count += 1;
        map[opp.stage].totalValue += (Number(opp.dealValue) || 0);
      }
    });
    return map;
  }, [opportunities]);

  // Derived filtered contact persons based on selected Customer Client in Tab 1
  const availableContactPersons = useMemo(() => {
    if (!formData.customerClient) return [];
    return contactPersons.filter(cp => 
      cp.customerOrganizationName && 
      cp.customerOrganizationName.trim().toLowerCase() === formData.customerClient.trim().toLowerCase()
    );
  }, [contactPersons, formData.customerClient]);

  // Derived filtered products based on selected Principal Brand in Tab 1
  const availableProductsForPrincipal = useMemo(() => {
    if (!formData.principalBrand) return [];
    return allProducts.filter(p => 
      p.principal && 
      p.principal.trim().toLowerCase() === formData.principalBrand.trim().toLowerCase()
    );
  }, [allProducts, formData.principalBrand]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      ...initialFormState,
      assignedSalesperson: '',
      principalBrand: '',
      leadDate: new Date().toISOString().split('T')[0]
    });
    setIsEditMode(false);
    setEditingId(null);
    setActiveTab(1);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (opp) => {
    setFormData({
      opportunityName: opp.opportunityName || '',
      principalBrand: opp.principalBrand || '',
      customerClient: opp.customerClient || '',
      contactPerson: opp.contactPerson || '',
      leadSource: opp.leadSource || '',
      assignedSalesperson: opp.assignedSalesperson || '',
      stage: opp.stage || 'New Leads',
      dealValue: opp.dealValue || '',
      leadDate: opp.leadDate || '',
      expectedClosureDate: opp.expectedClosureDate || '',
      isNewClientAcquisition: Boolean(opp.isNewClientAcquisition),

      technicalRequirements: opp.technicalRequirements || '',

      competitorBrandName: opp.competitorInfo?.brandName || '',
      competitorModelOffering: opp.competitorInfo?.modelOffering || '',
      competitorEstimatedPrice: opp.competitorInfo?.estimatedPrice || '',
      competitorThreatLevel: opp.competitorInfo?.threatLevel || '',
      competitorWeaknesses: opp.competitorInfo?.weaknessesWinningEdge || '',
      competitorKeyStrengths: opp.competitorInfo?.keyStrengthsPitch || '',
      winLossRationale: opp.competitorInfo?.winLossRationale || '',

      machines: (opp.machines || []).map(m => ({
        productId: m.productId || '',
        productCode: m.productCode || '',
        productName: m.productName || '',
        category: m.category || '',
        principal: m.principal || opp.principalBrand || '',
        unitPrice: m.unitPrice || 0,
        quantity: m.quantity || 1,
        totalPrice: m.totalPrice || (m.unitPrice * m.quantity) || 0,
        notes: m.notes || ''
      })),

      autoGenerateQuote: Boolean(opp.autoGenerateQuote)
    });

    setIsEditMode(true);
    setEditingId(opp._id);
    setActiveTab(1);
    setIsModalOpen(true);
  };

  // Customer selection change in Tab 1
  const handleCustomerChange = (selectedCustName) => {
    const matchingCust = customers.find(c => c.organizationName === selectedCustName);
    const relatedContacts = contactPersons.filter(cp => 
      cp.customerOrganizationName && 
      cp.customerOrganizationName.trim().toLowerCase() === selectedCustName.trim().toLowerCase()
    );

    // Auto-select primary contact or first contact
    let defaultContact = matchingCust?.primaryContactPerson || '';
    if (!defaultContact && relatedContacts.length > 0) {
      defaultContact = relatedContacts[0].name;
    }

    setFormData(prev => ({
      ...prev,
      customerClient: selectedCustName,
      contactPerson: defaultContact,
      isNewClientAcquisition: matchingCust?.customerType === 'Prospect'
    }));
  };

  // Tab 2: Add Machine Row
  const handleAddMachineRow = () => {
    if (!formData.principalBrand) {
      showToast?.('⚠️ Please select a Principal / Manufacturer Brand in Tab 1 first.');
      setActiveTab(1);
      return;
    }

    const firstProd = availableProductsForPrincipal[0];

    const newMachine = {
      productId: firstProd?._id || '',
      productCode: firstProd?.code || '',
      productName: firstProd?.productName || 'Select Product',
      category: firstProd?.category || '',
      principal: formData.principalBrand,
      unitPrice: Number(firstProd?.unitPrice) || 0,
      quantity: 1,
      totalPrice: Number(firstProd?.unitPrice) || 0,
      notes: ''
    };

    setFormData(prev => {
      const updatedMachines = [...prev.machines, newMachine];
      // Auto-update deal value if empty or matches subtotal
      const newSubtotal = updatedMachines.reduce((sum, m) => sum + m.totalPrice, 0);
      return {
        ...prev,
        machines: updatedMachines,
        dealValue: prev.dealValue ? prev.dealValue : newSubtotal
      };
    });
  };

  // Tab 2: Update Machine Row
  const handleUpdateMachineRow = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.machines];
      const target = { ...updated[index] };

      if (field === 'productName') {
        const prod = availableProductsForPrincipal.find(p => p.productName === value);
        if (prod) {
          target.productId = prod._id;
          target.productCode = prod.code;
          target.productName = prod.productName;
          target.category = prod.category;
          target.principal = prod.principal || prev.principalBrand;
          target.unitPrice = Number(prod.unitPrice) || 0;
          target.totalPrice = (Number(prod.unitPrice) || 0) * (Number(target.quantity) || 1);
        } else {
          target.productName = value;
        }
      } else if (field === 'quantity') {
        const qty = Math.max(1, parseInt(value) || 1);
        target.quantity = qty;
        target.totalPrice = (Number(target.unitPrice) || 0) * qty;
      } else if (field === 'unitPrice') {
        const price = Math.max(0, parseFloat(value) || 0);
        target.unitPrice = price;
        target.totalPrice = price * (Number(target.quantity) || 1);
      } else {
        target[field] = value;
      }

      updated[index] = target;

      // Calculate total
      const newTotal = updated.reduce((s, m) => s + m.totalPrice, 0);
      return {
        ...prev,
        machines: updated,
        dealValue: prev.dealValue && !prev.dealValueManuallyOverridden ? newTotal : prev.dealValue || newTotal
      };
    });
  };

  // Tab 2: Remove Machine Row
  const handleRemoveMachineRow = (index) => {
    setFormData(prev => {
      const updated = prev.machines.filter((_, idx) => idx !== index);
      return { ...prev, machines: updated };
    });
  };

  // Live Machine Subtotal
  const machineSubtotal = useMemo(() => {
    return (formData.machines || []).reduce((sum, m) => sum + (Number(m.totalPrice) || 0), 0);
  }, [formData.machines]);

  const machineGst18 = Math.round(machineSubtotal * 0.18);
  const machineGrandTotal = machineSubtotal + machineGst18;

  // Submit Handler
  const handleSubmitOpportunity = async (e) => {
    e.preventDefault();

    if (!formData.opportunityName.trim()) {
      showToast?.('Please enter Opportunity Name / Requirement Title.');
      setActiveTab(1);
      return;
    }
    if (!formData.principalBrand) {
      showToast?.('Please select Principal / Manufacturer Brand.');
      setActiveTab(1);
      return;
    }
    if (!formData.customerClient) {
      showToast?.('Please select Customer Client.');
      setActiveTab(1);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        opportunityName: formData.opportunityName.trim(),
        principalBrand: formData.principalBrand,
        customerClient: formData.customerClient,
        contactPerson: formData.contactPerson,
        leadSource: formData.leadSource,
        assignedSalesperson: formData.assignedSalesperson,
        stage: formData.stage,
        dealValue: Number(formData.dealValue) || machineSubtotal || 0,
        leadDate: formData.leadDate,
        expectedClosureDate: formData.expectedClosureDate,
        isNewClientAcquisition: formData.isNewClientAcquisition,

        technicalRequirements: formData.technicalRequirements,

        competitorInfo: {
          brandName: formData.competitorBrandName,
          modelOffering: formData.competitorModelOffering,
          estimatedPrice: Number(formData.competitorEstimatedPrice) || 0,
          threatLevel: formData.competitorThreatLevel,
          weaknessesWinningEdge: formData.competitorWeaknesses,
          keyStrengthsPitch: formData.competitorKeyStrengths,
          winLossRationale: formData.winLossRationale
        },

        machines: formData.machines,
        autoGenerateQuote: formData.autoGenerateQuote
      };

      let res;
      if (isEditMode) {
        res = await api.updateOpportunity(editingId, payload);
      } else {
        res = await api.createOpportunity(payload);
      }

      if (res && res.success) {
        showToast?.(isEditMode ? 'Opportunity updated successfully!' : 'New Opportunity created with pipeline registration!');
        setIsModalOpen(false);
        loadOpportunities();
      } else {
        showToast?.('Error: ' + (res?.message || 'Could not save opportunity'));
      }
    } catch (err) {
      showToast?.('Save error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quick Stage Transition
  const handleQuickStageChange = async (oppId, nextStage) => {
    try {
      const res = await api.updateOpportunityStage(oppId, nextStage);
      if (res && res.success) {
        showToast?.(`Stage updated to ${nextStage}`);
        loadOpportunities();
      }
    } catch (err) {
      showToast?.('Stage update error: ' + err.message);
    }
  };

  // Delete Opportunity
  const handleDeleteOpportunity = async (opp) => {
    if (window.confirm(`Are you sure you want to delete opportunity "${opp.opportunityCode} - ${opp.opportunityName}"?`)) {
      try {
        const res = await api.deleteOpportunity(opp._id);
        if (res && res.success) {
          showToast?.(`Opportunity ${opp.opportunityCode} deleted.`);
          loadOpportunities();
        }
      } catch (err) {
        showToast?.('Delete error: ' + err.message);
      }
    }
  };

  // Currency Formatter
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
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
      field: 'opportunityCode',
      headerName: 'Opportunity Code & Title',
      flex: 1.3,
      minWidth: 210,
      cellRenderer: (params) => {
        const opp = params.data;
        if (!opp) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.25' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.86rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {opp.title || opp.opportunityName}
            </span>
            {opp.opportunityCode && (
              <div style={{ marginTop: '2px' }}>
                <span className="crm-code-pill">{opp.opportunityCode}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      field: 'customerClient',
      headerName: 'Customer Client',
      flex: 1.2,
      minWidth: 200,
      valueGetter: (params) => params.data?.customerClient || params.data?.customerName || '—',
      cellRenderer: (params) => {
        const val = params.value;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Building2 size={13} color="var(--primary-600)" />
            <span>{val}</span>
          </div>
        );
      }
    },
    {
      field: 'principalBrand',
      headerName: 'Principal OEM Brand',
      minWidth: 160,
      valueGetter: (params) => params.data?.principalBrand || params.data?.principalName || '—'
    },
    {
      field: 'dealValue',
      headerName: 'Deal Value (₹)',
      type: 'currency',
      minWidth: 150,
      cellRenderer: (params) => {
        const val = Number(params.value || 0);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>
              ₹ {val.toLocaleString('en-IN')}
            </span>
          </div>
        );
      }
    },
    {
      field: 'stage',
      headerName: 'Pipeline Stage',
      minWidth: 160,
      valueGetter: (params) => params.data?.stage || params.data?.pipelineStage || 'New Leads',
      cellRenderer: (params) => {
        const st = params.value;
        const stColor = STAGE_COLORS[st] || { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: stColor.bg,
            color: stColor.text,
            border: `1px solid ${stColor.border}`
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stColor.text }} />
            {st}
          </span>
        );
      }
    },
    {
      field: 'assignedSalesperson',
      headerName: 'Assigned Salesperson',
      minWidth: 160
    },
    {
      field: 'leadSource',
      headerName: 'Lead Source',
      minWidth: 140
    },
    {
      field: 'expectedClosureDate',
      headerName: 'Expected Closing',
      type: 'date',
      minWidth: 130
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      pinned: 'right',
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const opp = params.data;
        if (!opp) return null;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <button
              onClick={() => setViewDetailsOpp(opp)}
              className="crm-action-icon-btn btn-view"
              title="View Details"
            >
              <Eye size={13} />
            </button>
            <button
              onClick={() => handleOpenEditModal(opp)}
              className="crm-action-icon-btn btn-edit"
              title="Edit Opportunity"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => handleDeleteOpportunity(opp)}
              className="crm-action-icon-btn btn-delete"
              title="Delete Opportunity"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="page-body animate-fade-in" style={{ padding: '24px 32px' }}>
      {/* Page Header */}
      {/* 1. Page Header matching Customers & Employees layout */}
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
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              color: '#fff'
            }}>
              <Briefcase size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Opportunities &amp; Sales Pipeline
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Track machinery deals, OEM principal requirements, sales stages, competitor threats, and commercial quotations
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNavigateQuotations && (
            <button
              onClick={onNavigateQuotations}
              className="btn btn-secondary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '9px 18px',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Go to Quotations & Revisions Management"
            >
              <FileSpreadsheet size={16} />
              <span>Quotations & Revisions</span>
            </button>
          )}

          <button
            onClick={loadOpportunities}
            className="btn btn-secondary"
            style={{ borderRadius: 'var(--radius-full)', padding: '9px 16px', gap: '6px' }}
            title="Refresh Opportunities & Pipeline"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-create-opportunity"
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '9px 20px', gap: '8px' }}
          >
            <PlusCircle size={18} />
            <span>Add Opportunity</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Pipeline Value */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Pipeline Value
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
              {formatINR(stats?.totalPipelineValue || 0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {stats?.activeDealsCount || 0} Open Active Deals
            </div>
          </div>
        </div>

        {/* Won Orders Revenue */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Won Orders Revenue
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {formatINR(stats?.wonDealsValue || 0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '1px', fontWeight: 600 }}>
              {stats?.wonDealsCount || 0} Deals Won • Win Rate {stats?.winRate || 0}%
            </div>
          </div>
        </div>

        {/* Closing Stages */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Proposal &amp; Negotiation
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
              {(stats?.stageBreakdown?.['Proposal Sent'] || 0) + (stats?.stageBreakdown?.['Negotiation'] || 0)} Deals
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              High-probability closing phase
            </div>
          </div>
        </div>

        {/* OEM Principals Represented */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#faf5ff',
            border: '1px solid #e9d5ff',
            color: '#9333ea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              OEM Brands
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#9333ea', marginTop: '2px' }}>
              {principals.length} Principals
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              Authorized Machinery Portfolios
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pipeline Funnel Conversion Strip (Interactive) */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--primary-600)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Sales Pipeline Funnel &amp; Stage Velocity
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Click any stage block below to filter the datalist table
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px'
        }}>
          {PIPELINE_STAGES.map((st) => {
            const stColor = STAGE_COLORS[st];
            const data = stageStats[st] || { count: 0, totalValue: 0 };
            const isSelected = selectedStageFilter === st;

            return (
              <div
                key={st}
                onClick={() => setSelectedStageFilter(isSelected ? 'All Stages' : st)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${stColor.text}` : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? stColor.bg : 'var(--bg-main)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: stColor.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stColor.text }} />
                    {st}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#fff' : 'rgba(0,0,0,0.06)',
                    color: stColor.text
                  }}>
                    {data.count}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {formatINR(data.totalValue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Search & Filter Toolstrip Card */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="opportunity-search-input"
              type="text"
              placeholder="Search by deal title, code, customer, principal, rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.875rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Principal Brand Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Brand:
              </span>
              <select
                id="filter-principal-select"
                className="form-control"
                value={selectedPrincipalFilter}
                onChange={(e) => setSelectedPrincipalFilter(e.target.value)}
                style={{ height: '36px', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '8px', minWidth: '150px' }}
              >
                <option value="All Principals">All OEM Brands</option>
                {principals.map(p => (
                  <option key={p._id || p.code} value={p.principalName}>{p.principalName}</option>
                ))}
              </select>
            </div>

            {/* Lead Source Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Source:
              </span>
              <select
                id="filter-lead-source-select"
                className="form-control"
                value={selectedLeadSourceFilter}
                onChange={(e) => setSelectedLeadSourceFilter(e.target.value)}
                style={{ height: '36px', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '8px', minWidth: '140px' }}
              >
                <option value="All Sources">All Lead Sources</option>
                {LEAD_SOURCES.map(ls => (
                  <option key={ls} value={ls}>{ls}</option>
                ))}
              </select>
            </div>

            {/* Clear All Filters button */}
            {(selectedStageFilter !== 'All Stages' || selectedPrincipalFilter !== 'All Principals' || selectedLeadSourceFilter !== 'All Sources' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStageFilter('All Stages');
                  setSelectedPrincipalFilter('All Principals');
                  setSelectedLeadSourceFilter('All Sources');
                  setSearchQuery('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ height: '36px', fontSize: '0.75rem', padding: '0 12px', borderRadius: '8px' }}
              >
                Reset
              </button>
            )}

            {/* Column Visibility Customizer Dropdown */}
            {viewMode === 'list' && (
              <ColumnVisibilityDropdown
                columns={oppColumns}
                visibleColumns={visibleOppCols}
                onToggle={toggleOppCol}
                onReset={resetOppCols}
                onShowAll={showAllOppCols}
              />
            )}

            {/* Export to Excel Button */}
            <ExportExcelButton
              data={filteredOpportunities}
              columns={OPPORTUNITY_EXPORT_COLUMNS}
              filename="Opportunities_Pipeline"
              sheetName="Opportunities"
              showToast={showToast}
            />
          </div>
        </div>
      </div>

      {/* Main View: AG Grid vs Kanban vs Standard List Table */}
      {viewMode === 'aggrid' ? (
        <AdvancedDataGrid
          gridId="crm_opportunities_grid"
          title="Sales Opportunities Pipeline"
          subtitle="Deal pipeline with columns manager, multi-filters, formatters, chart visualizer, pivoting, and reporting"
          rowData={opportunities}
          columnDefs={agGridColumnDefs}
          isLoading={loading}
          onRefresh={loadOpportunities}
          currentUser={currentUser?.email || currentUser?.username || 'admin'}
          showToast={showToast}
          exportFilename="Opportunities_Pipeline"
          defaultPageSize={25}
          primaryAction={{
            label: 'Add Opportunity',
            onClick: handleOpenCreateModal,
            id: 'ag-primary-add-opp'
          }}
        />
      ) : viewMode === 'kanban' ? (
        /* Kanban Pipeline Board */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(280px, 1fr))',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '20px'
        }}>
          {PIPELINE_STAGES.map(stageName => {
            const stageOpps = opportunities.filter(o => o.stage === stageName);
            const stageTotal = stageOpps.reduce((sum, o) => sum + (Number(o.dealValue) || 0), 0);
            const colStyle = STAGE_COLORS[stageName];

            return (
              <div 
                key={stageName}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${colStyle.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 340px)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: colStyle.bg,
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: colStyle.text }}>
                      {stageName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatINR(stageTotal)}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: colStyle.text,
                    border: `1px solid ${colStyle.border}`
                  }}>
                    {stageOpps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1
                }}>
                  {stageOpps.length === 0 ? (
                    <div style={{
                      padding: '30px 10px',
                      textAlign: 'center',
                      color: 'var(--text-light)',
                      fontSize: '0.78rem',
                      fontStyle: 'italic'
                    }}>
                      No deals in {stageName}
                    </div>
                  ) : (
                    stageOpps.map(opp => (
                      <div
                        key={opp._id}
                        style={{
                          backgroundColor: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          padding: '14px',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Top: Code & OEM Brand */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                            {opp.opportunityCode}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(139, 92, 246, 0.12)',
                            color: '#8b5cf6'
                          }}>
                            {opp.principalBrand}
                          </span>
                        </div>

                        {/* Opportunity Title */}
                        <h4 style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '6px',
                          lineHeight: 1.3
                        }}>
                          {opp.opportunityName}
                        </h4>

                        {/* Customer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <Building2 size={13} color="var(--primary-600)" />
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opp.customerClient}
                          </span>
                        </div>

                        {/* Contact Person */}
                        {opp.contactPerson && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: '10px' }}>
                            <User size={12} />
                            <span>{opp.contactPerson}</span>
                          </div>
                        )}

                        {/* Deal Value & Machines Count */}
                        <div style={{
                          padding: '8px 10px',
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '10px'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 600 }}>VALUE</div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {formatINR(opp.dealValue)}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary-600)', fontWeight: 700, backgroundColor: 'var(--primary-50)', padding: '2px 6px', borderRadius: '6px' }}>
                            {opp.machines?.length || 0} Machines
                          </span>
                        </div>

                        {/* Quotation Status & Threat Level Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {opp.quotations && opp.quotations.length > 0 && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid #a7f3d0'
                            }}>
                              Quote {opp.quotations[0].revision} (₹{formatINR(opp.quotations[0].grandTotal)})
                            </span>
                          )}

                          {opp.isNewClientAcquisition && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#2563eb',
                              backgroundColor: '#eff6ff',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)'
                            }}>
                              New Client
                            </span>
                          )}
                        </div>

                        {/* Bottom Row: Sales Rep & Action Buttons */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '8px'
                        }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            👤 {opp.assignedSalesperson?.split(' ')[0] || 'Unassigned'}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              title="View Details"
                              onClick={() => setViewDetailsOpp(opp)}
                              style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              title="Edit Opportunity"
                              onClick={() => handleOpenEditModal(opp)}
                              style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)' }}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              title="Delete Opportunity"
                              onClick={() => handleDeleteOpportunity(opp)}
                              style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Quick Stage Mover */}
                        <div style={{ marginTop: '8px' }}>
                          <select
                            value={opp.stage}
                            onChange={(e) => handleQuickStageChange(opp._id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                          >
                            {PIPELINE_STAGES.map(st => (
                              <option key={st} value={st}>Move to: {st}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Upgraded Clean ERP Datalist Table */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                  {isOppColVisible('index') && <th style={{ padding: '14px 16px', width: '55px' }}>#</th>}
                  {isOppColVisible('opportunity') && <th style={{ padding: '14px 16px', minWidth: '220px' }}>Opportunity Code &amp; Title</th>}
                  {isOppColVisible('customer') && <th style={{ padding: '14px 16px', minWidth: '180px' }}>Customer Client</th>}
                  {isOppColVisible('principal') && <th style={{ padding: '14px 16px', minWidth: '150px' }}>Principal OEM Brand</th>}
                  {isOppColVisible('dealValue') && <th style={{ padding: '14px 16px', minWidth: '130px' }}>Deal Value (₹)</th>}
                  {isOppColVisible('stage') && <th style={{ padding: '14px 16px', minWidth: '165px' }}>Pipeline Stage</th>}
                  {isOppColVisible('quotation') && <th style={{ padding: '14px 16px', minWidth: '140px' }}>Quotation (Rev)</th>}
                  {isOppColVisible('salesperson') && <th style={{ padding: '14px 16px', minWidth: '150px' }}>Assigned Salesperson</th>}
                  {isOppColVisible('actions') && <th style={{ padding: '14px 16px', textAlign: 'right', minWidth: '120px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={visibleOppCols.length} style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={36} color="var(--border-strong)" />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          No Opportunities Found
                        </div>
                        <div style={{ fontSize: '0.8rem', maxWidth: '340px' }}>
                          {searchQuery || selectedStageFilter !== 'All Stages' || selectedPrincipalFilter !== 'All Principals'
                            ? 'No deals match your search criteria. Try resetting filters.'
                            : 'Click "+ Add Opportunity" above to register your first machinery deal in the pipeline.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp, index) => {
                    const stColor = STAGE_COLORS[opp.stage] || STAGE_COLORS['New Leads'];
                    const isExpanded = expandedRowId === opp._id;
                    const latestQuote = opp.quotations && opp.quotations.length > 0 ? opp.quotations[0] : null;

                    return (
                      <React.Fragment key={opp._id || index}>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            backgroundColor: isExpanded ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* S.No + Expand Accordion Toggle */}
                          {isOppColVisible('index') && (
                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => setExpandedRowId(isExpanded ? null : opp._id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    color: isExpanded ? 'var(--primary-600)' : 'var(--text-muted)',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                  title={isExpanded ? 'Collapse details' : 'Expand full details'}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <span>{index + 1}</span>
                              </div>
                            </td>
                          )}

                          {/* Opportunity Code & Requirement Title */}
                          {isOppColVisible('opportunity') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-main)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--primary-700)'
                                  }}>
                                    {opp.opportunityCode}
                                  </span>
                                  {opp.isNewClientAcquisition && (
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      padding: '2px 7px',
                                      borderRadius: '12px',
                                      backgroundColor: '#eff6ff',
                                      color: '#2563eb',
                                      border: '1px solid #bfdbfe'
                                    }}>
                                      ⭐ First-Time Client
                                    </span>
                                  )}
                                </div>

                                <div
                                  onClick={() => setViewDetailsOpp(opp)}
                                  style={{
                                    fontWeight: 700,
                                    color: 'var(--text-main)',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'color 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-600)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                                >
                                  {opp.opportunityName}
                                </div>

                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span>📅 Target: <strong>{opp.expectedClosureDate || 'Not set'}</strong></span>
                                  <span>•</span>
                                  <span>Lead: {opp.leadDate || 'Today'}</span>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Customer Client & Contact Person */}
                          {isOppColVisible('customer') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Building2 size={15} color="var(--primary-600)" />
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {opp.customerClient}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <User size={13} color="var(--text-light)" />
                                <span>{opp.contactPerson || 'No contact assigned'}</span>
                              </div>
                            </td>
                          )}

                          {/* Principal / OEM Brand */}
                          {isOppColVisible('principal') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(139, 92, 246, 0.08)',
                                border: '1px solid rgba(139, 92, 246, 0.25)',
                                color: '#7c3aed',
                                fontWeight: 700,
                                fontSize: '0.8rem'
                              }}>
                                <Award size={13} />
                                <span>{opp.principalBrand}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {opp.machines?.length || 0} Machinery Model{opp.machines?.length === 1 ? '' : 's'}
                              </div>
                            </td>
                          )}

                          {/* Estimated Deal Value (₹) */}
                          {isOppColVisible('dealValue') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {formatINR(opp.dealValue)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                {opp.machines?.length > 0 ? 'Machine BOM Total' : 'Estimated Value'}
                              </div>
                            </td>
                          )}

                          {/* Sales Pipeline Stage & Quick Move */}
                          {isOppColVisible('stage') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                <span style={{
                                  padding: '3px 9px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: stColor.bg,
                                  color: stColor.text,
                                  border: `1px solid ${stColor.border}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stColor.text }} />
                                  {opp.stage}
                                </span>
                              </div>

                              {/* Quick Stage Dropdown */}
                              <div>
                                <select
                                  value={opp.stage}
                                  onChange={(e) => handleQuickStageChange(opp._id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.72rem',
                                    padding: '3px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    backgroundColor: 'var(--bg-main)',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer'
                                  }}
                                  title="Quick advance pipeline stage"
                                >
                                  {PIPELINE_STAGES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          )}

                          {/* Commercial Quotation (Rev) */}
                          {isOppColVisible('quotation') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              {latestQuote ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      backgroundColor: '#ecfdf5',
                                      color: '#059669',
                                      border: '1px solid #a7f3d0'
                                    }}>
                                      {latestQuote.revision}
                                    </span>
                                    <button
                                      onClick={() => setSelectedQuoteForPrint(latestQuote)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary-600)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'inline-flex',
                                        alignItems: 'center'
                                      }}
                                      title="View Quotation breakdown"
                                    >
                                      <FileText size={13} />
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }}>
                                    {formatINR(latestQuote.grandTotal)}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>
                                    Incl. 18% GST ({latestQuote.status})
                                  </div>
                                </div>
                              ) : (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  backgroundColor: 'var(--bg-main)',
                                  color: 'var(--text-light)',
                                  border: '1px solid var(--border-subtle)'
                                }}>
                                  Pending Rev 0
                                </span>
                              )}
                            </td>
                          )}

                          {/* Sales Rep & Lead Source */}
                          {isOppColVisible('salesperson') && (
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary-100)',
                                  color: 'var(--primary-800)',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {opp.assignedSalesperson ? opp.assignedSalesperson.charAt(0) : 'S'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                    {opp.assignedSalesperson || 'Unassigned'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                    {opp.leadSource}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          {isOppColVisible('actions') && (
                            <td style={{ padding: '14px 16px', textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => setViewDetailsOpp(opp)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '6px 9px', borderRadius: '6px' }}
                                  title="View Opportunity Details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(opp)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '6px 9px', borderRadius: '6px' }}
                                  title="Edit Opportunity"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOpportunity(opp)}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete Opportunity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Inline Expandable Accordion Row for Fast Inspection */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                            <td colSpan={visibleOppCols.length} style={{ padding: '18px 24px', borderBottom: '2px solid var(--border-subtle)' }}>
                              <div style={{
                                backgroundColor: 'var(--bg-card)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-subtle)',
                                padding: '18px 20px',
                                boxShadow: 'var(--shadow-sm)'
                              }}>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                  gap: '18px'
                                }}>
                                  {/* Machinery Line Items (Tab 2) */}
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <Award size={15} color="var(--primary-600)" />
                                      <span>Configured Machinery BOM (Tab 2)</span>
                                    </div>
                                    {opp.machines && opp.machines.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {opp.machines.map((m, mIdx) => (
                                          <div key={mIdx} style={{
                                            padding: '8px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--bg-main)',
                                            border: '1px solid var(--border-subtle)',
                                            fontSize: '0.78rem'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                              <span>{m.productName}</span>
                                              <span>{formatINR(m.totalPrice)}</span>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                                              Qty: {m.quantity} × {formatINR(m.unitPrice)}
                                              {m.notes && ` • ${m.notes}`}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                        No machinery items configured yet.
                                      </div>
                                    )}
                                  </div>

                                  {/* Technical Scope & Customer Requirements (Tab 1 Sec 2) */}
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <FileText size={15} color="#2563eb" />
                                      <span>Technical Requirements (Tab 1 Sec 2)</span>
                                    </div>
                                    <div style={{
                                      padding: '10px 12px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--bg-main)',
                                      border: '1px solid var(--border-subtle)',
                                      fontSize: '0.78rem',
                                      color: 'var(--text-muted)',
                                      lineHeight: 1.45,
                                      minHeight: '60px'
                                    }}>
                                      {opp.technicalRequirements || 'No specific technical specifications entered.'}
                                    </div>
                                  </div>

                                  {/* Competitor Intelligence (Tab 1 Sec 3) */}
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <ShieldAlert size={15} color="#ea580c" />
                                      <span>Competitor Intelligence (Tab 1 Sec 3)</span>
                                    </div>
                                    <div style={{
                                      padding: '10px 12px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--bg-main)',
                                      border: '1px solid var(--border-subtle)',
                                      fontSize: '0.78rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px'
                                    }}>
                                      <div>
                                        <strong>Rival Brand:</strong> {opp.competitorInfo?.brandName || 'Not specified'}
                                        {opp.competitorInfo?.modelOffering && ` (${opp.competitorInfo.modelOffering})`}
                                      </div>
                                      <div>
                                        <strong>Quoted Price:</strong> {opp.competitorInfo?.estimatedPrice ? formatINR(opp.competitorInfo.estimatedPrice) : 'N/A'}
                                      </div>
                                      <div>
                                        <strong>Threat Level:</strong> {opp.competitorInfo?.threatLevel || '🟢 Low Threat'}
                                      </div>
                                      {opp.competitorInfo?.weaknessesWinningEdge && (
                                        <div style={{ color: 'var(--primary-700)', marginTop: '2px' }}>
                                          <strong>Our Edge:</strong> {opp.competitorInfo.weaknessesWinningEdge}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Commercial Quotation Overview (Tab 3) */}
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <FileSpreadsheet size={15} color="#059669" />
                                      <span>Quotation Rev 0 Details (Tab 3)</span>
                                    </div>
                                    {latestQuote ? (
                                      <div style={{
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: 'var(--bg-main)',
                                        border: '1px solid var(--border-subtle)',
                                        fontSize: '0.78rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span>Quote #:</span>
                                          <strong>{latestQuote.quoteNumber}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span>Subtotal:</span>
                                          <span>{formatINR(latestQuote.subtotal)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                                          <span>GST (18%):</span>
                                          <span>+{formatINR(latestQuote.gstAmount)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', fontWeight: 800 }}>
                                          <span>Grand Total:</span>
                                          <span>{formatINR(latestQuote.grandTotal)}</span>
                                        </div>
                                        <div style={{ marginTop: '4px', textAlign: 'right' }}>
                                          <button
                                            onClick={() => setSelectedQuoteForPrint(latestQuote)}
                                            className="btn btn-secondary btn-sm"
                                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                          >
                                            <Printer size={12} />
                                            <span>Full Quotation</span>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                        No quotation generated yet.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          3-TAB OPPORTUNITY CREATE / EDIT MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '960px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {isEditMode ? `Edit Deal: ${formData.opportunityName}` : 'Register New Opportunity & Pipeline'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Select OEM Principal, Configure Machinery Scope, and Generate Official Quotation
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tab Navigation Bar */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-main)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0 24px'
            }}>
              <button
                type="button"
                id="tab-btn-1"
                onClick={() => setActiveTab(1)}
                style={{
                  padding: '14px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: activeTab === 1 ? '3px solid var(--primary-600)' : '3px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 1 ? 'var(--primary-600)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Tab 1: Deal &amp; Customer Info</span>
              </button>

              <button
                type="button"
                id="tab-btn-2"
                onClick={() => setActiveTab(2)}
                style={{
                  padding: '14px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: activeTab === 2 ? '3px solid var(--primary-600)' : '3px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 2 ? 'var(--primary-600)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Tab 2: Machine / Products</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: activeTab === 2 ? 'var(--primary-600)' : 'var(--border-subtle)',
                  color: activeTab === 2 ? '#fff' : 'var(--text-muted)'
                }}>
                  {formData.machines.length}
                </span>
              </button>

              <button
                type="button"
                id="tab-btn-3"
                onClick={() => setActiveTab(3)}
                style={{
                  padding: '14px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: activeTab === 3 ? '3px solid var(--primary-600)' : '3px solid transparent',
                  backgroundColor: 'transparent',
                  color: activeTab === 3 ? 'var(--primary-600)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Tab 3: Commercial Quotations &amp; Revisions</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: activeTab === 3 ? 'var(--primary-600)' : 'var(--border-subtle)',
                  color: activeTab === 3 ? '#fff' : 'var(--text-muted)'
                }}>
                  {formData.autoGenerateQuote ? 'Rev 0' : '0'}
                </span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitOpportunity} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

                {/* =========================================================================
                    TAB 1: DEAL & CUSTOMER INFO
                    ========================================================================= */}
                {activeTab === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {/* Section 1: Opportunity & Client Information */}
                    <div style={{
                      backgroundColor: 'var(--bg-main)',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-600)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>1</span>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Section 1: Opportunity &amp; Client Information
                        </h4>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        {/* Opportunity Name / Requirement Title */}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Opportunity Name / Requirement Title <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            id="opp-name-input"
                            type="text"
                            className="form-control"
                            placeholder="e.g. 2x Automated Ultrasound Suite for Cardiology Wing"
                            value={formData.opportunityName}
                            onChange={(e) => setFormData({ ...formData, opportunityName: e.target.value })}
                            required
                          />
                        </div>

                        {/* Principal / Manufacturer Brand */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Principal / Manufacturer Brand <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            id="opp-principal-select"
                            className="form-control"
                            value={formData.principalBrand}
                            onChange={(e) => setFormData({ ...formData, principalBrand: e.target.value })}
                            required
                          >
                            <option value="">-- Select OEM Principal Master --</option>
                            {principals.map(p => (
                              <option key={p._id || p.code} value={p.principalName}>
                                {p.principalName} ({p.country || 'Global'})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Customer Client */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Customer Client <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            id="opp-customer-select"
                            className="form-control"
                            value={formData.customerClient}
                            onChange={(e) => handleCustomerChange(e.target.value)}
                            required
                          >
                            <option value="">-- Select Customer Client --</option>
                            {customers.map(c => (
                              <option key={c._id || c.customerCode} value={c.organizationName}>
                                {c.organizationName} - {c.city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Contact Person */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Contact Person <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 500 }}>(Connected to Customer)</span>
                          </label>
                          <select
                            id="opp-contact-select"
                            className="form-control"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          >
                            <option value="">-- Select Contact Person --</option>
                            {availableContactPersons.map(cp => (
                              <option key={cp._id} value={`${cp.name} (${cp.designation})`}>
                                {cp.name} - {cp.designation} {cp.mobileNumber ? `(${cp.mobileNumber})` : ''}
                              </option>
                            ))}
                            {formData.contactPerson && !availableContactPersons.some(cp => `${cp.name} (${cp.designation})` === formData.contactPerson) && (
                              <option value={formData.contactPerson}>{formData.contactPerson}</option>
                            )}
                          </select>
                        </div>

                        {/* Lead Source */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Lead Source <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            id="opp-lead-source-select"
                            className="form-control"
                            value={formData.leadSource}
                            onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                            required
                          >
                            <option value="">-- Select Lead Source --</option>
                            {LEAD_SOURCES.map(ls => (
                              <option key={ls} value={ls}>{ls}</option>
                            ))}
                          </select>
                        </div>

                        {/* Assigned Salesperson (Sales Department) */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Assigned Salesperson <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>(Sales Department)</span>
                          </label>
                          <select
                            id="opp-salesperson-select"
                            className="form-control"
                            value={formData.assignedSalesperson}
                            onChange={(e) => setFormData({ ...formData, assignedSalesperson: e.target.value })}
                          >
                            <option value="">-- Select Sales Executive --</option>
                            {salesEmployees.map(emp => (
                              <option key={emp._id || emp.employeeCode} value={emp.fullName}>
                                {emp.fullName} ({emp.designation} - {emp.branch})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Sales Pipeline Stage */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Sales Pipeline Stage <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <select
                            id="opp-stage-select"
                            className="form-control"
                            value={formData.stage}
                            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                            required
                          >
                            {PIPELINE_STAGES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        {/* Total Estimated Deal Value (₹) */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Total Estimated Deal Value (₹)
                          </label>
                          <input
                            id="opp-deal-value-input"
                            type="number"
                            className="form-control"
                            placeholder="e.g. 900000"
                            value={formData.dealValue}
                            onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                          />
                          {machineSubtotal > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--primary-600)', marginTop: '4px' }}>
                              💡 Machine Subtotal in Tab 2: <strong>{formatINR(machineSubtotal)}</strong>
                            </div>
                          )}
                        </div>

                        {/* Lead Date */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Lead Date
                          </label>
                          <input
                            id="opp-lead-date-input"
                            type="date"
                            className="form-control"
                            value={formData.leadDate}
                            onChange={(e) => setFormData({ ...formData, leadDate: e.target.value })}
                          />
                        </div>

                        {/* Expected Closure Date */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Expected Closure Date
                          </label>
                          <input
                            id="opp-closure-date-input"
                            type="date"
                            className="form-control"
                            value={formData.expectedClosureDate}
                            onChange={(e) => setFormData({ ...formData, expectedClosureDate: e.target.value })}
                          />
                        </div>

                        {/* New Client Acquisition Toggle */}
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                          <label 
                            htmlFor="opp-new-client-toggle"
                            style={{
                              position: 'relative',
                              display: 'inline-block',
                              width: '46px',
                              height: '24px',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              id="opp-new-client-toggle"
                              type="checkbox"
                              checked={formData.isNewClientAcquisition}
                              onChange={(e) => setFormData({ ...formData, isNewClientAcquisition: e.target.checked })}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              inset: 0,
                              backgroundColor: formData.isNewClientAcquisition ? 'var(--primary-600)' : '#cbd5e1',
                              borderRadius: '24px',
                              transition: '0.2s'
                            }}>
                              <span style={{
                                position: 'absolute',
                                height: '18px',
                                width: '18px',
                                left: formData.isNewClientAcquisition ? '25px' : '3px',
                                bottom: '3px',
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                transition: '0.2s'
                              }} />
                            </span>
                          </label>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            New Client Acquisition (First-time Customer)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Technical Scope & Customer Requirements */}
                    <div style={{
                      backgroundColor: 'var(--bg-main)',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-600)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>2</span>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Section 2: Technical Scope &amp; Customer Requirements
                        </h4>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Customer Need / Technical Requirement Specifications
                        </label>
                        <textarea
                          id="opp-technical-reqs"
                          className="form-control"
                          rows="3"
                          placeholder="Describe specific engineering parameters, voltage, throughput capacity, software protocols, site installation prerequisites..."
                          value={formData.technicalRequirements}
                          onChange={(e) => setFormData({ ...formData, technicalRequirements: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Section 3: Competitor Intelligence & Win/Loss Analysis */}
                    <div style={{
                      backgroundColor: 'var(--bg-main)',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-600)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>3</span>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Section 3: Competitor Intelligence &amp; Win/Loss Analysis
                        </h4>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        {/* Competitor Brand / Company Name */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Competitor Brand / Company Name
                          </label>
                          <input
                            id="opp-competitor-brand"
                            type="text"
                            className="form-control"
                            placeholder="e.g. GE Healthcare / Philips / Keyence"
                            value={formData.competitorBrandName}
                            onChange={(e) => setFormData({ ...formData, competitorBrandName: e.target.value })}
                          />
                        </div>

                        {/* Competitor Machine Model / Offering */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Competitor Machine Model / Offering
                          </label>
                          <input
                            id="opp-competitor-model"
                            type="text"
                            className="form-control"
                            placeholder="e.g. Model Logiq P9 / Series IV"
                            value={formData.competitorModelOffering}
                            onChange={(e) => setFormData({ ...formData, competitorModelOffering: e.target.value })}
                          />
                        </div>

                        {/* Competitor Quoted / Estimated Price (₹) */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Competitor Quoted / Estimated Price (₹)
                          </label>
                          <input
                            id="opp-competitor-price"
                            type="number"
                            className="form-control"
                            placeholder="e.g. 950000"
                            value={formData.competitorEstimatedPrice}
                            onChange={(e) => setFormData({ ...formData, competitorEstimatedPrice: e.target.value })}
                          />
                        </div>

                        {/* Competitor Threat Level */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Competitor Threat Level
                          </label>
                          <select
                            id="opp-threat-level-select"
                            className="form-control"
                            value={formData.competitorThreatLevel}
                            onChange={(e) => setFormData({ ...formData, competitorThreatLevel: e.target.value })}
                          >
                            <option value="">-- Select Threat Level --</option>
                            {THREAT_LEVELS.map(tl => (
                              <option key={tl} value={tl}>{tl}</option>
                            ))}
                          </select>
                        </div>

                        {/* Competitor Weaknesses / Our Winning Edge */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Competitor Weaknesses / Our Winning Edge
                          </label>
                          <input
                            id="opp-winning-edge"
                            type="text"
                            className="form-control"
                            placeholder="e.g. High annual maintenance cost; our 3-yr warranty gives edge"
                            value={formData.competitorWeaknesses}
                            onChange={(e) => setFormData({ ...formData, competitorWeaknesses: e.target.value })}
                          />
                        </div>

                        {/* Competitor Key Strengths & Pitch */}
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Competitor Key Strengths &amp; Pitch
                          </label>
                          <input
                            id="opp-competitor-strengths"
                            type="text"
                            className="form-control"
                            placeholder="e.g. Brand legacy, existing supplier to parent group"
                            value={formData.competitorKeyStrengths}
                            onChange={(e) => setFormData({ ...formData, competitorKeyStrengths: e.target.value })}
                          />
                        </div>

                        {/* Win / Loss Analysis & Client Decision Rationale */}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                            Win / Loss Analysis &amp; Client Decision Rationale
                          </label>
                          <input
                            id="opp-winloss-rationale"
                            type="text"
                            className="form-control"
                            placeholder="Key factors guiding client procurement committee decision..."
                            value={formData.winLossRationale}
                            onChange={(e) => setFormData({ ...formData, winLossRationale: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    TAB 2: MACHINE / PRODUCTS (GRID TABLE)
                    ========================================================================= */}
                {activeTab === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header Banner & Add Button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                      backgroundColor: 'var(--bg-main)',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Machine &amp; Product Scope Configuration
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Showing equipment under selected OEM: <strong>{formData.principalBrand || 'None Selected in Tab 1'}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="btn-add-machine-row"
                        onClick={handleAddMachineRow}
                        className="btn btn-primary"
                        style={{ padding: '8px 18px', gap: '8px', fontSize: '0.82rem' }}
                      >
                        <Plus size={16} />
                        <span>Add Machine</span>
                      </button>
                    </div>

                    {/* Notice if no principal selected */}
                    {!formData.principalBrand ? (
                      <div style={{
                        padding: '30px',
                        textAlign: 'center',
                        backgroundColor: '#fef3c7',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #fde68a',
                        color: '#92400e'
                      }}>
                        <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No Principal / OEM Brand Selected</div>
                        <p style={{ fontSize: '0.82rem', margin: '4px 0 12px' }}>
                          Please go to <strong>Tab 1: Deal &amp; Customer Info</strong> and select a Principal / Manufacturer Brand to configure matching machine models.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab(1)}
                          className="btn btn-secondary btn-sm"
                        >
                          Go to Tab 1
                        </button>
                      </div>
                    ) : formData.machines.length === 0 ? (
                      <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-main)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px dashed var(--border-subtle)',
                        color: 'var(--text-muted)'
                      }}>
                        <Layers size={32} color="var(--primary-600)" style={{ marginBottom: '10px' }} />
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                          No Machines Configured Yet
                        </div>
                        <p style={{ fontSize: '0.82rem', maxWidth: '450px', margin: '6px auto 16px' }}>
                          Click the <strong>"Add Machine"</strong> button above to select products from {formData.principalBrand} catalog.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddMachineRow}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus size={15} /> Add First Machine
                        </button>
                      </div>
                    ) : (
                      /* Grid Table of Configured Machines */
                      <div style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)',
                        overflow: 'hidden'
                      }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '12px 14px', width: '38px' }}>#</th>
                                <th style={{ padding: '12px 14px', minWidth: '220px' }}>Product / Machine Name</th>
                                <th style={{ padding: '12px 14px', minWidth: '130px' }}>Category</th>
                                <th style={{ padding: '12px 14px', width: '130px' }}>Unit Price (₹)</th>
                                <th style={{ padding: '12px 14px', width: '90px' }}>Qty</th>
                                <th style={{ padding: '12px 14px', width: '140px' }}>Total Price (₹)</th>
                                <th style={{ padding: '12px 14px', minWidth: '180px' }}>Specs / Notes</th>
                                <th style={{ padding: '12px 14px', width: '50px', textAlign: 'center' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.machines.map((machine, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-light)' }}>
                                    {index + 1}
                                  </td>

                                  {/* Product Dropdown */}
                                  <td style={{ padding: '10px 14px' }}>
                                    <select
                                      id={`machine-select-${index}`}
                                      className="form-control"
                                      value={machine.productName}
                                      onChange={(e) => handleUpdateMachineRow(index, 'productName', e.target.value)}
                                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                                      required
                                    >
                                      <option value="">-- Choose Product --</option>
                                      {availableProductsForPrincipal.map(p => (
                                        <option key={p._id || p.code} value={p.productName}>
                                          {p.productName} ({p.code})
                                        </option>
                                      ))}
                                      {machine.productName && !availableProductsForPrincipal.some(p => p.productName === machine.productName) && (
                                        <option value={machine.productName}>{machine.productName}</option>
                                      )}
                                    </select>
                                    {machine.productCode && (
                                      <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                        SKU: {machine.productCode}
                                      </div>
                                    )}
                                  </td>

                                  {/* Category */}
                                  <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {machine.category || 'General Equipment'}
                                  </td>

                                  {/* Unit Price */}
                                  <td style={{ padding: '10px 14px' }}>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={machine.unitPrice}
                                      onChange={(e) => handleUpdateMachineRow(index, 'unitPrice', e.target.value)}
                                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                                    />
                                  </td>

                                  {/* Quantity */}
                                  <td style={{ padding: '10px 14px' }}>
                                    <input
                                      type="number"
                                      min="1"
                                      className="form-control"
                                      value={machine.quantity}
                                      onChange={(e) => handleUpdateMachineRow(index, 'quantity', e.target.value)}
                                      style={{ fontSize: '0.82rem', padding: '6px 10px', textAlign: 'center' }}
                                    />
                                  </td>

                                  {/* Total Price */}
                                  <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                                    {formatINR(machine.totalPrice)}
                                  </td>

                                  {/* Notes */}
                                  <td style={{ padding: '10px 14px' }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="e.g. Include mounting clips"
                                      value={machine.notes}
                                      onChange={(e) => handleUpdateMachineRow(index, 'notes', e.target.value)}
                                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                                    />
                                  </td>

                                  {/* Delete */}
                                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMachineRow(index)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '4px'
                                      }}
                                      title="Remove Machine"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Machine Subtotal Summary Box */}
                        <div style={{
                          padding: '16px 20px',
                          backgroundColor: 'var(--bg-main)',
                          borderTop: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Total Configured Machines: <strong>{formData.machines.length}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>
                                Machines Subtotal
                              </div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {formatINR(machineSubtotal)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab(3)}
                              className="btn btn-secondary btn-sm"
                              style={{ gap: '6px' }}
                            >
                              <span>Proceed to Quote Tab</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================================
                    TAB 3: COMMERCIAL QUOTATIONS & REVISIONS
                    ========================================================================= */}
                {activeTab === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Official Static Text Box as requested */}
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--primary-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff'
                        }}>
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                            Simultaneous Commercial Quotation Creation
                          </h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Generate an initial official quotation (Rev 0) concurrently while registering this opportunity.
                          </div>
                        </div>
                      </div>

                      <div style={{
                        marginTop: '12px',
                        padding: '16px',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {/* Toggle Switch */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <label 
                            htmlFor="toggle-auto-generate-quote"
                            style={{
                              position: 'relative',
                              display: 'inline-block',
                              width: '50px',
                              height: '26px',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              id="toggle-auto-generate-quote"
                              type="checkbox"
                              checked={formData.autoGenerateQuote}
                              onChange={(e) => setFormData({ ...formData, autoGenerateQuote: e.target.checked })}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              inset: 0,
                              backgroundColor: formData.autoGenerateQuote ? 'var(--primary-600)' : '#cbd5e1',
                              borderRadius: '26px',
                              transition: '0.2s'
                            }}>
                              <span style={{
                                position: 'absolute',
                                height: '20px',
                                width: '20px',
                                left: formData.autoGenerateQuote ? '27px' : '3px',
                                bottom: '3px',
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                transition: '0.2s'
                              }} />
                            </span>
                          </label>

                          <div>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              Auto-Generate Quotation (Rev 0) upon Saving Opportunity
                            </span>
                            {/* Required Note Below Toggle Switch */}
                            <p style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              margin: '4px 0 0 0',
                              lineHeight: 1.4
                            }}>
                              When checked, the system will instantly create Quote Rev 0 populated with all machine products selected in Tab 2, calculate 18% GST tax, and link it directly to this deal.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quotation Calculation Breakdown Preview */}
                    <div style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      padding: '24px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
                        Quotation Rev 0 Commercial Breakdown Preview
                      </h4>

                      {formData.machines.length === 0 ? (
                        <div style={{
                          padding: '24px',
                          textAlign: 'center',
                          backgroundColor: 'var(--bg-main)',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)'
                        }}>
                          No machines added in Tab 2. Add machines to generate itemized quotation.
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {formData.machines.map((m, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.82rem',
                                padding: '8px 12px',
                                backgroundColor: 'var(--bg-main)',
                                borderRadius: '6px'
                              }}>
                                <div>
                                  <strong>{m.productName}</strong> × {m.quantity}
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                                    @{formatINR(m.unitPrice)} each
                                  </div>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {formatINR(m.totalPrice)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{
                            borderTop: '2px dashed var(--border-subtle)',
                            paddingTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxWidth: '380px',
                            marginLeft: 'auto'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <span>Subtotal (Excl. Tax):</span>
                              <strong>{formatINR(machineSubtotal)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <span>GST Tax (18%):</span>
                              <strong>{formatINR(machineGst18)}</strong>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '1.15rem',
                              fontWeight: 800,
                              color: 'var(--primary-700)',
                              borderTop: '1px solid var(--border-subtle)',
                              paddingTop: '8px'
                            }}>
                              <span>Grand Total (INR):</span>
                              <span>{formatINR(machineGrandTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* Back / Next tab navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeTab > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(prev => prev - 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <ChevronLeft size={16} />
                      <span>Previous Tab</span>
                    </button>
                  )}
                  {activeTab < 3 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(prev => prev + 1)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <span>Next Tab</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    id="btn-save-opportunity"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', fontWeight: 800, gap: '8px' }}
                  >
                    <Check size={18} />
                    <span>{saving ? 'Saving Opportunity...' : isEditMode ? 'Update Opportunity' : 'Save Opportunity & Pipeline Deal'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS & QUOTATION PRINT MODAL
          ========================================================================= */}
      {viewDetailsOpp && (
        <div className="modal-overlay" onClick={() => setViewDetailsOpp(null)}>
          <div 
            className="modal-dialog" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '820px', width: '92vw', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '18px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                  {viewDetailsOpp.opportunityCode}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {viewDetailsOpp.opportunityName}
                </h3>
              </div>
              <button onClick={() => setViewDetailsOpp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Top Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CUSTOMER</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{viewDetailsOpp.customerClient}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{viewDetailsOpp.contactPerson}</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>OEM PRINCIPAL</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#8b5cf6' }}>{viewDetailsOpp.principalBrand}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Stage: {viewDetailsOpp.stage}</div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEAL VALUE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                    {formatINR(viewDetailsOpp.dealValue)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Rep: {viewDetailsOpp.assignedSalesperson || 'None'}</div>
                </div>
              </div>

              {/* Technical Scope */}
              {viewDetailsOpp.technicalRequirements && (
                <div style={{ padding: '14px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    TECHNICAL SCOPE &amp; CUSTOMER SPECIFICATIONS
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {viewDetailsOpp.technicalRequirements}
                  </div>
                </div>
              )}

              {/* Competitor Intel */}
              {viewDetailsOpp.competitorInfo?.brandName && (
                <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>
                    COMPETITOR INTELLIGENCE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                    <div>Rival: <strong>{viewDetailsOpp.competitorInfo.brandName}</strong> ({viewDetailsOpp.competitorInfo.modelOffering})</div>
                    <div>Threat: <strong>{viewDetailsOpp.competitorInfo.threatLevel}</strong></div>
                    <div>Rival Price: <strong>{formatINR(viewDetailsOpp.competitorInfo.estimatedPrice)}</strong></div>
                    <div>Winning Edge: <strong>{viewDetailsOpp.competitorInfo.weaknessesWinningEdge}</strong></div>
                  </div>
                </div>
              )}

              {/* Configured Machinery Grid */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>
                  Configured Machinery / Products ({viewDetailsOpp.machines?.length || 0})
                </h4>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                        <th style={{ padding: '8px 12px' }}>Product</th>
                        <th style={{ padding: '8px 12px' }}>Category</th>
                        <th style={{ padding: '8px 12px' }}>Qty</th>
                        <th style={{ padding: '8px 12px' }}>Unit Price</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewDetailsOpp.machines || []).map((m, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{m.productName}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{m.category}</td>
                          <td style={{ padding: '8px 12px' }}>{m.quantity}</td>
                          <td style={{ padding: '8px 12px' }}>{formatINR(m.unitPrice)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>{formatINR(m.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Quotation History */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>
                  Commercial Quotation Revisions ({viewDetailsOpp.quotations?.length || 0})
                </h4>
                {(!viewDetailsOpp.quotations || viewDetailsOpp.quotations.length === 0) ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                    No commercial quotation generated for this opportunity yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {viewDetailsOpp.quotations.map((q, idx) => (
                      <div key={idx} style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '0.85rem' }}>{q.quoteNumber}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                              {q.revision}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{q.quoteDate}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Subtotal: {formatINR(q.subtotal)} + GST 18%: {formatINR(q.gstAmount)}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {formatINR(q.grandTotal)}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Status: {q.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setViewDetailsOpp(null)} className="btn btn-secondary">
                Close
              </button>
              <button 
                onClick={() => {
                  const opp = viewDetailsOpp;
                  setViewDetailsOpp(null);
                  handleOpenEditModal(opp);
                }} 
                className="btn btn-primary"
              >
                Edit Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
