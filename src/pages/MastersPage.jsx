import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  GitFork, 
  Award, 
  Receipt, 
  Fuel, 
  Factory, 
  Cpu, 
  FolderTree, 
  Package, 
  CheckSquare, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle, 
  X, 
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import ExportExcelButton from '../components/ExportExcelButton';

const MASTER_EXPORT_COLUMNS_CONFIG = {
  branches: [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Branch Code', transform: (v, r) => r.code || '' },
    { key: 'branchName', label: 'Branch Name', transform: (v, r) => r.branchName || '' },
    { key: 'city', label: 'City', transform: (v, r) => r.city || '' },
    { key: 'manager', label: 'Branch Manager', transform: (v, r) => r.manager || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  departments: [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Department Code', transform: (v, r) => r.code || '' },
    { key: 'departmentName', label: 'Department Name', transform: (v, r) => r.departmentName || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  designations: [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Designation Code', transform: (v, r) => r.code || '' },
    { key: 'designationTitle', label: 'Designation Title', transform: (v, r) => r.designationTitle || '' },
    { key: 'level', label: 'Level', transform: (v, r) => r.level || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  'expense-heads': [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Code', transform: (v, r) => r.code || '' },
    { key: 'expenseHeadName', label: 'Expense Head Name', transform: (v, r) => r.expenseHeadName || '' },
    { key: 'receiptRequired', label: 'Receipt Required', transform: (v, r) => r.receiptRequired || '' },
    { key: 'requiresKm', label: 'Requires KM', transform: (v, r) => r.requiresKm || '' },
    { key: 'defaultRate', label: 'Default Rate (₹)', transform: (v, r) => r.defaultRate || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  'grade-fuel-rates': [
    { key: 'index', label: 'S.No' },
    { key: 'gradeCode', label: 'Grade Code', transform: (v, r) => r.gradeCode || '' },
    { key: 'gradeName', label: 'Grade Name', transform: (v, r) => r.gradeName || '' },
    { key: 'fuelRate', label: 'Fuel Rate (₹/KM)', transform: (v, r) => r.fuelRate || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  industries: [
    { key: 'index', label: 'S.No' },
    { key: 'industryCode', label: 'Industry Code', transform: (v, r) => r.industryCode || '' },
    { key: 'industrySegmentName', label: 'Industry Segment Name', transform: (v, r) => r.industrySegmentName || '' },
    { key: 'description', label: 'Description', transform: (v, r) => r.description || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  principals: [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Code', transform: (v, r) => r.code || '' },
    { key: 'principalName', label: 'Principal / OEM Brand', transform: (v, r) => r.principalName || '' },
    { key: 'country', label: 'Country', transform: (v, r) => r.country || '' },
    { key: 'contactPerson', label: 'Contact Person', transform: (v, r) => r.contactPerson || '' },
    { key: 'contactEmail', label: 'Email', transform: (v, r) => r.contactEmail || '' },
    { key: 'contactPhone', label: 'Phone', transform: (v, r) => r.contactPhone || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  categories: [
    { key: 'index', label: 'S.No' },
    { key: 'category', label: 'Category Name', transform: (v, r) => r.category || '' },
    { key: 'description', label: 'Description', transform: (v, r) => r.description || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  products: [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Product Code', transform: (v, r) => r.code || '' },
    { key: 'productName', label: 'Product Name', transform: (v, r) => r.productName || '' },
    { key: 'principal', label: 'Principal', transform: (v, r) => r.principal || '' },
    { key: 'category', label: 'Category', transform: (v, r) => r.category || '' },
    { key: 'unitPrice', label: 'Unit Price (₹)', transform: (v, r) => r.unitPrice || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ],
  'activity-types': [
    { key: 'index', label: 'S.No' },
    { key: 'code', label: 'Activity Code', transform: (v, r) => r.code || '' },
    { key: 'activityName', label: 'Activity Name', transform: (v, r) => r.activityName || '' },
    { key: 'targetRole', label: 'Target Role', transform: (v, r) => r.targetRole || '' },
    { key: 'description', label: 'Description', transform: (v, r) => r.description || '' },
    { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
  ]
};

const EMPTY_MASTERS = {
  branches: [],
  departments: [],
  designations: [],
  'expense-heads': [],
  'grade-fuel-rates': [],
  industries: [],
  principals: [],
  categories: [],
  products: [],
  'activity-types': []
};

const INITIAL_DROPDOWNS = {
  managers: [],
  principals: [],
  categories: [],
  contactPersons: []
};

export default function MastersPage({ showToast }) {
  // Active Master Tab
  const [activeTab, setActiveTab] = useState('branches');

  // Master Data store (per masterType)
  const [masterData, setMasterData] = useState(EMPTY_MASTERS);
  const [dropdownOptions, setDropdownOptions] = useState(INITIAL_DROPDOWNS);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Create, object = Edit (PUT)
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');

  // Master Tab Definitions
  const MASTER_TABS = [
    { id: 'branches', label: 'Branch', icon: Building2, singular: 'Branch' },
    { id: 'departments', label: 'Department', icon: GitFork, singular: 'Department' },
    { id: 'designations', label: 'Designation', icon: Award, singular: 'Designation' },
    { id: 'expense-heads', label: 'Expense-Heads', icon: Receipt, singular: 'Expense Head' },
    { id: 'grade-fuel-rates', label: 'Grade-Fuel-Rates', icon: Fuel, singular: 'Grade Fuel Rate' },
    { id: 'industries', label: 'Industries', icon: Factory, singular: 'Industry' },
    { id: 'principals', label: 'Principals / OEM Brands', icon: Cpu, singular: 'Principal / OEM Brand' },
    { id: 'categories', label: 'Category', icon: FolderTree, singular: 'Category' },
    { id: 'products', label: 'Products', icon: Package, singular: 'Product' },
    { id: 'activity-types', label: 'Activity-Types', icon: CheckSquare, singular: 'Activity Type' },
  ];

  const currentTabDef = MASTER_TABS.find(t => t.id === activeTab) || MASTER_TABS[0];

  // Fetch live master data on mount & tab change
  const fetchCurrentMasterData = async (tabId) => {
    setIsLoading(true);
    const items = await api.getMasterItems(tabId);
    setMasterData(prev => ({ ...prev, [tabId]: Array.isArray(items) ? items : [] }));

    // Refresh dynamic dropdowns from Masters & Employees
    const [dropdowns, empList] = await Promise.all([
      api.getMasterDropdowns(),
      api.getEmployees()
    ]);

    // Build comprehensive manager list from all employees in employee master
    let managersList = [];
    if (Array.isArray(empList) && empList.length > 0) {
      managersList = empList.map(e => e.designation ? `${e.fullName} (${e.designation})` : e.fullName);
    } else if (dropdowns?.managers) {
      managersList = dropdowns.managers;
    }

    setDropdownOptions(prev => ({
      ...prev,
      ...(dropdowns || {}),
      managers: managersList,
      principals: dropdowns?.principals || prev.principals || [],
      categories: dropdowns?.categories || prev.categories || [],
      contactPersons: dropdowns?.contactPersons || prev.contactPersons || []
    }));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCurrentMasterData(activeTab);
  }, [activeTab]);

  // Open Create Form Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormError('');

    // Set initial defaults according to active master
    let defaults = { status: 'Active' };
    if (activeTab === 'branches') {
      defaults = { code: '', branchName: '', city: '', manager: '', status: 'Active' };
    } else if (activeTab === 'departments') {
      defaults = { code: '', departmentName: '', status: 'Active' };
    } else if (activeTab === 'designations') {
      defaults = { code: '', designationTitle: '', status: 'Active' };
    } else if (activeTab === 'expense-heads') {
      defaults = { code: '', expenseHeadName: '', receiptRequired: 'No Bill', requiresKm: 'No', defaultRate: '', status: 'Active' };
    } else if (activeTab === 'grade-fuel-rates') {
      defaults = { gradeCode: '', gradeName: '', fuelRate: '', status: 'Active' };
    } else if (activeTab === 'industries') {
      defaults = { industryCode: '', industrySegmentName: '', description: '', status: 'Active' };
    } else if (activeTab === 'principals') {
      defaults = { code: '', principalName: '', country: '', contactPerson: '', contactEmail: '', contactPhone: '', status: 'Active' };
    } else if (activeTab === 'categories') {
      defaults = { category: '', description: '', status: 'Active' };
    } else if (activeTab === 'products') {
      defaults = {
        code: '',
        productName: '',
        principal: dropdownOptions.principals?.[0] || '',
        category: dropdownOptions.categories?.[0] || '',
        targetRole: 'Sales',
        accessibleRole: 'Sales',
        unitPrice: '',
        status: 'Active'
      };
    } else if (activeTab === 'activity-types') {
      defaults = {
        code: '',
        activityName: '',
        targetRole: 'Sales',
        accessibleRole: 'Sales',
        description: '',
        status: 'Active'
      };
    }

    setFormData(defaults);
    setIsModalOpen(true);
  };

  // Open Edit Form Modal (PUT)
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormError('');
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Submit Form (Create POST / Update PUT)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Required field validation
    if (activeTab === 'branches' && (!formData.code || !formData.branchName || !formData.city)) {
      setFormError('Please enter Code, Branch Name, and City.');
      return;
    }
    if (activeTab === 'departments' && (!formData.code || !formData.departmentName)) {
      setFormError('Please enter Code and Department Name.');
      return;
    }
    if (activeTab === 'designations' && (!formData.code || !formData.designationTitle)) {
      setFormError('Please enter Code and Designation Title.');
      return;
    }
    if (activeTab === 'expense-heads' && (!formData.code || !formData.expenseHeadName)) {
      setFormError('Please enter Code and Expense Head Name.');
      return;
    }
    if (activeTab === 'grade-fuel-rates' && (!formData.gradeCode || !formData.gradeName || formData.fuelRate === undefined)) {
      setFormError('Please enter Grade Code, Grade Name, and Fuel Rate.');
      return;
    }
    if (activeTab === 'industries' && (!formData.industryCode || !formData.industrySegmentName)) {
      setFormError('Please enter Industry Code and Industry Segment Name.');
      return;
    }
    if (activeTab === 'principals' && (!formData.code || !formData.principalName || !formData.country)) {
      setFormError('Please enter Code, Principal/OEM Name, and Country.');
      return;
    }
    if (activeTab === 'categories' && !formData.category) {
      setFormError('Please enter Category Name.');
      return;
    }
    if (activeTab === 'products' && (!formData.code || !formData.productName)) {
      setFormError('Please enter Product Code and Product Name.');
      return;
    }
    if (activeTab === 'activity-types' && (!formData.code || !formData.activityName)) {
      setFormError('Please enter Activity Code and Activity Name.');
      return;
    }

    if (editingItem) {
      // PUT API
      const itemId = editingItem._id;
      const res = await api.updateMasterItem(activeTab, itemId, formData);
      if (res && res.success === false) {
        setFormError(res.message || 'Failed to update item');
        return;
      }

      setMasterData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item => item._id === itemId ? { ...item, ...formData } : item)
      }));

      if (showToast) showToast(`${currentTabDef.singular} updated successfully!`);
    } else {
      // POST API
      const res = await api.createMasterItem(activeTab, formData);
      if (res && res.success === false) {
        setFormError(res.message || 'Failed to create item');
        return;
      }

      const newItem = res?.item || { ...formData, _id: `local-${Date.now()}` };
      setMasterData(prev => ({
        ...prev,
        [activeTab]: [newItem, ...prev[activeTab]]
      }));

      if (showToast) showToast(`${currentTabDef.singular} created successfully!`);
    }

    setIsModalOpen(false);
  };

  // Delete Action (DELETE API)
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(`Are you sure you want to delete this ${currentTabDef.singular} record?`)) {
      return;
    }

    const res = await api.deleteMasterItem(activeTab, itemId);
    if (res && res.success === false) {
      alert(res.message || 'Failed to delete record');
      return;
    }

    setMasterData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(item => item._id !== itemId)
    }));

    if (showToast) showToast(`${currentTabDef.singular} record deleted.`);
  };

  // Filter items based on search and status
  const currentItems = masterData[activeTab] || [];
  const filteredItems = currentItems.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return Object.values(item).some(val => 
        val && typeof val === 'string' && val.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page-body animate-fade-in">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--primary-600)',
              backgroundColor: 'var(--primary-50)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)'
            }}>
              CRM Master Setup
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Master Data & Configuration
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure branches, organizational departments, designations, expense policies, and product catalogs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-refresh-masters"
            onClick={() => fetchCurrentMasterData(activeTab)}
            className="btn btn-secondary btn-sm"
            title="Refresh master records from MongoDB"
          >
            <RefreshCw size={15} />
            <span>Sync DB</span>
          </button>

          <button
            id="btn-create-master"
            onClick={handleOpenCreate}
            className="btn btn-primary"
          >
            <PlusCircle size={18} />
            <span>Add New {currentTabDef.singular}</span>
          </button>
        </div>
      </div>

      {/* 10 Master Tabs Bar */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '10px 14px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {MASTER_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = (masterData[tab.id] || []).length;

          return (
            <button
              key={tab.id}
              id={`master-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: isActive ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-main)',
                color: isActive ? '#fff' : 'var(--text-light)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            id="master-search-input"
            type="text"
            placeholder={`Search ${currentTabDef.label}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              color: 'var(--text-main)'
            }}
          />
        </div>

        {/* Status Filter & Excel Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            {['all', 'Active', 'Inactive'].map(s => (
              <button
                key={s}
                id={`status-filter-${s}`}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: statusFilter === s ? 'var(--primary-600)' : 'var(--bg-main)',
                  color: statusFilter === s ? '#fff' : 'var(--text-muted)',
                  border: statusFilter === s ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Export to Excel */}
          <ExportExcelButton
            data={filteredItems}
            columns={MASTER_EXPORT_COLUMNS_CONFIG[activeTab] || [
              { key: 'index', label: 'S.No' },
              { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
            ]}
            filename={`Master_${(currentTabDef.label || 'Data').replace(/[^a-zA-Z0-9]/g, '_')}`}
            sheetName={(currentTabDef.label || 'Master').substring(0, 30)}
            showToast={showToast}
          />
        </div>
      </div>

      {/* Master Data Table */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--bg-main)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {renderTableHeaders(activeTab)}
                {activeTab !== 'activity-types' && (
                  <th style={{ padding: '14px 18px' }}>Status</th>
                )}
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={32} color="var(--text-light)" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>No {currentTabDef.label} records found</span>
                      <button
                        onClick={handleOpenCreate}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '6px' }}
                      >
                        <PlusCircle size={14} />
                        <span>Add First Record</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={item._id || index}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {renderTableRowData(activeTab, item)}
                    {activeTab !== 'activity-types' && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: item.status === 'Active' ? '#059669' : '#f1f5f9',
                          color: item.status === 'Active' ? '#ffffff' : '#64748b'
                        }}>
                          {item.status}
                        </span>
                      </td>
                    )}
                    {/* Actions Column with Edit and Delete icons */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          id={`edit-btn-${item._id || index}`}
                          onClick={() => handleOpenEdit(item)}
                          className="btn-icon"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#6366f1',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Edit Record"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          id={`delete-btn-${item._id || index}`}
                          onClick={() => handleDeleteItem(item._id)}
                          className="btn-icon"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal for Create & Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingItem ? <Edit size={20} color="var(--primary-600)" /> : <PlusCircle size={20} color="var(--primary-600)" />}
                <span>{editingItem ? `Edit ${currentTabDef.singular}` : `Create New ${currentTabDef.singular}`}</span>
              </div>
              <button 
                id="modal-close-btn"
                onClick={() => setIsModalOpen(false)} 
                style={{ color: 'var(--text-light)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--status-cancelled-bg)',
                    color: 'var(--status-cancelled)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Render Form Inputs specific to active master */}
                {renderFormFields(activeTab, formData, setFormData, dropdownOptions)}

                {/* Status Radio Type Button (Active / Inactive) */}
                <div className="form-group" style={{ marginTop: '18px' }}>
                  <label className="form-label">Status *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <input
                        id="status-radio-active"
                        type="radio"
                        name="status"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                      />
                      <span>Active</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <input
                        id="status-radio-inactive"
                        type="radio"
                        name="status"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{ accentColor: '#ef4444', width: '16px', height: '16px' }}
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  id="btn-submit-master-form"
                  type="submit" 
                  className="btn btn-primary"
                >
                  {editingItem ? 'Save Changes' : `Create ${currentTabDef.singular}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Helper: Render Table Headers per master
// -------------------------------------------------------------
function renderTableHeaders(tab) {
  switch (tab) {
    case 'branches':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Branch Name</th>
          <th style={{ padding: '14px 18px' }}>City</th>
          <th style={{ padding: '14px 18px' }}>Mapped Branch Manager</th>
        </>
      );
    case 'departments':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Department Name</th>
        </>
      );
    case 'designations':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Designation Title</th>
        </>
      );
    case 'expense-heads':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Expense Head Name</th>
          <th style={{ padding: '14px 18px' }}>Receipt Required</th>
          <th style={{ padding: '14px 18px' }}>Requires Km</th>
          <th style={{ padding: '14px 18px' }}>Default Rate (₹)</th>
        </>
      );
    case 'grade-fuel-rates':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Grade Code</th>
          <th style={{ padding: '14px 18px' }}>Grade Name</th>
          <th style={{ padding: '14px 18px' }}>Fuel Rate (₹ / km)</th>
        </>
      );
    case 'industries':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Industry Code</th>
          <th style={{ padding: '14px 18px' }}>Industry Segment Name</th>
          <th style={{ padding: '14px 18px' }}>Description / Details</th>
        </>
      );
    case 'principals':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Principal / OEM Name</th>
          <th style={{ padding: '14px 18px' }}>Country / Origin</th>
          <th style={{ padding: '14px 18px' }}>Contact Person</th>
          <th style={{ padding: '14px 18px' }}>Contact Email</th>
          <th style={{ padding: '14px 18px' }}>Contact Phone</th>
        </>
      );
    case 'categories':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Category</th>
          <th style={{ padding: '14px 18px' }}>Description</th>
        </>
      );
    case 'products':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Machine Product Name</th>
          <th style={{ padding: '14px 18px' }}>Principal</th>
          <th style={{ padding: '14px 18px' }}>Target Role</th>
          <th style={{ padding: '14px 18px' }}>Category</th>
          <th style={{ padding: '14px 18px' }}>Unit Price (₹)</th>
        </>
      );
    case 'activity-types':
      return (
        <>
          <th style={{ padding: '14px 18px' }}>Code</th>
          <th style={{ padding: '14px 18px' }}>Activity Name</th>
          <th style={{ padding: '14px 18px' }}>Target Role</th>
          <th style={{ padding: '14px 18px' }}>Description</th>
        </>
      );
    default:
      return null;
  }
}

// -------------------------------------------------------------
// Helper: Render Row Data per master
// -------------------------------------------------------------
function renderTableRowData(tab, item) {
  switch (tab) {
    case 'branches':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.branchName}</td>
          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.city}</td>
          <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>{item.manager}</td>
        </>
      );
    case 'departments':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.departmentName}</td>
        </>
      );
    case 'designations':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.designationTitle}</td>
        </>
      );
    case 'expense-heads':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.expenseHeadName}</td>
          <td style={{ padding: '14px 18px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: item.receiptRequired === 'Bill Required' ? '#fef3c7' : '#f1f5f9',
              color: item.receiptRequired === 'Bill Required' ? '#b45309' : '#64748b'
            }}>
              {item.receiptRequired}
            </span>
          </td>
          <td style={{ padding: '14px 18px' }}>{item.requiresKm}</td>
          <td style={{ padding: '14px 18px', fontWeight: 700 }}>₹ {item.defaultRate}</td>
        </>
      );
    case 'grade-fuel-rates':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.gradeCode}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.gradeName}</td>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--primary-700)' }}>₹ {item.fuelRate} / km</td>
        </>
      );
    case 'industries':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.industryCode}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.industrySegmentName}</td>
          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.description || '—'}</td>
        </>
      );
    case 'principals':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 600 }}>{item.principalName}</td>
          <td style={{ padding: '14px 18px' }}>{item.country}</td>
          <td style={{ padding: '14px 18px' }}>{item.contactPerson || '—'}</td>
          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.contactEmail || '—'}</td>
          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.contactPhone || '—'}</td>
        </>
      );
    case 'categories':
      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.category}</td>
          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.description || '—'}</td>
        </>
      );
    case 'products': {
      const role = item.targetRole || item.accessibleRole || 'Sales';
      let roleBg = '#ea580c';
      if (role === 'Service' || role.includes('Service')) {
        roleBg = '#2563eb';
      } else if (role === 'All Roles' || role.includes('All')) {
        roleBg = '#64748b';
      }
      const displayRole = role.includes('Sales') ? 'Sales' : role.includes('Service') ? 'Service' : 'All Roles';

      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-main)' }}>{item.productName}</td>
          <td style={{ padding: '14px 18px' }}>
            <span style={{
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              fontSize: '0.78rem',
              fontWeight: 500,
              backgroundColor: '#ffffff',
              color: '#334155'
            }}>
              {item.principal || '—'}
            </span>
          </td>
          <td style={{ padding: '14px 18px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 12px',
              borderRadius: '16px',
              backgroundColor: roleBg,
              color: '#ffffff'
            }}>
              {displayRole}
            </span>
          </td>
          <td style={{ padding: '14px 18px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '3px 12px',
              borderRadius: '16px',
              border: '1px solid #93c5fd',
              backgroundColor: '#eff6ff',
              color: '#0284c7'
            }}>
              {item.category || '—'}
            </span>
          </td>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>
            ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
          </td>
        </>
      );
    }
    case 'activity-types': {
      const role = item.targetRole || item.accessibleRole || 'Sales';
      let roleBg = '#ea580c';
      if (role === 'Service' || role.includes('Service')) {
        roleBg = '#2563eb';
      } else if (role === 'All Roles' || role.includes('All')) {
        roleBg = '#64748b';
      }
      const displayRole = role.includes('Sales') ? 'Sales' : role.includes('Service') ? 'Service' : 'All Roles';

      return (
        <>
          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{item.code}</td>
          <td style={{ padding: '14px 18px', fontWeight: 500, color: 'var(--text-main)' }}>{item.activityName}</td>
          <td style={{ padding: '14px 18px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 12px',
              borderRadius: '16px',
              backgroundColor: roleBg,
              color: '#ffffff'
            }}>
              {displayRole}
            </span>
          </td>
          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{item.description || '—'}</td>
        </>
      );
    }
    default:
      return null;
  }
}

// -------------------------------------------------------------
// Helper: Render Dynamic Form Inputs per master
// -------------------------------------------------------------
function renderFormFields(tab, formData, setFormData, dropdownOptions) {
  switch (tab) {
    case 'branches':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                id="branch-code-input"
                type="text"
                className="form-control"
                placeholder="e.g. BR-BLR-01"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Branch Name *</label>
              <input
                id="branch-name-input"
                type="text"
                className="form-control"
                placeholder="e.g. Bangalore Central Branch"
                value={formData.branchName || ''}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                id="branch-city-input"
                type="text"
                className="form-control"
                placeholder="e.g. Bangalore"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mapped Branch Manager *</label>
              <select
                id="branch-manager-select"
                className="form-control"
                value={formData.manager || ''}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                required
              >
                <option value="">-- Select Branch Manager from Employee Master --</option>
                {formData.manager && !dropdownOptions.managers.includes(formData.manager) && (
                  <option value={formData.manager}>{formData.manager}</option>
                )}
                {dropdownOptions.managers.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      );

    case 'departments':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              id="department-code-input"
              type="text"
              className="form-control"
              placeholder="e.g. DEP-01"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              id="department-name-input"
              type="text"
              className="form-control"
              placeholder="e.g. Field Sales & Business Development"
              value={formData.departmentName || ''}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              required
            />
          </div>
        </div>
      );

    case 'designations':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Code *</label>
            <input
              id="designation-code-input"
              type="text"
              className="form-control"
              placeholder="e.g. DES-01"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Designation Title *</label>
            <input
              id="designation-title-input"
              type="text"
              className="form-control"
              placeholder="e.g. Senior Field Sales Officer"
              value={formData.designationTitle || ''}
              onChange={(e) => setFormData({ ...formData, designationTitle: e.target.value })}
              required
            />
          </div>
        </div>
      );

    case 'expense-heads':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                id="expense-code-input"
                type="text"
                className="form-control"
                placeholder="e.g. EXP-01"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expense Head Name *</label>
              <input
                id="expense-name-input"
                type="text"
                className="form-control"
                placeholder="e.g. Two-Wheeler Fuel Allowance"
                value={formData.expenseHeadName || ''}
                onChange={(e) => setFormData({ ...formData, expenseHeadName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Receipt Required *</label>
              <select
                id="expense-receipt-select"
                className="form-control"
                value={formData.receiptRequired || 'Bill Required'}
                onChange={(e) => setFormData({ ...formData, receiptRequired: e.target.value })}
              >
                <option value="No Bill">No Bill</option>
                <option value="Bill Required">Bill Required</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Requires Km *</label>
              <select
                id="expense-km-select"
                className="form-control"
                value={formData.requiresKm || 'No'}
                onChange={(e) => setFormData({ ...formData, requiresKm: e.target.value })}
              >
                <option value="Yes (Fuel)">Yes (Fuel)</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Rate (₹)</label>
              <input
                id="expense-rate-input"
                type="number"
                step="0.5"
                className="form-control"
                placeholder="0.00"
                value={formData.defaultRate ?? 0}
                onChange={(e) => setFormData({ ...formData, defaultRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </>
      );

    case 'grade-fuel-rates':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Grade Code *</label>
            <input
              id="grade-code-input"
              type="text"
              className="form-control"
              placeholder="e.g. GRD-A"
              value={formData.gradeCode || ''}
              onChange={(e) => setFormData({ ...formData, gradeCode: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Grade Name *</label>
            <input
              id="grade-name-input"
              type="text"
              className="form-control"
              placeholder="e.g. Senior Executive / Lead"
              value={formData.gradeName || ''}
              onChange={(e) => setFormData({ ...formData, gradeName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fuel Rate (₹ / km) *</label>
            <input
              id="grade-rate-input"
              type="number"
              step="0.1"
              className="form-control"
              placeholder="e.g. 8.5"
              value={formData.fuelRate ?? ''}
              onChange={(e) => setFormData({ ...formData, fuelRate: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
        </div>
      );

    case 'industries':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Industry Code *</label>
              <input
                id="industry-code-input"
                type="text"
                className="form-control"
                placeholder="e.g. IND-01"
                value={formData.industryCode || ''}
                onChange={(e) => setFormData({ ...formData, industryCode: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Industry Segment Name *</label>
              <input
                id="industry-name-input"
                type="text"
                className="form-control"
                placeholder="e.g. Healthcare & Diagnostics"
                value={formData.industrySegmentName || ''}
                onChange={(e) => setFormData({ ...formData, industrySegmentName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description / Segment Details</label>
            <textarea
              id="industry-desc-input"
              className="form-control"
              rows="3"
              placeholder="Segment characteristics, typical clientele..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </>
      );

    case 'principals':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                id="principal-code-input"
                type="text"
                className="form-control"
                placeholder="e.g. OEM-01"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Principal / OEM Name *</label>
              <input
                id="principal-name-input"
                type="text"
                className="form-control"
                placeholder="e.g. Siemens Healthineers"
                value={formData.principalName || ''}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Country / Origin *</label>
              <input
                id="principal-country-input"
                type="text"
                className="form-control"
                placeholder="e.g. Germany"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Contact Person (from Contact Person Master)</label>
              <select
                id="principal-person-select"
                className="form-control"
                value={formData.contactPerson || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = (dropdownOptions.contactPersons || []).find(
                    cp => (typeof cp === 'string' ? cp : cp.name) === val
                  );
                  setFormData({
                    ...formData,
                    contactPerson: val,
                    contactEmail: (found && typeof found === 'object' && found.email) ? found.email : formData.contactEmail,
                    contactPhone: (found && typeof found === 'object' && found.phone) ? found.phone : formData.contactPhone
                  });
                }}
              >
                <option value="">-- Select Contact Person from Master --</option>
                {(dropdownOptions.contactPersons || []).map((cp, idx) => {
                  const name = typeof cp === 'string' ? cp : cp.name;
                  return <option key={idx} value={name}>{name}</option>;
                })}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                id="principal-email-input"
                type="email"
                className="form-control"
                placeholder="contact@brand.com"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                id="principal-phone-input"
                type="text"
                className="form-control"
                placeholder="+49 89 636 00"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>
        </>
      );

    case 'categories':
      return (
        <>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <input
              id="category-name-input"
              type="text"
              className="form-control"
              placeholder="e.g. Diagnostic Imaging Equipment"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="category-desc-input"
              className="form-control"
              rows="3"
              placeholder="Description of category goods or services..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </>
      );

    case 'products':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                id="product-code-input"
                type="text"
                className="form-control"
                placeholder="e.g. PRD-CNC-PRESS"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Machine Product Name *</label>
              <input
                id="product-name-input"
                type="text"
                className="form-control"
                placeholder="e.g. Hydraulic Press Brake 100T"
                value={formData.productName || ''}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Principal *</label>
              <select
                id="product-principal-select"
                className="form-control"
                value={formData.principal || ''}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                required
              >
                <option value="">-- Select Principal --</option>
                {dropdownOptions.principals.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                id="product-category-select"
                className="form-control"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">-- Select Category --</option>
                {dropdownOptions.categories.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Target Role *</label>
              <select
                id="product-role-select"
                className="form-control"
                value={formData.targetRole || formData.accessibleRole || 'Sales'}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value, accessibleRole: e.target.value })}
              >
                <option value="Sales">Sales</option>
                <option value="Service">Service</option>
                <option value="All Roles">All Roles</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₹)</label>
              <input
                id="product-price-input"
                type="number"
                className="form-control"
                placeholder="e.g. 3500000"
                value={formData.unitPrice ?? 0}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </>
      );

    case 'activity-types':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Code *</label>
              <input
                id="activity-code-input"
                type="text"
                className="form-control"
                placeholder="e.g. ACT-SALES"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Activity Name *</label>
              <input
                id="activity-name-input"
                type="text"
                className="form-control"
                placeholder="e.g. Sales Pitch / Discovery"
                value={formData.activityName || ''}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Role *</label>
            <select
              id="activity-role-select"
              className="form-control"
              value={formData.targetRole || formData.accessibleRole || 'Sales'}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value, accessibleRole: e.target.value })}
            >
              <option value="Sales">Sales</option>
              <option value="Service">Service</option>
              <option value="All Roles">All Roles</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="activity-desc-input"
              className="form-control"
              rows="3"
              placeholder="e.g. Initial client meeting and presentation"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </>
      );

    default:
      return null;
  }
}
