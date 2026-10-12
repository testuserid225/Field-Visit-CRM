import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  User,
  Sliders,
  Check,
  X,
  Search,
  RotateCcw,
  Copy,
  Sparkles,
  Eye,
  EyeOff,
  LayoutDashboard,
  Target,
  FileSpreadsheet,
  Inbox,
  Receipt,
  Building2,
  FolderTree,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  ArrowRight,
  Info,
  HelpCircle,
  AlertCircle,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import {
  ALL_MENUS,
  STANDARD_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  getMenuPermissions,
  saveMenuPermissions,
  resetMenuPermissions,
  normalizeRoleId
} from '../utils/menuPermissionUtils';

export default function SecurityPermissionsPage({ showToast, currentUser }) {
  // Navigation tabs: 'role', 'user', 'matrix'
  const [activeTab, setActiveTab] = useState('role');

  // Master Permissions state
  const [permissions, setPermissions] = useState(() => getMenuPermissions());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Selected Role in Tab 1
  const [selectedRoleId, setSelectedRoleId] = useState('sales_exec');

  // Selected Employee in Tab 2
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Search filter for menus
  const [menuSearch, setMenuSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Preview simulation
  const [simulationRole, setSimulationRole] = useState('sales_exec');

  // Fetch employees list from MongoDB for user-specific overrides
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const data = await api.getEmployees();
        if (Array.isArray(data) && data.length > 0) {
          setEmployees(data);
          if (!selectedEmployeeId) {
            setSelectedEmployeeId(data[0]._id || data[0].employeeCode);
          }
        }
      } catch (err) {
        console.warn('Failed to load employees for security screen:', err);
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Sync permissions when external changes occur
  useEffect(() => {
    const handlePermChange = (e) => {
      if (e.detail) {
        setPermissions(e.detail);
      }
    };
    window.addEventListener('crm-menu-permissions-changed', handlePermChange);
    return () => window.removeEventListener('crm-menu-permissions-changed', handlePermChange);
  }, []);

  // Save changes handler
  const handleSave = () => {
    const success = saveMenuPermissions(permissions);
    if (success) {
      setHasUnsavedChanges(false);
      if (typeof showToast === 'function') {
        showToast('Security permissions saved and applied to all users!');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('Error saving permissions to local storage.');
      }
    }
  };

  // Reset to default permissions
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to restore factory default menu permissions for all roles?')) {
      const defs = resetMenuPermissions();
      setPermissions(defs);
      setHasUnsavedChanges(false);
      if (typeof showToast === 'function') {
        showToast('Restored system default role permissions.');
      }
    }
  };

  // Toggle menu for current selected role
  const handleToggleRoleMenu = (roleId, menuId) => {
    setPermissions(prev => {
      const currentRoleMenus = prev.roles[roleId] || [];
      let updated;
      if (currentRoleMenus.includes(menuId)) {
        // Prevent disabling every single menu (keep at least 1)
        if (currentRoleMenus.length <= 1) {
          if (typeof showToast === 'function') {
            showToast('A role must have at least one accessible menu.');
          }
          return prev;
        }
        updated = currentRoleMenus.filter(m => m !== menuId);
      } else {
        updated = [...currentRoleMenus, menuId];
      }

      const next = {
        ...prev,
        roles: {
          ...prev.roles,
          [roleId]: updated
        }
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Enable all menus for role
  const handleEnableAllForRole = (roleId) => {
    setPermissions(prev => {
      const next = {
        ...prev,
        roles: {
          ...prev.roles,
          [roleId]: ALL_MENUS.map(m => m.id)
        }
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Toggle user specific override menu
  const handleToggleUserMenu = (userKey, menuId, baseRoleMenus) => {
    setPermissions(prev => {
      const currentOverrides = prev.userOverrides || {};
      const existingUserMenus = currentOverrides[userKey] !== undefined 
        ? currentOverrides[userKey] 
        : [...baseRoleMenus];

      let updated;
      if (existingUserMenus.includes(menuId)) {
        if (existingUserMenus.length <= 1) {
          if (typeof showToast === 'function') {
            showToast('A user must have at least one visible menu.');
          }
          return prev;
        }
        updated = existingUserMenus.filter(m => m !== menuId);
      } else {
        updated = [...existingUserMenus, menuId];
      }

      const next = {
        ...prev,
        userOverrides: {
          ...currentOverrides,
          [userKey]: updated
        }
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Remove custom user override (inherit from role)
  const handleRemoveUserOverride = (userKey) => {
    setPermissions(prev => {
      const nextOverrides = { ...(prev.userOverrides || {}) };
      delete nextOverrides[userKey];
      const next = {
        ...prev,
        userOverrides: nextOverrides
      };
      setHasUnsavedChanges(true);
      if (typeof showToast === 'function') {
        showToast('Custom override removed. User now inherits role permissions.');
      }
      return next;
    });
  };

  // Copy permissions from another role
  const handleCopyPermissions = (targetRoleId, sourceRoleId) => {
    if (targetRoleId === sourceRoleId) return;
    const sourceMenus = permissions.roles[sourceRoleId] || DEFAULT_ROLE_PERMISSIONS[sourceRoleId] || [];
    setPermissions(prev => {
      const next = {
        ...prev,
        roles: {
          ...prev.roles,
          [targetRoleId]: [...sourceMenus]
        }
      };
      setHasUnsavedChanges(true);
      return next;
    });
    if (typeof showToast === 'function') {
      showToast(`Copied menu access permissions to selected role.`);
    }
  };

  // Current selected employee object
  const selectedEmployee = useMemo(() => {
    return employees.find(e => (e._id === selectedEmployeeId || e.employeeCode === selectedEmployeeId)) || employees[0] || null;
  }, [employees, selectedEmployeeId]);

  const selectedEmployeeKey = selectedEmployee ? (selectedEmployee.employeeCode || selectedEmployee._id) : '';
  const selectedEmployeeBaseRole = selectedEmployee ? normalizeRoleId(selectedEmployee.securityRole || selectedEmployee.designation) : 'sales_exec';
  const selectedEmployeeRoleMenus = permissions.roles[selectedEmployeeBaseRole] || DEFAULT_ROLE_PERMISSIONS[selectedEmployeeBaseRole] || [];

  const hasEmployeeOverride = Boolean(
    selectedEmployeeKey && 
    permissions.userOverrides && 
    Array.isArray(permissions.userOverrides[selectedEmployeeKey])
  );

  const activeEmployeeMenus = hasEmployeeOverride
    ? permissions.userOverrides[selectedEmployeeKey]
    : selectedEmployeeRoleMenus;

  // Filtered menus
  const filteredMenus = ALL_MENUS.filter(menu => {
    const matchesSearch = (menu.label + ' ' + menu.description + ' ' + menu.id).toLowerCase().includes(menuSearch.toLowerCase().trim());
    const matchesCat = categoryFilter === 'ALL' || menu.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', 'Overview', 'Sales', 'Operations', 'Directory', 'Administration'];

  const getMenuIcon = (id) => {
    switch (id) {
      case 'dashboard': return LayoutDashboard;
      case 'opportunities': return Target;
      case 'quotations': return FileSpreadsheet;
      case 'approval-inbox': return Inbox;
      case 'daily-expenses': return Receipt;
      case 'customers': return Building2;
      case 'contact-persons': return UserCheck;
      case 'employees': return Users;
      case 'masters': return FolderTree;
      case 'security': return ShieldCheck;
      default: return Layers;
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'var(--font-main, sans-serif)' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            color: '#fff'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Security & Menu Access Governance
              </h1>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                RBAC Active
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure which sidebar navigation menus are visible to specific security roles and individual employees.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            id="reset-permissions-btn"
            onClick={handleResetDefaults}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '9px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Reset all menu permissions back to factory defaults"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            id="save-permissions-btn"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '9px',
              background: hasUnsavedChanges 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: hasUnsavedChanges 
                ? '0 6px 18px rgba(16, 185, 129, 0.4)' 
                : '0 4px 12px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            <Check size={16} />
            <span>{hasUnsavedChanges ? 'Save Changes *' : 'Save & Apply'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            id="tab-role-permissions"
            onClick={() => setActiveTab('role')}
            style={{
              padding: '10px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'role' ? '2.5px solid var(--primary-500)' : '2.5px solid transparent',
              color: activeTab === 'role' ? 'var(--primary-400)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'role' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={16} />
            <span>Configure by Role</span>
          </button>

          <button
            type="button"
            id="tab-user-permissions"
            onClick={() => setActiveTab('user')}
            style={{
              padding: '10px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'user' ? '2.5px solid var(--primary-500)' : '2.5px solid transparent',
              color: activeTab === 'user' ? 'var(--primary-400)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'user' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={16} />
            <span>Configure by Employee / User</span>
          </button>

          <button
            type="button"
            id="tab-matrix-permissions"
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '10px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'matrix' ? '2.5px solid var(--primary-500)' : '2.5px solid transparent',
              color: activeTab === 'matrix' ? 'var(--primary-400)' : 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'matrix' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={16} />
            <span>Global Security Matrix</span>
          </button>
        </div>

        {/* Live Status Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>Configured for <strong>{ALL_MENUS.length}</strong> menu endpoints</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONFIGURE BY ROLE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'role' && (
        <div>
          {/* Role Selector Cards Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            marginBottom: '24px'
          }}>
            {STANDARD_ROLES.map(role => {
              const isSelected = selectedRoleId === role.id;
              const roleMenus = permissions.roles[role.id] || [];
              const visibleRatio = `${roleMenus.length}/${ALL_MENUS.length}`;

              return (
                <div
                  key={role.id}
                  id={`role-card-${role.id}`}
                  onClick={() => setSelectedRoleId(role.id)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '14px',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                    border: isSelected ? '1.5px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 8px 24px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.06)',
                        color: isSelected ? '#000' : role.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem'
                      }}>
                        <Shield size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--primary-400)' : 'var(--text-main)' }}>
                          {role.name.split(' (')[0]}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {role.name.includes('(') ? role.name.substring(role.name.indexOf('(')) : role.id}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#000' : 'var(--text-muted)'
                    }}>
                      {visibleRatio} Menus
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    margin: '10px 0 0',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Search Menu */}
              <div style={{ position: 'relative', minWidth: '240px', maxWidth: '360px', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '34px', height: '36px', fontSize: '0.82rem' }}
                />
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Category:
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: categoryFilter === cat ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      backgroundColor: categoryFilter === cat ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: categoryFilter === cat ? 'var(--primary-400)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleEnableAllForRole(selectedRoleId)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckSquare size={13} />
                  <span>Enable All</span>
                </button>

                <div style={{ position: 'relative' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCopyPermissions(selectedRoleId, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    style={{
                      height: '28px',
                      fontSize: '0.74rem',
                      padding: '0 8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" disabled>Copy from role...</option>
                    {STANDARD_ROLES.filter(r => r.id !== selectedRoleId).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Menus Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px'
          }}>
            {filteredMenus.map(menu => {
              const currentRoleMenus = permissions.roles[selectedRoleId] || [];
              const isVisible = currentRoleMenus.includes(menu.id);
              const MenuIcon = getMenuIcon(menu.id);

              return (
                <div
                  key={menu.id}
                  id={`role-menu-item-${menu.id}`}
                  onClick={() => handleToggleRoleMenu(selectedRoleId, menu.id)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-card)',
                    border: isVisible ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
                    boxShadow: isVisible ? '0 4px 14px rgba(16, 185, 129, 0.08)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isVisible ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: isVisible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isVisible ? '#10b981' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <MenuIcon size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isVisible ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {menu.label}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            /{menu.id}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Pill */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: isVisible ? '#10b981' : 'rgba(148, 163, 184, 0.15)',
                        color: isVisible ? '#000000' : 'var(--text-muted)',
                        transition: 'all 0.2s ease'
                      }}>
                        {isVisible ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                        <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
                      {menu.description}
                    </p>
                  </div>

                  <div style={{
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {menu.category}
                    </span>
                    <span>Click to {isVisible ? 'Hide' : 'Show'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONFIGURE BY USER / EMPLOYEE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'user' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
            {/* Left: Employee Selection List */}
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: '720px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                Select Employee Profile
              </div>

              {/* Search Employee */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by name, code, role..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
                />
              </div>

              {/* Employee Scroll List */}
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '580px' }}>
                {employees
                  .filter(e => {
                    const text = (e.fullName + ' ' + e.employeeCode + ' ' + (e.securityRole || '') + ' ' + (e.department || '')).toLowerCase();
                    return text.includes(employeeSearch.toLowerCase().trim());
                  })
                  .map(emp => {
                    const isSelected = (emp._id === selectedEmployeeId || emp.employeeCode === selectedEmployeeId);
                    const empKey = emp.employeeCode || emp._id;
                    const isOverridden = Boolean(permissions.userOverrides && permissions.userOverrides[empKey]);

                    return (
                      <div
                        key={emp._id || emp.employeeCode}
                        id={`emp-select-${emp._id || emp.employeeCode}`}
                        onClick={() => setSelectedEmployeeId(emp._id || emp.employeeCode)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-main)',
                          border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? 'var(--primary-400)' : 'var(--text-main)' }}>
                            {emp.fullName}
                          </div>
                          {isOverridden && (
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              Customized
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontFamily: 'monospace' }}>{emp.employeeCode}</span>
                          <span>•</span>
                          <span>{emp.department || 'Sales'}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right: Employee Permissions Panel */}
            {selectedEmployee ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Employee Card Banner */}
                <div className="card" style={{
                  padding: '18px 22px',
                  background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%)',
                      color: 'var(--primary-800)',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedEmployee.fullName ? selectedEmployee.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {selectedEmployee.fullName}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          {selectedEmployee.securityRole || 'Sales Executive (SALES_EXEC)'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Code: <strong>{selectedEmployee.employeeCode}</strong></span>
                        <span>•</span>
                        <span>Branch: <strong>{selectedEmployee.branch || 'Headquarters'}</strong></span>
                        <span>•</span>
                        <span>Email: <strong>{selectedEmployee.emailAddress || 'N/A'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Inheritance vs Custom Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {hasEmployeeOverride ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveUserOverride(selectedEmployeeKey)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          cursor: 'pointer'
                        }}
                      >
                        Reset to Role Defaults
                      </button>
                    ) : (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '6px 12px',
                        borderRadius: '8px'
                      }}>
                        Currently inheriting from <strong>{selectedEmployeeBaseRole}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Menus List for Employee */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '12px'
                }}>
                  {ALL_MENUS.map(menu => {
                    const isVisible = activeEmployeeMenus.includes(menu.id);
                    const MenuIcon = getMenuIcon(menu.id);

                    return (
                      <div
                        key={menu.id}
                        id={`user-menu-item-${menu.id}`}
                        onClick={() => handleToggleUserMenu(selectedEmployeeKey, menu.id, selectedEmployeeRoleMenus)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg-card)',
                          border: isVisible ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isVisible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: isVisible ? '#10b981' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <MenuIcon size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: isVisible ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {menu.label}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {menu.category}
                            </span>
                          </div>
                        </div>

                        {/* Status Checkbox */}
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          border: isVisible ? '1.5px solid #10b981' : '1.5px solid var(--border-strong)',
                          backgroundColor: isVisible ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isVisible && <Check size={13} color="#000" strokeWidth={3.5} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No employee profiles found. Please verify MongoDB employee data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GLOBAL SECURITY MATRIX (2D GRID VIEW)                             */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Comprehensive Role-Menu Visibility Matrix
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Click any cell below to immediately toggle access for that specific role and navigation menu.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-main)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '14px 20px', minWidth: '220px' }}>Navigation Menu</th>
                  <th style={{ padding: '14px 16px', minWidth: '120px' }}>Category</th>
                  {STANDARD_ROLES.map(role => {
                    const count = (permissions.roles[role.id] || []).length;
                    return (
                      <th key={role.id} style={{ padding: '14px 16px', textAlign: 'center', minWidth: '150px' }}>
                        <div>{role.name.split(' (')[0]}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                          ({count}/{ALL_MENUS.length} Active)
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ALL_MENUS.map((menu, idx) => {
                  const MenuIcon = getMenuIcon(menu.id);
                  return (
                    <tr
                      key={menu.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'}
                    >
                      {/* Menu Label & Icon */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <MenuIcon size={16} color="var(--primary-400)" />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {menu.label}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              /{menu.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-muted)'
                        }}>
                          {menu.category}
                        </span>
                      </td>

                      {/* Role Columns with Interactive Checkchips */}
                      {STANDARD_ROLES.map(role => {
                        const isVisible = (permissions.roles[role.id] || []).includes(menu.id);

                        return (
                          <td
                            key={role.id}
                            style={{ padding: '14px 16px', textAlign: 'center' }}
                            onClick={() => handleToggleRoleMenu(role.id, menu.id)}
                          >
                            <button
                              type="button"
                              id={`matrix-cell-${role.id}-${menu.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: isVisible ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                                backgroundColor: isVisible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                color: isVisible ? '#10b981' : 'var(--text-muted)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isVisible ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                              <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIMULATED SIDEBAR PREVIEW DOCK                                            */}
      {/* ========================================================================= */}
      <div className="card" style={{
        marginTop: '28px',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="var(--primary-400)" />
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
              Live Sidebar Simulation Preview
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              (Preview exactly how the sidebar appears to users)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Simulate as Role:
            </span>
            <select
              value={simulationRole}
              onChange={(e) => setSimulationRole(e.target.value)}
              style={{
                height: '32px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                padding: '0 10px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {STANDARD_ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mini Simulated Sidebar Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          padding: '10px 4px'
        }}>
          {ALL_MENUS
            .filter(m => (permissions.roles[simulationRole] || []).includes(m.id))
            .map(m => {
              const Icon = getMenuIcon(m.id);
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <Icon size={14} color="#10b981" />
                  <span>{m.label}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
