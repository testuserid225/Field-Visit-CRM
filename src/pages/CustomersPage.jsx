import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  MapPin,
  Globe,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  FileText,
  Briefcase,
  ExternalLink,
  ChevronDown,
  Building,
  Navigation,
  CheckCircle,
  Filter,
  Sparkles,
  PhoneCall,
  Mail,
  LayoutGrid,
  Table
} from 'lucide-react';
import { api } from '../services/api';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';
import AdvancedDataGrid from '../components/grid/AdvancedDataGrid';

const CUSTOMER_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'organizationName', label: 'Customer Organization Name', transform: (v, r) => r.organizationName || '' },
  { key: 'customerCode', label: 'Customer Code', transform: (v, r) => r.customerCode || '' },
  { key: 'customerType', label: 'Customer Type', transform: (v, r) => r.customerType || '' },
  { key: 'industrySegment', label: 'Industry Segment', transform: (v, r) => r.industrySegment || '' },
  { key: 'primaryContactPerson', label: 'Primary Contact Person', transform: (v, r) => r.primaryContactPerson || '' },
  { key: 'mobile', label: 'Mobile Number', transform: (v, r) => r.mobile || r.phone || '' },
  { key: 'email', label: 'Email Address', transform: (v, r) => r.email || '' },
  { key: 'websiteUrl', label: 'Website', transform: (v, r) => r.websiteUrl || '' },
  { key: 'address', label: 'Address', transform: (v, r) => r.address || '' },
  { key: 'city', label: 'City', transform: (v, r) => r.city || '' },
  { key: 'state', label: 'State', transform: (v, r) => r.state || '' },
  { key: 'pincode', label: 'Pincode', transform: (v, r) => r.pincode || '' },
  { key: 'leadSource', label: 'Lead Source', transform: (v, r) => r.leadSource || '' },
  { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
];

const CUSTOMER_COLUMNS = [
  { key: 'index', label: '#', defaultVisible: true, locked: true },
  { key: 'organization', label: 'Customer Organization Name', defaultVisible: true },
  { key: 'customerType', label: 'Customer Type', defaultVisible: true },
  { key: 'industry', label: 'Industry Segment', defaultVisible: true },
  { key: 'primaryContact', label: 'Primary Contact', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'location', label: 'Location (City, State)', defaultVisible: true },
  { key: 'leadSource', label: 'Lead Source', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

const LEAD_SOURCES = [
  'Direct Visit',
  'Reference',
  'Website',
  'LinkedIn',
  'Cold Call',
  'Exhibition / Event'
];

const CUSTOMER_TYPES = ['Existing Customer', 'Prospect'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

export default function CustomersPage({ showToast, currentUser }) {
  const [viewMode, setViewMode] = useState('aggrid'); // 'aggrid' | 'standard'
  const {
    columns: customerColumns,
    visibleColumns: visibleCustCols,
    isColumnVisible: isCustColVisible,
    toggleColumn: toggleCustCol,
    resetToDefaults: resetCustCols,
    showAllColumns: showAllCustCols
  } = useColumnVisibility('crm_cols_customers', CUSTOMER_COLUMNS);

  const [customers, setCustomers] = useState([]);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [contactPersonOptions, setContactPersonOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Create, object = Edit (PUT)
  const [formData, setFormData] = useState({
    organizationName: '',
    customerType: 'Existing Customer',
    industrySegment: '',
    primaryContactPerson: '',
    email: '',
    leadSource: 'Direct Visit',
    websiteUrl: '',
    status: 'Active',
    city: '',
    state: '',
    fullAddress: '',
    remarks: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch Customers, Master Industry Segments & Contact Persons from Masters
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Customers
      const customerData = await api.getCustomers();
      const custList = Array.isArray(customerData) ? customerData : (customerData?.customers || []);
      setCustomers(custList);

      // 2. Fetch Industry Segments from master
      const industries = await api.getCustomerIndustrySegments();
      if (Array.isArray(industries) && industries.length > 0) {
        setIndustryOptions(industries);
      } else {
        const masterInds = await api.getMasterItems('industries');
        if (Array.isArray(masterInds) && masterInds.length > 0) {
          const names = masterInds.map(i => i.industrySegmentName).filter(Boolean);
          setIndustryOptions(names);
        } else {
          setIndustryOptions([]);
        }
      }

      // 3. Fetch Contact Persons from Contact Person master
      const contactPersons = await api.getContactPersons();
      const cpList = Array.isArray(contactPersons) ? contactPersons : (contactPersons?.contacts || contactPersons?.contactPersons || []);
      const names = [...new Set(cpList.map(c => c.name || c.fullName).filter(Boolean))];
      setContactPersonOptions(names);
    } catch (err) {
      console.error('Error fetching customers/industries/contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormError('');
    setFormData({
      organizationName: '',
      customerType: 'Existing Customer',
      industrySegment: '',
      primaryContactPerson: '',
      email: '',
      leadSource: 'Direct Visit',
      websiteUrl: '',
      status: 'Active',
      city: '',
      state: '',
      fullAddress: '',
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setEditingItem(customer);
    setFormError('');
    setFormData({
      organizationName: customer.organizationName || '',
      customerType: customer.customerType || 'Existing Customer',
      industrySegment: customer.industrySegment || '',
      primaryContactPerson: customer.primaryContactPerson || '',
      email: customer.email || '',
      leadSource: customer.leadSource || 'Direct Visit',
      websiteUrl: customer.websiteUrl || '',
      status: customer.status || 'Active',
      city: customer.city || '',
      state: customer.state || '',
      fullAddress: customer.fullAddress || '',
      remarks: customer.remarks || ''
    });
    setIsModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.organizationName?.trim()) {
      setFormError('Customer Organization Name is required.');
      return;
    }
    if (!formData.primaryContactPerson?.trim()) {
      setFormError('Primary Contact Person is required.');
      return;
    }
    if (!formData.city?.trim()) {
      setFormError('City is required.');
      return;
    }
    if (!formData.state?.trim()) {
      setFormError('State is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // PUT API
        const targetId = editingItem._id;
        const result = await api.updateCustomer(targetId, formData);
        if (result && result.success) {
          showToast(`Customer "${formData.organizationName}" updated successfully.`);
          setCustomers(prev => prev.map(c => (c._id === targetId ? result.customer : c)));
          setIsModalOpen(false);
        } else {
          // Local fallback
          setCustomers(prev => prev.map(c => (c._id === targetId ? { ...c, ...formData } : c)));
          showToast(`Customer "${formData.organizationName}" updated locally.`);
          setIsModalOpen(false);
        }
      } else {
        // POST API
        const result = await api.createCustomer(formData);
        if (result && result.success) {
          showToast(`Customer "${formData.organizationName}" created successfully.`);
          setCustomers(prev => [result.customer, ...prev]);
          setIsModalOpen(false);
        } else {
          // Local fallback
          const newLocal = {
            _id: `cust-${Date.now()}`,
            customerCode: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
            ...formData,
            createdAt: new Date().toISOString()
          };
          setCustomers(prev => [newLocal, ...prev]);
          showToast(`Customer "${formData.organizationName}" created locally.`);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      const result = await api.deleteCustomer(deleteConfirmId);
      if (result && result.success) {
        showToast('Customer record deleted successfully.');
      } else {
        showToast('Customer deleted.');
      }
      setCustomers(prev => prev.filter(c => c._id !== deleteConfirmId));
    } catch (err) {
      showToast('Error deleting customer: ' + err.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Filtered List
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.primaryContactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industrySegment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leadSource?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || c.customerType === typeFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

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
      field: 'organizationName',
      headerName: 'Customer Organization Name',
      flex: 1.5,
      minWidth: 240,
      cellRenderer: (params) => {
        const cust = params.data;
        if (!cust) return null;
        const initials = (cust.organizationName || 'C').trim().substring(0, 2).toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
            <div className="crm-avatar-initials" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.25', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.86rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {cust.organizationName}
                </span>
                {cust.websiteUrl && (
                  <a
                    href={cust.websiteUrl.startsWith('http') ? cust.websiteUrl : `https://${cust.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--primary-600)', display: 'inline-flex', alignItems: 'center' }}
                    title={`Visit ${cust.websiteUrl}`}
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              {cust.customerCode && (
                <div style={{ marginTop: '2px' }}>
                  <span className="crm-code-pill">{cust.customerCode}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      field: 'customerType',
      headerName: 'Customer Type',
      minWidth: 150,
      cellRenderer: (params) => {
        const val = params.value;
        const isExisting = val === 'Existing Customer';
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: isExisting ? '#ecfdf5' : '#eff6ff',
            color: isExisting ? '#059669' : '#2563eb',
            border: `1px solid ${isExisting ? '#a7f3d0' : '#bfdbfe'}`
          }}>
            {val || '—'}
          </span>
        );
      }
    },
    {
      field: 'industrySegment',
      headerName: 'Industry Segment',
      minWidth: 160
    },
    {
      field: 'primaryContactPerson',
      headerName: 'Primary Contact',
      minWidth: 160
    },
    {
      field: 'email',
      headerName: 'Email',
      minWidth: 190,
      cellRenderer: (params) => {
        const email = params.value;
        if (!email) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return (
          <a
            href={`mailto:${email}`}
            style={{ color: 'var(--primary-600)', textDecoration: 'none' }}
          >
            {email}
          </a>
        );
      }
    },
    {
      field: 'city',
      headerName: 'City',
      minWidth: 120
    },
    {
      field: 'state',
      headerName: 'State',
      minWidth: 120
    },
    {
      field: 'leadSource',
      headerName: 'Lead Source',
      minWidth: 140
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      cellRenderer: (params) => {
        const val = params.value || 'Active';
        const isActive = val === 'Active';
        return (
          <span className={`crm-status-pill ${isActive ? 'status-active' : 'status-inactive'}`}>
            <span className="status-dot" />
            {val}
          </span>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Created Date',
      type: 'date',
      minWidth: 130
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      pinned: 'right',
      width: 105,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const cust = params.data;
        if (!cust) return null;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <button
              id={`ag-edit-cust-${cust._id || params.rowIndex}`}
              onClick={() => handleOpenEdit(cust)}
              className="crm-action-icon-btn btn-edit"
              title="Edit Customer"
            >
              <Edit size={13} />
            </button>
            <button
              id={`ag-del-cust-${cust._id || params.rowIndex}`}
              onClick={() => setDeleteConfirmId(cust._id)}
              className="crm-action-icon-btn btn-delete"
              title="Delete Customer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], []);

  // KPI Metrics
  const totalCount = customers.length;
  const existingCount = customers.filter(c => c.customerType === 'Existing Customer').length;
  const prospectCount = customers.filter(c => c.customerType === 'Prospect').length;
  const activeCount = customers.filter(c => c.status === 'Active').length;

  return (
    <div className="page-container" style={{ padding: '24px 28px' }}>
      {/* Page Title & Actions Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              color: '#fff'
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Customer Directory
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Manage organization business profiles, master industry segments, locations, and lead sources
              </p>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="refresh-customers-btn"
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Customer Data from MongoDB"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-add-customer"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={18} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Customers */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Accounts
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {totalCount}
            </div>
          </div>
        </div>

        {/* Existing Customers */}
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
            justifyContent: 'center'
          }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Existing Customers
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {existingCount}
            </div>
          </div>
        </div>

        {/* Prospects */}
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
            justifyContent: 'center'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Prospects / Leads
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
              {prospectCount}
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Navigation size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Ratio
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Content: Advanced AG Grid vs Standard Table */}
      {viewMode === 'aggrid' ? (
        <AdvancedDataGrid
          gridId="crm_customers_directory"
          title="Customer Accounts Directory"
          subtitle="Enterprise data grid with columns manager, multi-filters, formatters, chart visualizer, pivoting, and reporting"
          rowData={customers}
          columnDefs={agGridColumnDefs}
          isLoading={isLoading}
          onRefresh={fetchData}
          currentUser={currentUser?.email || currentUser?.username || 'admin'}
          showToast={showToast}
          exportFilename="Customers_Directory"
          defaultPageSize={25}
          primaryAction={{
            label: 'Add Customer',
            onClick: handleOpenCreate,
            id: 'ag-primary-add-cust'
          }}
        />
      ) : (
        <>
          {/* Search and Filters Toolstrip */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="customer-search-input"
              type="text"
              placeholder="Search by organization, contact, city, state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.875rem' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Customer Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Type:
              </span>
              {['all', 'Existing Customer', 'Prospect'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: typeFilter === type ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                    backgroundColor: typeFilter === type ? 'var(--primary-50)' : 'transparent',
                    color: typeFilter === type ? 'var(--primary-700)' : 'var(--text-muted)'
                  }}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Status:
              </span>
              {['all', 'Active', 'Inactive'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: statusFilter === st ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                    backgroundColor: statusFilter === st ? 'var(--primary-50)' : 'transparent',
                    color: statusFilter === st ? 'var(--primary-700)' : 'var(--text-muted)'
                  }}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
            {/* Column Visibility Customizer Dropdown */}
            <ColumnVisibilityDropdown
              columns={customerColumns}
              visibleColumns={visibleCustCols}
              onToggle={toggleCustCol}
              onReset={resetCustCols}
              onShowAll={showAllCustCols}
            />

            {/* Export to Excel */}
            <ExportExcelButton
              data={filteredCustomers}
              columns={CUSTOMER_EXPORT_COLUMNS}
              filename="Customers_Directory"
              sheetName="Customers"
              showToast={showToast}
            />
          </div>
        </div>
      </div>

      {/* Customer Data List Table */}
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
                {isCustColVisible('index') && <th style={{ padding: '14px 18px', width: '50px' }}>#</th>}
                {isCustColVisible('organization') && <th style={{ padding: '14px 18px' }}>Customer Organization Name</th>}
                {isCustColVisible('customerType') && <th style={{ padding: '14px 18px' }}>Customer Type</th>}
                {isCustColVisible('industry') && <th style={{ padding: '14px 18px' }}>Industry Segment</th>}
                {isCustColVisible('primaryContact') && <th style={{ padding: '14px 18px' }}>Primary Contact</th>}
                {isCustColVisible('email') && <th style={{ padding: '14px 18px' }}>Email</th>}
                {isCustColVisible('location') && <th style={{ padding: '14px 18px' }}>Location (City, State)</th>}
                {isCustColVisible('leadSource') && <th style={{ padding: '14px 18px' }}>Lead Source</th>}
                {isCustColVisible('status') && <th style={{ padding: '14px 18px' }}>Status</th>}
                {isCustColVisible('actions') && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={visibleCustCols.length} style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={36} color="var(--border-strong)" />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        No Customer Accounts Found
                      </div>
                      <div style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                        {searchTerm ? 'No results matched your search criteria.' : 'Click "+ Add Customer" above to create your first organization profile.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, index) => (
                  <tr
                    key={cust._id || index}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* S.No */}
                    {isCustColVisible('index') && (
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                    )}

                    {/* Customer Organization Name */}
                    {isCustColVisible('organization') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {cust.organizationName}
                            </span>
                            {cust.websiteUrl && (
                              <a
                                href={cust.websiteUrl.startsWith('http') ? cust.websiteUrl : `https://${cust.websiteUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--primary-600)', display: 'inline-flex', alignItems: 'center' }}
                                title={`Visit ${cust.websiteUrl}`}
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          {cust.customerCode && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                              {cust.customerCode}
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Customer Type */}
                    {isCustColVisible('customerType') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: cust.customerType === 'Existing Customer' ? '#ecfdf5' : '#eff6ff',
                          color: cust.customerType === 'Existing Customer' ? '#059669' : '#2563eb',
                          border: `1px solid ${cust.customerType === 'Existing Customer' ? '#a7f3d0' : '#bfdbfe'}`
                        }}>
                          {cust.customerType}
                        </span>
                      </td>
                    )}

                    {/* Industry Segment */}
                    {isCustColVisible('industry') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          <Building size={14} color="var(--primary-600)" />
                          <span>{cust.industrySegment}</span>
                        </div>
                      </td>
                    )}

                    {/* Primary Contact Person */}
                    {isCustColVisible('primaryContact') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                          <Users size={14} color="var(--text-muted)" />
                          <span>{cust.primaryContactPerson}</span>
                        </div>
                      </td>
                    )}

                    {/* Email */}
                    {isCustColVisible('email') && (
                      <td style={{ padding: '14px 18px' }}>
                        {cust.email ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            <Mail size={14} color="#10b981" />
                            <a
                              href={`mailto:${cust.email}`}
                              style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                              title={`Send email to ${cust.email}`}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                              {cust.email}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>
                    )}

                    {/* Location */}
                    {isCustColVisible('location') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <MapPin size={14} color="#f59e0b" />
                          <span>{cust.city}, {cust.state}</span>
                        </div>
                      </td>
                    )}

                    {/* Lead Source */}
                    {isCustColVisible('leadSource') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)'
                        }}>
                          {cust.leadSource}
                        </span>
                      </td>
                    )}

                    {/* Status */}
                    {isCustColVisible('status') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: cust.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                          color: cust.status === 'Active' ? '#059669' : '#64748b'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: cust.status === 'Active' ? '#10b981' : '#94a3b8'
                          }} />
                          {cust.status}
                        </span>
                      </td>
                    )}

                    {/* Actions Column */}
                    {isCustColVisible('actions') && (
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            id={`edit-cust-btn-${cust._id || index}`}
                            onClick={() => handleOpenEdit(cust)}
                            className="btn-icon"
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-main)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--primary-700)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title="Edit Customer"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            id={`delete-cust-btn-${cust._id || index}`}
                            onClick={() => setDeleteConfirmId(cust._id)}
                            className="btn-icon"
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#e11d48',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title="Delete Customer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Modal Form for Create & Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-600)'
                }}>
                  {editingItem ? <Edit size={18} /> : <PlusCircle size={18} />}
                </div>
                <span>{editingItem ? 'Edit Customer Organization' : 'Create Customer Organization'}</span>
              </div>
              <button
                id="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                style={{ color: 'var(--text-light)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {formError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--status-cancelled-bg)',
                    color: 'var(--status-cancelled)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem'
                  }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section : 1. Organization & Business Profile */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '10px',
                    marginBottom: '16px'
                  }}>
                    <Building2 size={18} color="var(--primary-600)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      Section 1: Organization & Business Profile
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Customer Organization Name */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                        Customer Organization Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        id="customer-org-name-input"
                        type="text"
                        className="form-control"
                        placeholder="e.g. Apex Healthcare Diagnostics Ltd"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        required
                      />
                    </div>

                    {/* Customer type dropdown & Industry Segment dropdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {/* Customer type dropdown */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Customer Type <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="customer-type-select"
                          className="form-control"
                          value={formData.customerType}
                          onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                          required
                        >
                          {CUSTOMER_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Industry Segment dropdown (get from master) */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Industry Segment (from Master) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="customer-industry-select"
                          className="form-control"
                          value={formData.industrySegment}
                          onChange={(e) => setFormData({ ...formData, industrySegment: e.target.value })}
                          required
                        >
                          <option value="">-- Select Industry Segment from Master --</option>
                          {industryOptions.map(seg => (
                            <option key={seg} value={seg}>{seg}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Primary Contact Person & Lead Source */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {/* Primary Contact Person dropdown (from Contact Person Master) */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Primary Contact Person (from Master) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="customer-contact-person-select"
                          className="form-control"
                          value={formData.primaryContactPerson}
                          onChange={(e) => setFormData({ ...formData, primaryContactPerson: e.target.value })}
                          required
                        >
                          <option value="">-- Select Contact Person from Master --</option>
                          {contactPersonOptions.map((person, idx) => (
                            <option key={idx} value={person}>{person}</option>
                          ))}
                          {formData.primaryContactPerson && !contactPersonOptions.includes(formData.primaryContactPerson) && (
                            <option value={formData.primaryContactPerson}>{formData.primaryContactPerson}</option>
                          )}
                        </select>
                      </div>

                      {/* Lead Source dropdown */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Lead Source <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="customer-lead-source-select"
                          className="form-control"
                          value={formData.leadSource}
                          onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                          required
                        >
                          <option value="">-- Select Lead Source --</option>
                          {LEAD_SOURCES.map(source => (
                            <option key={source} value={source}>{source}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Email Address, Website URL & Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 0.8fr', gap: '14px' }}>
                      {/* Email Address input */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="customer-email-input"
                            type="email"
                            className="form-control"
                            placeholder="e.g. contact@apexhealth.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ paddingLeft: '34px' }}
                          />
                          <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      {/* Website URL input */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Website URL
                        </label>
                        <input
                          id="customer-website-input"
                          type="text"
                          className="form-control"
                          placeholder="e.g. https://apexhealth.com"
                          value={formData.websiteUrl}
                          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        />
                      </div>

                      {/* Status dropdown */}
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Status <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                          id="customer-status-select"
                          className="form-control"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          required
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section : 2. Location & Notes */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '10px',
                    marginBottom: '16px'
                  }}>
                    <MapPin size={18} color="#f59e0b" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      Section 2: Location & Notes
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* City & State */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          City <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="customer-city-input"
                          type="text"
                          className="form-control"
                          placeholder="e.g. Mumbai"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          State <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          id="customer-state-input"
                          type="text"
                          className="form-control"
                          placeholder="e.g. Maharashtra"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Full Address textarea */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                        Full Address
                      </label>
                      <textarea
                        id="customer-address-textarea"
                        className="form-control"
                        rows={2}
                        placeholder="Enter complete office/facility address..."
                        value={formData.fullAddress}
                        onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {/* Remarks / Notes textarea */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                        Remarks / Notes
                      </label>
                      <textarea
                        id="customer-remarks-textarea"
                        className="form-control"
                        rows={2}
                        placeholder="Add strategic notes, account background, visit preferences..."
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-customer-form"
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? <RefreshCw size={16} className="spin-icon" /> : null}
                  <span>{editingItem ? 'Save Changes' : 'Create Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center', padding: '24px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#fff1f2',
              color: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Delete Customer Account?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to remove this customer organization? This action will permanently remove the record from the database.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-customer"
                className="btn"
                style={{ backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleDeleteConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
