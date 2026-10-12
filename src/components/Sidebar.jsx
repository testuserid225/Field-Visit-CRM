import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Target,
  FileSpreadsheet,
  Receipt,
  FolderTree,
  UserCheck,
  Building2,
  Users,
  Compass,
  Inbox,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { isBranchManagerOrAdmin, isSystemAdmin } from '../utils/userRoleUtils';
import { isMenuVisibleForUser } from '../utils/menuPermissionUtils';

export default function Sidebar({ currentPage, setCurrentPage, currentUser, onLogout }) {
  const [permTick, setPermTick] = useState(0);
  const [counts, setCounts] = useState({
    opportunities: null,
    quotations: null,
    approvalInbox: null,
    dailyExpenses: null,
    employees: null,
    customers: null,
    contactPersons: null,
    masters: 10
  });

  const isManagerOrAdmin = isBranchManagerOrAdmin(currentUser);

  const fetchCounts = async () => {
    try {
      const token = api.getAuthToken();
      if (!token) return;
      const res = await api.getMenuCounts();
      if (res && res.success && res.counts) {
        setCounts(res.counts);
      }
    } catch (err) {
      // ignore error
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchCounts();

    const timer = setInterval(() => {
      if (isMounted) fetchCounts();
    }, 10000);

    const handleRecordChange = () => {
      if (isMounted) fetchCounts();
    };
    window.addEventListener('crm-record-count-changed', handleRecordChange);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('crm-record-count-changed', handleRecordChange);
    };
  }, [currentUser]);

  // Refresh counts on page navigation
  useEffect(() => {
    fetchCounts();
  }, [currentPage]);

  // Listen for dynamic menu permission changes
  useEffect(() => {
    const handlePermChange = () => setPermTick(t => t + 1);
    window.addEventListener('crm-menu-permissions-changed', handlePermChange);
    return () => window.removeEventListener('crm-menu-permissions-changed', handlePermChange);
  }, []);

  const formatCount = (val) => {
    if (val === null || val === undefined) return '...';
    return String(val);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'opportunities', 
      label: 'Opportunities & Pipeline', 
      icon: Target,
      badge: formatCount(counts.opportunities)
    },
    { 
      id: 'quotations', 
      label: 'Quotations & Revisions', 
      icon: FileSpreadsheet,
      badge: formatCount(counts.quotations)
    },
    // Show Approval Inbox for Branch Manager & System Admin; Show Daily Visit & Expenses for all
    ...(isManagerOrAdmin ? [
      {
        id: 'approval-inbox',
        label: 'Approval Inbox',
        icon: Inbox,
        badge: formatCount(counts.approvalInbox),
        badgeColor: (counts.approvalInbox > 0) ? '#f59e0b' : null
      },
      {
        id: 'daily-expenses',
        label: 'Daily Visit & Expenses',
        icon: Receipt,
        badge: formatCount(counts.dailyExpenses)
      }
    ] : [
      {
        id: 'daily-expenses',
        label: 'Daily Visit & Expenses',
        icon: Receipt,
        badge: formatCount(counts.dailyExpenses)
      }
    ]),
    { 
      id: 'employees', 
      label: 'Employees', 
      icon: Users,
      badge: formatCount(counts.employees)
    },
    { 
      id: 'customers', 
      label: 'Customers', 
      icon: Building2,
      badge: formatCount(counts.customers)
    },
    { 
      id: 'contact-persons', 
      label: 'Contact Persons', 
      icon: UserCheck,
      badge: formatCount(counts.contactPersons)
    },
    { 
      id: 'masters', 
      label: 'CRM Masters', 
      icon: FolderTree, 
      badge: formatCount(counts.masters ?? 10)
    },
    { 
      id: 'security', 
      label: 'Security & Access', 
      icon: ShieldCheck
    }
  ];

  const visibleMenuItems = menuItems.filter(item => isMenuVisibleForUser(item.id, currentUser));

  return (
    <aside style={{
      width: '265px',
      backgroundColor: 'var(--bg-sidebar)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      height: '100vh',
      maxHeight: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      overflow: 'hidden',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--primary-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Compass size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            FieldVisit<span style={{ color: 'var(--primary-300)' }}>CRM</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
            Enterprise Field Force
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '12px 14px', overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748b',
          padding: '0 8px 8px'
        }}>
          Navigation
        </div>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentPage(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={19} color={isActive ? 'var(--primary-300)' : '#94a3b8'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge !== null && (
                    <span style={{
                      backgroundColor: item.badgeColor || (isActive ? 'var(--primary-600)' : 'rgba(255, 255, 255, 0.1)'),
                      color: item.badgeColor ? '#000000' : '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      minWidth: '22px',
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
