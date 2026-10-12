import React, { useState, useEffect } from 'react';
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
  Building2,
  Building,
  Award,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react';
import { api } from '../services/api';
import useColumnVisibility from '../hooks/useColumnVisibility';
import ColumnVisibilityDropdown from '../components/ColumnVisibilityDropdown';
import ExportExcelButton from '../components/ExportExcelButton';

const EMPLOYEE_EXPORT_COLUMNS = [
  { key: 'index', label: 'S.No' },
  { key: 'fullName', label: 'Full Name', transform: (v, r) => r.fullName || '' },
  { key: 'employeeCode', label: 'Employee Code', transform: (v, r) => r.employeeCode || '' },
  { key: 'department', label: 'Department', transform: (v, r) => r.department || '' },
  { key: 'designation', label: 'Designation', transform: (v, r) => r.designation || '' },
  { key: 'branch', label: 'Branch Office', transform: (v, r) => r.branch || '' },
  { key: 'employeeGrade', label: 'Grade & Level', transform: (v, r) => r.employeeGrade || '' },
  { key: 'securityRole', label: 'Security Role', transform: (v, r) => r.securityRole || '' },
  { key: 'mobileNo', label: 'Mobile Number', transform: (v, r) => r.mobileNo || r.mobile || '' },
  { key: 'emailAddress', label: 'Email Address', transform: (v, r) => r.emailAddress || r.email || '' },
  { key: 'joiningDate', label: 'Joining Date', transform: (v, r) => r.joiningDate ? String(r.joiningDate).split('T')[0] : '' },
  { key: 'status', label: 'Status', transform: (v, r) => r.status || '' }
];

const EMPLOYEE_COLUMNS = [
  { key: 'index', label: '#', defaultVisible: true, locked: true },
  { key: 'employee', label: 'Employee Name & Code', defaultVisible: true },
  { key: 'department', label: 'Department', defaultVisible: true },
  { key: 'designation', label: 'Designation', defaultVisible: true },
  { key: 'branch', label: 'Branch Office', defaultVisible: true },
  { key: 'grade', label: 'Grade & Level', defaultVisible: true },
  { key: 'securityRole', label: 'Security Role', defaultVisible: true },
  { key: 'mobile', label: 'Mobile Contact', defaultVisible: true },
  { key: 'joiningDate', label: 'Joining Date', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true, locked: true }
];

const DEFAULT_SECURITY_ROLES = [
  'Service Engineer (SERVICE_ENG)',
  'Sales Executive (SALES_EXEC)',
  'Branch Manager (BRANCH_MGR)',
  'Administrator (ADMIN)'
];
const DEFAULT_GENDERS = ['Male', 'Female', 'Other'];
const DEFAULT_STATUSES = ['Active', 'Inactive', 'On Leave'];

export default function EmployeesPage({ showToast }) {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Column Visibility Hook
  const {
    columns: employeeColumns,
    visibleColumns: visibleEmpCols,
    toggleColumn: toggleEmpCol,
    resetToDefaults: resetEmpCols,
    showAllColumns: showAllEmpCols,
    isColumnVisible: isEmpColVisible
  } = useColumnVisibility('crm_cols_employees', EMPLOYEE_COLUMNS);

  // Dropdown options loaded from Master
  const [options, setOptions] = useState({
    departments: [],
    designations: [],
    branches: [],
    grades: [],
    securityRoles: DEFAULT_SECURITY_ROLES,
    genders: DEFAULT_GENDERS,
    statuses: DEFAULT_STATUSES
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Create, object = Edit (PUT)
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    joiningDate: new Date().toISOString().split('T')[0],
    mobileNo: '',
    emailAddress: '',
    department: '',
    designation: '',
    branch: '',
    employeeGrade: '',
    securityRole: '',
    status: 'Active',
    accountPassword: ''
  });

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch employees and dropdown options from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Employees
      const empData = await api.getEmployees();
      const empList = Array.isArray(empData) ? empData : (empData?.employees || []);
      setEmployees(empList);

      // 2. Fetch Master Dropdowns for Employee
      const dropdowns = await api.getEmployeeDropdownOptions();
      if (dropdowns) {
        setOptions(prev => ({
          ...prev,
          departments: dropdowns.departments || [],
          designations: dropdowns.designations || [],
          branches: dropdowns.branches || [],
          grades: dropdowns.grades || [],
          securityRoles: dropdowns.securityRoles || prev.securityRoles
        }));
      }
    } catch (err) {
      console.error('Error fetching employees or options:', err);
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
    setShowPassword(false);
    setFormData({
      fullName: '',
      gender: 'Male',
      dateOfBirth: '',
      joiningDate: new Date().toISOString().split('T')[0],
      mobileNo: '',
      emailAddress: '',
      department: '',
      designation: '',
      branch: '',
      employeeGrade: '',
      securityRole: '',
      status: 'Active',
      accountPassword: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditingItem(emp);
    setFormError('');
    setShowPassword(false);
    setFormData({
      fullName: emp.fullName || '',
      gender: emp.gender || 'Male',
      dateOfBirth: emp.dateOfBirth || '',
      joiningDate: emp.joiningDate || '',
      mobileNo: emp.mobileNo || '',
      emailAddress: emp.emailAddress || '',
      department: emp.department || '',
      designation: emp.designation || '',
      branch: emp.branch || '',
      employeeGrade: emp.employeeGrade || '',
      securityRole: emp.securityRole || '',
      status: emp.status || 'Active',
      accountPassword: emp.accountPassword || ''
    });
    setIsModalOpen(true);
  };

  // Submit Form (Create or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.fullName?.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!formData.mobileNo?.trim()) {
      setFormError('Mobile No is required.');
      return;
    }
    if (!formData.emailAddress?.trim()) {
      setFormError('Email Address is required.');
      return;
    }
    if (!formData.joiningDate) {
      setFormError('Joining Date is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        // PUT API
        const targetId = editingItem._id;
        const result = await api.updateEmployee(targetId, formData);
        if (result && result.success) {
          showToast(`Employee "${formData.fullName}" updated successfully.`);
          await fetchData();
          setIsModalOpen(false);
        } else {
          setFormError(result?.message || 'Failed to update employee in database.');
        }
      } else {
        // POST API
        const result = await api.createEmployee(formData);
        if (result && result.success) {
          showToast(`Employee "${formData.fullName}" created successfully.`);
          await fetchData();
          setIsModalOpen(false);
        } else {
          setFormError(result?.message || 'Failed to create employee in database.');
        }
      }
    } catch (err) {
      setFormError(err.message || 'Error occurred while saving employee record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      const result = await api.deleteEmployee(deleteConfirmId);
      if (result && result.success) {
        showToast('Employee record deleted successfully.');
        await fetchData();
      } else {
        showToast(result?.message || 'Failed to delete employee from database.');
      }
    } catch (err) {
      showToast('Error deleting employee: ' + err.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Filtered Employees List
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.securityRole?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // KPI Metrics
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const salesCount = employees.filter(e => e.department?.includes('Sales')).length;
  const serviceCount = employees.filter(e => e.department?.includes('Service')).length;

  return (
    <div className="page-container" style={{ padding: '24px 28px' }}>
      {/* Header and Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
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
              <Users size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Employee Directory
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Personnel records, department assignments, branch locations, and system credentials
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="refresh-employees-btn"
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Employee Data from MongoDB"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-add-employee"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <PlusCircle size={18} />
            <span>Add Employee</span>
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
        {/* Total Employees */}
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
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Employees
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {totalCount}
            </div>
          </div>
        </div>

        {/* Active Staff */}
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
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Staff
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {activeCount}
            </div>
          </div>
        </div>

        {/* Sales Force */}
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
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sales Force
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
              {salesCount}
            </div>
          </div>
        </div>

        {/* Service Techs */}
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
            justifyContent: 'center'
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Field Engineers
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#9333ea', marginTop: '2px' }}>
              {serviceCount}
            </div>
          </div>
        </div>
      </div>

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
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="employee-search-input"
              type="text"
              placeholder="Search by name, code, email, mobile, department..."
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

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Department Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Dept:
              </span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-control"
                style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', borderRadius: '16px' }}
              >
                <option value="all">All Departments</option>
                {options.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Status:
              </span>
              {['all', 'Active', 'Inactive', 'On Leave'].map(st => (
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

            {/* Column Visibility Dropdown */}
            <ColumnVisibilityDropdown
              columns={employeeColumns}
              visibleColumns={visibleEmpCols}
              onToggle={toggleEmpCol}
              onReset={resetEmpCols}
              onShowAll={showAllEmpCols}
            />

            {/* Export to Excel */}
            <ExportExcelButton
              data={filteredEmployees}
              columns={EMPLOYEE_EXPORT_COLUMNS}
              filename="Employees_Directory"
              sheetName="Employees"
              showToast={showToast}
            />
          </div>
        </div>
      </div>

      {/* Employees Data List Table */}
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
                {isEmpColVisible('index') && <th style={{ padding: '14px 18px', width: '50px' }}>#</th>}
                {isEmpColVisible('employee') && <th style={{ padding: '14px 18px' }}>Employee</th>}
                {isEmpColVisible('department') && <th style={{ padding: '14px 18px' }}>Department</th>}
                {isEmpColVisible('designation') && <th style={{ padding: '14px 18px' }}>Designation</th>}
                {isEmpColVisible('branch') && <th style={{ padding: '14px 18px' }}>Branch</th>}
                {isEmpColVisible('grade') && <th style={{ padding: '14px 18px' }}>Grade</th>}
                {isEmpColVisible('securityRole') && <th style={{ padding: '14px 18px' }}>Security Role</th>}
                {isEmpColVisible('mobile') && <th style={{ padding: '14px 18px' }}>Mobile No</th>}
                {isEmpColVisible('joiningDate') && <th style={{ padding: '14px 18px' }}>Joining Date</th>}
                {isEmpColVisible('status') && <th style={{ padding: '14px 18px' }}>Status</th>}
                {isEmpColVisible('actions') && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={visibleEmpCols.length} style={{ padding: '48px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Users size={36} color="var(--border-strong)" />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        No Employees Found
                      </div>
                      <div style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                        {searchTerm ? 'No results matched your search criteria.' : 'Click "+ Add Employee" above to register an employee profile.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp._id || index}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* S.No */}
                    {isEmpColVisible('index') && (
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                    )}

                    {/* Employee Name & Code */}
                    {isEmpColVisible('employee') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
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
                            {emp.fullName ? emp.fullName.charAt(0).toUpperCase() : 'E'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {emp.fullName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {emp.employeeCode}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {emp.emailAddress}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Department */}
                    {isEmpColVisible('department') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-main)'
                        }}>
                          {emp.department}
                        </span>
                      </td>
                    )}

                    {/* Designation */}
                    {isEmpColVisible('designation') && (
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {emp.designation}
                      </td>
                    )}

                    {/* Branch */}
                    {isEmpColVisible('branch') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                          <Building size={14} color="var(--primary-600)" />
                          <span>{emp.branch}</span>
                        </div>
                      </td>
                    )}

                    {/* Employee Grade */}
                    {isEmpColVisible('grade') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1'
                        }}>
                          {emp.employeeGrade}
                        </span>
                      </td>
                    )}

                    {/* Security Role */}
                    {isEmpColVisible('securityRole') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--primary-700)'
                        }}>
                          <Shield size={12} />
                          {emp.securityRole}
                        </span>
                      </td>
                    )}

                    {/* Mobile No */}
                    {isEmpColVisible('mobile') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} color="#10b981" />
                          <a
                            href={`tel:${emp.mobileNo}`}
                            style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            {emp.mobileNo}
                          </a>
                        </div>
                      </td>
                    )}

                    {/* Joining Date */}
                    {isEmpColVisible('joiningDate') && (
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <Calendar size={13} />
                          <span>{emp.joiningDate}</span>
                        </div>
                      </td>
                    )}

                    {/* Status */}
                    {isEmpColVisible('status') && (
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: emp.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : emp.status === 'On Leave' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                          color: emp.status === 'Active' ? '#059669' : emp.status === 'On Leave' ? '#d97706' : '#64748b'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: emp.status === 'Active' ? '#10b981' : emp.status === 'On Leave' ? '#f59e0b' : '#94a3b8'
                          }} />
                          {emp.status}
                        </span>
                      </td>
                    )}

                    {/* Actions Column */}
                    {isEmpColVisible('actions') && (
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            id={`edit-emp-btn-${emp._id || index}`}
                            onClick={() => handleOpenEdit(emp)}
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
                            title="Edit Employee"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            id={`delete-emp-btn-${emp._id || index}`}
                            onClick={() => setDeleteConfirmId(emp._id)}
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
                            title="Delete Employee"
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

      {/* Modal Form for Create & Edit matching the screenshot sections precisely */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
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
                <span>{editingItem ? 'Edit Employee Information' : 'Create New Employee'}</span>
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

                {/* 1. Personal & Contact Information */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 16px 0', color: '#4f46e5' }}>
                    1. Personal & Contact Information
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Full Name * */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                        Full Name *
                      </label>
                      <input
                        id="emp-fullname-input"
                        type="text"
                        className="form-control"
                        placeholder="Enter full legal name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    {/* Gender * & Date of Birth */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Gender *
                        </label>
                        <select
                          id="emp-gender-select"
                          className="form-control"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          required
                        >
                          {options.genders.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Date of Birth
                        </label>
                        <input
                          id="emp-dob-input"
                          type="date"
                          className="form-control"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Joining Date * & Mobile No * */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Joining Date *
                        </label>
                        <input
                          id="emp-joining-input"
                          type="date"
                          className="form-control"
                          value={formData.joiningDate}
                          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Mobile No *
                        </label>
                        <input
                          id="emp-mobile-input"
                          type="tel"
                          className="form-control"
                          placeholder="e.g. +91 98201 12345"
                          value={formData.mobileNo}
                          onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Email Address * */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                        Email Address *
                      </label>
                      <input
                        id="emp-email-input"
                        type="email"
                        className="form-control"
                        placeholder="e.g. employee@fieldvisitcrm.com"
                        value={formData.emailAddress}
                        onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Department, Branch & Classification */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 16px 0', color: '#4f46e5' }}>
                    2. Department, Branch & Classification
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Department * & Designation * */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Department *
                        </label>
                        <select
                          id="emp-dept-select"
                          className="form-control"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          required
                        >
                          <option value="">-- Select Department from Master --</option>
                          {options.departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Designation *
                        </label>
                        <select
                          id="emp-desig-select"
                          className="form-control"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          required
                        >
                          <option value="">-- Select Designation from Master --</option>
                          {options.designations.map(desig => (
                            <option key={desig} value={desig}>{desig}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Branch * & Employee Grade * */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Branch *
                        </label>
                        <select
                          id="emp-branch-select"
                          className="form-control"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          required
                        >
                          <option value="">-- Select Branch from Master --</option>
                          {options.branches.map(branch => (
                            <option key={branch} value={branch}>{branch}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Employee Grade *
                        </label>
                        <select
                          id="emp-grade-select"
                          className="form-control"
                          value={formData.employeeGrade}
                          onChange={(e) => setFormData({ ...formData, employeeGrade: e.target.value })}
                          required
                        >
                          <option value="">-- Select Grade from Master --</option>
                          {options.grades.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Security Role & System Credentials */}
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 16px 0', color: '#4f46e5' }}>
                    3. Security Role & System Credentials
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Security Role * & Status * */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Security Role *
                        </label>
                        <select
                          id="emp-role-select"
                          className="form-control"
                          value={formData.securityRole}
                          onChange={(e) => setFormData({ ...formData, securityRole: e.target.value })}
                          required
                        >
                          <option value="">-- Select Security Role --</option>
                          {options.securityRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                          Status *
                        </label>
                        <select
                          id="emp-status-select"
                          className="form-control"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          required
                        >
                          {options.statuses.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Account Password * */}
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                        Account Password *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="emp-password-input"
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Set initial login password"
                          value={formData.accountPassword}
                          onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                          style={{ paddingRight: '40px' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
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
                  id="btn-submit-employee-form"
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? <RefreshCw size={16} className="spin-icon" /> : null}
                  <span>{editingItem ? 'Save Changes' : 'Create Employee'}</span>
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
              Delete Employee Record?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this employee? System credentials and security roles will be revoked.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-employee"
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
