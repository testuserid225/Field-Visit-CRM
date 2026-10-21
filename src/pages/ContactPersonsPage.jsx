import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Mail,
  Phone,
  Briefcase,
  User,
  Building2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  PhoneCall,
  LayoutGrid,
  Table
} from 'lucide-react';
import { api } from '../services/api';
import useColumnVisibility from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';
import AdvancedDataGrid from '../components/grid/AdvancedDataGrid';

const CONTACT_PERSON_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'name', label: 'Contact Person Name', transform: (v, r) => r.name || '' },
  { key: 'customerOrganizationName', label: 'Customer Organization', transform: (v, r) => r.customerOrganizationName || '' },
  { key: 'designation', label: 'Designation / Role', transform: (v, r) => r.designation || '' },
  { key: 'mobileNumber', label: 'Mobile Number', transform: (v, r) => r.mobileNumber || '' },
  { key: 'email', label: 'Email Address', transform: (v, r) => r.email || '' },
  { key: 'department', label: 'Department', transform: (v, r) => r.department || '' },
  { key: 'notes', label: 'Notes', transform: (v, r) => r.notes || '' },
  { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
];

const CONTACT_COLUMNS = [
  { key: 'index', label: '#', defaultVisible: true, locked: true },
  { key: 'name', label: 'Contact Person Name', defaultVisible: true },
  { key: 'organization', label: 'Customer Organization Name', defaultVisible: true },
  { key: 'designation', label: 'Designation / Role', defaultVisible: true },
  { key: 'mobile', label: 'Mobile Number', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

export default function ContactPersonsPage({ showToast, currentUser }) {
  const [viewMode, setViewMode] = useState('aggrid'); // 'aggrid' | 'standard'
  const [contacts, setContacts] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Column Visibility Hook
  const {
    columns: contactColumns,
    visibleColumns: visibleContactCols,
    toggleColumn: toggleContactCol,
    resetToDefaults: resetContactCols,
    showAllColumns: showAllContactCols,
    isColumnVisible: isContactColVisible
  } = useColumnVisibility('crm_cols_contact_persons', CONTACT_COLUMNS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Create, object = Edit (PUT)
  const [formData, setFormData] = useState({
    name: '',
    customerOrganizationName: '',
    designation: '',
    mobileNumber: '',
    email: '',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch live contact persons, customer master, and designation master data strictly from MongoDB
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Contact Persons
      const contactData = await api.getContactPersons();
      setContacts(Array.isArray(contactData) ? contactData : []);

      // 2. Fetch Customer Master organizations for dropdown
      const customersData = await api.getCustomers();
      const custList = Array.isArray(customersData) ? customersData : (customersData?.customers || []);
      const orgNames = [...new Set(custList.map(c => c.organizationName).filter(Boolean))];
      setCustomerOptions(orgNames);

      // 3. Fetch Master Designations strictly from Designation Master
      const desigs = await api.getContactPersonDesignations();
      if (Array.isArray(desigs) && desigs.length > 0) {
        setDesignationOptions(desigs);
      } else {
        const masterDesigs = await api.getMasterItems('designations');
        if (Array.isArray(masterDesigs) && masterDesigs.length > 0) {
          const titles = masterDesigs
            .filter(d => d.status === 'Active' || !d.status)
            .map(d => d.designationTitle)
            .filter(Boolean);
          setDesignationOptions(titles);
        } else {
          setDesignationOptions([]);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Create Form Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormError('');
    setFormData({
      name: '',
      customerOrganizationName: '',
      designation: '',
      mobileNumber: '',
      email: '',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  // Open Edit Form Modal (PUT)
  const handleOpenEdit = (contact) => {
    setEditingItem(contact);
    setFormError('');
    setFormData({
      name: contact.name || '',
      customerOrganizationName: contact.customerOrganizationName || '',
      designation: contact.designation || '',
      mobileNumber: contact.mobileNumber || '',
      email: contact.email || '',
      status: contact.status || 'Active'
    });
    setIsModalOpen(true);
  };

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.name?.trim()) {
      setFormError('Contact Person Name is required.');
      return;
    }
    if (!formData.customerOrganizationName?.trim()) {
      setFormError('Customer Organization Name is required.');
      return;
    }
    if (!formData.designation?.trim()) {
      setFormError('Designation / Role is required.');
      return;
    }
    if (!formData.mobileNumber?.trim()) {
      setFormError('Mobile Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // PUT API
        const targetId = editingItem._id;
        const result = await api.updateContactPerson(targetId, formData);
        if (result && result.success) {
          showToast(`Contact person "${formData.name}" updated successfully.`);
          setContacts(prev => prev.map(c => (c._id === targetId ? result.contactPerson : c)));
          setIsModalOpen(false);
        } else {
          // Local fallback update if offline
          setContacts(prev => prev.map(c => (c._id === targetId ? { ...c, ...formData } : c)));
          showToast(`Contact person "${formData.name}" updated locally.`);
          setIsModalOpen(false);
        }
      } else {
        // POST API
        const result = await api.createContactPerson(formData);
        if (result && result.success) {
          showToast(`Contact person "${formData.name}" created successfully.`);
          setContacts(prev => [result.contactPerson, ...prev]);
          setIsModalOpen(false);
        } else {
          // Local fallback creation if offline
          const newLocal = {
            _id: `cp-${Date.now()}`,
            ...formData,
            createdAt: new Date().toISOString()
          };
          setContacts(prev => [newLocal, ...prev]);
          showToast(`Contact person "${formData.name}" added locally.`);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete (DELETE API)
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      const result = await api.deleteContactPerson(deleteConfirmId);
      if (result && result.success) {
        showToast('Contact person deleted successfully.');
      } else {
        showToast('Contact person deleted.');
      }
      setContacts(prev => prev.filter(c => c._id !== deleteConfirmId));
    } catch (err) {
      showToast('Error deleting contact person: ' + err.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Filter contacts by Search and Status
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      (contact.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.customerOrganizationName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.designation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.mobileNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
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
      field: 'name',
      headerName: 'Contact Person Name',
      flex: 1.2,
      minWidth: 200,
      cellRenderer: (params) => {
        const contact = params.data;
        if (!contact) return null;
        const initials = (contact.name || 'C').trim().substring(0, 2).toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
            <div className="crm-avatar-initials" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.25', overflow: 'hidden' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.86rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {contact.name}
              </span>
              {contact.designation && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {contact.designation}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      field: 'customerOrganizationName',
      headerName: 'Customer Organization',
      flex: 1.3,
      minWidth: 210,
      cellRenderer: (params) => {
        const org = params.value;
        if (!org) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
            <Building2 size={13} color="var(--primary-600)" />
            <span>{org}</span>
          </div>
        );
      }
    },
    {
      field: 'designation',
      headerName: 'Designation / Role',
      minWidth: 160
    },
    {
      field: 'mobileNumber',
      headerName: 'Mobile Number',
      minWidth: 150,
      cellRenderer: (params) => {
        const num = params.value;
        if (!num) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return (
          <a href={`tel:${num}`} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}>
            {num}
          </a>
        );
      }
    },
    {
      field: 'email',
      headerName: 'Email',
      minWidth: 190,
      cellRenderer: (params) => {
        const email = params.value;
        if (!email) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        return (
          <a href={`mailto:${email}`} style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
            {email}
          </a>
        );
      }
    },
    {
      field: 'department',
      headerName: 'Department',
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
      colId: 'actions',
      headerName: 'Actions',
      pinned: 'right',
      width: 105,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const contact = params.data;
        if (!contact) return null;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '100%' }}>
            <button
              id={`ag-edit-contact-${contact._id || params.rowIndex}`}
              onClick={() => handleOpenEdit(contact)}
              className="crm-action-icon-btn btn-edit"
              title="Edit Contact Person"
            >
              <Edit size={13} />
            </button>
            <button
              id={`ag-del-contact-${contact._id || params.rowIndex}`}
              onClick={() => setDeleteConfirmId(contact._id)}
              className="crm-action-icon-btn btn-delete"
              title="Delete Contact Person"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], []);

  // KPI Metrics
  const totalCount = contacts.length;
  const activeCount = contacts.filter(c => c.status === 'Active').length;
  const inactiveCount = contacts.filter(c => c.status === 'Inactive').length;

  return (
    <div className="page-container" style={{ padding: '24px 28px' }}>
      {/* Page Title & Action Bar */}
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
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              color: '#fff'
            }}>
              <Users size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Contact Persons
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Manage stakeholder profiles mapped to customer master organizations, official roles, and contact channels
              </p>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="refresh-contacts-btn"
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Contact Data from MongoDB"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-add-contact-person"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={18} />
            <span>Add Contact Person</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Metric */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Contacts
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {totalCount}
            </div>
          </div>
        </div>

        {/* Active Metric */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Stakeholders
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {activeCount}
            </div>
          </div>
        </div>

        {/* Inactive Metric */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inactive Contacts
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e11d48', marginTop: '2px' }}>
              {inactiveCount}
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Content: Advanced AG Grid vs Standard Table */}
      {viewMode === 'aggrid' ? (
        <AdvancedDataGrid
          gridId="crm_contact_persons_grid"
          title="Contact Persons Directory"
          subtitle="Stakeholder directory with columns manager, multi-filters, formatters, chart visualizer, pivoting, and reporting"
          rowData={contacts}
          columnDefs={agGridColumnDefs}
          isLoading={isLoading}
          onRefresh={fetchData}
          currentUser={currentUser?.email || currentUser?.username || 'admin'}
          showToast={showToast}
          exportFilename="Contact_Persons_Directory"
          defaultPageSize={25}
          primaryAction={{
            label: 'Add Contact Person',
            onClick: handleOpenCreate,
            id: 'ag-primary-add-contact'
          }}
        />
      ) : (
        <>
          {/* Search and Filter Toolstrip */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '440px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="contact-person-search"
              type="text"
              placeholder="Search by name, organization, designation, phone..."
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

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status:
            </span>
            {['all', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase()}`}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: statusFilter === status ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  backgroundColor: statusFilter === status ? 'var(--primary-50)' : 'transparent',
                  color: statusFilter === status ? 'var(--primary-700)' : 'var(--text-muted)'
                }}
              >
                {status === 'all' ? `All (${totalCount})` : `${status} (${status === 'Active' ? activeCount : inactiveCount})`}
              </button>
            ))}
          </div>

          {/* Column Visibility Dropdown */}
          <ColumnVisibilityDropdown
            columns={contactColumns}
            visibleColumns={visibleContactCols}
            onToggle={toggleContactCol}
            onReset={resetContactCols}
            onShowAll={showAllContactCols}
          />

          {/* Export to Excel */}
          <ExportExcelButton
            data={filteredContacts}
            columns={CONTACT_PERSON_EXPORT_COLUMNS}
            filename="Contact_Persons"
            sheetName="Contacts"
            showToast={showToast}
          />
        </div>
      </div>

      {/* Contact Persons Data Table */}
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
                {isContactColVisible('index') && <th style={{ padding: '14px 18px', width: '50px' }}>#</th>}
                {isContactColVisible('name') && <th style={{ padding: '14px 18px' }}>Contact Person Name</th>}
                {isContactColVisible('organization') && <th style={{ padding: '14px 18px' }}>Customer Organization Name</th>}
                {isContactColVisible('designation') && <th style={{ padding: '14px 18px' }}>Designation / Role</th>}
                {isContactColVisible('mobile') && <th style={{ padding: '14px 18px' }}>Mobile Number</th>}
                {isContactColVisible('email') && <th style={{ padding: '14px 18px' }}>Email</th>}
                {isContactColVisible('status') && <th style={{ padding: '14px 18px' }}>Status</th>}
                {isContactColVisible('actions') && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={visibleContactCols.length} style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Users size={36} color="var(--border-strong)" />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        No Contact Persons Found
                      </div>
                      <div style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                        {searchTerm ? 'No results matched your search query. Try clearing the filter.' : 'Click "Add Contact Person" above to create your first stakeholder.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact, index) => (
                  <tr 
                    key={contact._id || index}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* S.No */}
                    {isContactColVisible('index') && (
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                    )}

                    {/* Contact Person Name */}
                    {isContactColVisible('name') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%)',
                            color: 'var(--primary-800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {contact.name}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Customer Organization Name */}
                    {isContactColVisible('organization') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                          <Building2 size={15} color="var(--primary-600)" />
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {contact.customerOrganizationName || '—'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Designation / Role */}
                    {isContactColVisible('designation') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                          <Briefcase size={14} color="var(--text-muted)" />
                          <span>{contact.designation || '—'}</span>
                        </div>
                      </td>
                    )}

                    {/* Mobile Number */}
                    {isContactColVisible('mobile') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} color="#10b981" />
                          <a 
                            href={`tel:${contact.mobileNumber}`} 
                            style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}
                            title="Call Contact"
                          >
                            {contact.mobileNumber || '—'}
                          </a>
                        </div>
                      </td>
                    )}

                    {/* Email */}
                    {isContactColVisible('email') && (
                      <td style={{ padding: '14px 18px' }}>
                        {contact.email ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} color="var(--text-muted)" />
                            <a 
                              href={`mailto:${contact.email}`} 
                              style={{ color: 'var(--primary-600)', textDecoration: 'none' }}
                              title="Send Email"
                            >
                              {contact.email}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    )}

                    {/* Status */}
                    {isContactColVisible('status') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: contact.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                          color: contact.status === 'Active' ? '#059669' : '#64748b'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: contact.status === 'Active' ? '#10b981' : '#94a3b8'
                          }} />
                          {contact.status || 'Active'}
                        </span>
                      </td>
                    )}

                    {/* Actions Column with Edit and Delete icons */}
                    {isContactColVisible('actions') && (
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            id={`edit-contact-btn-${contact._id || index}`}
                            onClick={() => handleOpenEdit(contact)}
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
                            title="Edit Contact Person"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            id={`delete-contact-btn-${contact._id || index}`}
                            onClick={() => setDeleteConfirmId(contact._id)}
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
                            title="Delete Contact Person"
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

      {/* Form Modal for Create & Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-600)'
                }}>
                  {editingItem ? <Edit size={18} /> : <PlusCircle size={18} />}
                </div>
                <span>{editingItem ? 'Edit Contact Person' : 'Create Contact Person'}</span>
              </div>
              <button 
                id="modal-close-btn"
                onClick={() => setIsModalOpen(false)} 
                style={{ color: 'var(--text-light)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                {/* Contact Person Name input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name-input" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Contact Person Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="contact-name-input"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ paddingLeft: '36px' }}
                      required
                    />
                  </div>
                </div>

                {/* Customer Organization Name dropdown (from customer master) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-org-select" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Customer Organization Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <select
                      id="contact-org-select"
                      className="form-control"
                      value={formData.customerOrganizationName}
                      onChange={(e) => setFormData({ ...formData, customerOrganizationName: e.target.value })}
                      style={{ paddingLeft: '36px' }}
                      required
                    >
                      <option value="">-- Select Customer Organization --</option>
                      {customerOptions.map(org => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Designation / Role dropdown (from master) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-designation-select" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Designation / Role (from Master) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <select
                      id="contact-designation-select"
                      className="form-control"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      style={{ paddingLeft: '36px' }}
                      required
                    >
                      <option value="">-- Select Designation / Role --</option>
                      {formData.designation && !designationOptions.includes(formData.designation) && (
                        <option value={formData.designation}>{formData.designation}</option>
                      )}
                      {designationOptions.map(desig => (
                        <option key={desig} value={desig}>{desig}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile Number input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-mobile-input" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="contact-mobile-input"
                      type="tel"
                      className="form-control"
                      placeholder="e.g. +91 98230 44122"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      style={{ paddingLeft: '36px' }}
                      required
                    />
                  </div>
                </div>

                {/* Email input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email-input" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'block' }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="contact-email-input"
                      type="email"
                      className="form-control"
                      placeholder="e.g. contact@organization.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                </div>

                {/* Status Radio button type (Active / Inactive) */}
                <div className="form-group" style={{ marginTop: '4px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                    Status <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <input
                        id="status-radio-active"
                        type="radio"
                        name="status"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        Active
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <input
                        id="status-radio-inactive"
                        type="radio"
                        name="status"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                        Inactive
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  id="btn-submit-contact-form"
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? <RefreshCw size={16} className="spin-icon" /> : null}
                  <span>{editingItem ? 'Save Changes' : 'Create Contact Person'}</span>
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
              Delete Contact Person?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this contact record? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-contact"
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
