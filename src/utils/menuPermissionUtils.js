/**
 * Menu Permission & Security Utility
 * Centralizes access control for which menus are visible to which roles and specific employees.
 * Persists dynamically in localStorage ('crm_menu_permissions') with real-time reactive event dispatch.
 */

export const ALL_MENUS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Executive KPIs, revenue overview, conversion pipeline, and activity metrics.',
    category: 'Overview'
  },
  {
    id: 'opportunities',
    label: 'Opportunities & Pipeline',
    description: 'Deals pipeline, Kanban boards, stage tracking, win probabilities, and deal values.',
    category: 'Sales'
  },
  {
    id: 'quotations',
    label: 'Quotations & Revisions',
    description: 'Commercial quotes, revision history, discount approvals, and client PDF dispatch.',
    category: 'Sales'
  },
  {
    id: 'approval-inbox',
    label: 'Approval Inbox',
    description: 'Branch Manager & Admin inbox to review, approve, or reject employee expense claims.',
    category: 'Operations'
  },
  {
    id: 'daily-expenses',
    label: 'Daily Visit & Expenses',
    description: 'Employee field visit logs, odometer distance calculation, and expense claims.',
    category: 'Operations'
  },
  {
    id: 'customers',
    label: 'Customers',
    description: 'Customer organization profiles, industry segmentation, and account status.',
    category: 'Directory'
  },
  {
    id: 'contact-persons',
    label: 'Contact Persons',
    description: 'Client stakeholders, designations, direct phones, emails, and relationships.',
    category: 'Directory'
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Internal personnel directory, departments, branches, grades, and security roles.',
    category: 'Administration'
  },
  {
    id: 'masters',
    label: 'CRM Masters',
    description: 'Setup masters: departments, designations, branches, grades, product lines, etc.',
    category: 'Administration'
  },
  {
    id: 'security',
    label: 'Security & Menu Access',
    description: 'Configure and govern which menus are visible to specific users and roles.',
    category: 'Administration'
  }
];

export const STANDARD_ROLES = [
  {
    id: 'admin',
    name: 'Administrator (ADMIN)',
    description: 'Full system privileges across all operations, masters, and configurations.',
    color: '#8b5cf6'
  },
  {
    id: 'branch_mgr',
    name: 'Branch Manager (BRANCH_MGR)',
    description: 'Territory supervision, claim approvals, pipeline inspection, and client governance.',
    color: '#3b82f6'
  },
  {
    id: 'sales_exec',
    name: 'Sales Executive (SALES_EXEC)',
    description: 'Field sales engagement, opportunity pipeline creation, and quotation delivery.',
    color: '#10b981'
  },
  {
    id: 'service_eng',
    name: 'Service Engineer (SERVICE_ENG)',
    description: 'On-site technical visits, maintenance tracking, and daily travel expense submissions.',
    color: '#f59e0b'
  }
];

export const DEFAULT_ROLE_PERMISSIONS = {
  // Keyed by role id or normalized role name
  admin: [
    'dashboard',
    'opportunities',
    'quotations',
    'approval-inbox',
    'daily-expenses',
    'customers',
    'contact-persons',
    'employees',
    'masters',
    'security'
  ],
  branch_mgr: [
    'dashboard',
    'opportunities',
    'quotations',
    'approval-inbox',
    'customers',
    'contact-persons',
    'employees',
    'masters',
    'security'
  ],
  sales_exec: [
    'dashboard',
    'opportunities',
    'quotations',
    'daily-expenses',
    'customers',
    'contact-persons'
  ],
  service_eng: [
    'dashboard',
    'daily-expenses',
    'customers',
    'contact-persons'
  ]
};

const STORAGE_KEY = 'crm_menu_permissions';

/**
 * Normalizes role text into a canonical role identifier ('admin', 'branch_mgr', 'sales_exec', 'service_eng')
 */
export function normalizeRoleId(roleStr = '') {
  const lower = String(roleStr || '').toLowerCase().trim();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('branch manager') || lower.includes('branch_mgr') || lower.includes('branch mgr')) return 'branch_mgr';
  if (lower.includes('sales')) return 'sales_exec';
  if (lower.includes('service')) return 'service_eng';
  return 'sales_exec'; // fallback
}

/**
 * Loads configured permissions from localStorage or defaults
 * Returns structure:
 * {
 *   roles: {
 *     admin: ['dashboard', ...],
 *     branch_mgr: [...],
 *     ...
 *   },
 *   userOverrides: {
 *     // employeeCode or userId -> ['dashboard', 'opportunities', ...]
 *   }
 * }
 */
export function getMenuPermissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          roles: {
            ...DEFAULT_ROLE_PERMISSIONS,
            ...(parsed.roles || {})
          },
          userOverrides: parsed.userOverrides || {}
        };
      }
    }
  } catch (err) {
    console.warn('Error reading menu permissions from localStorage:', err);
  }

  return {
    roles: { ...DEFAULT_ROLE_PERMISSIONS },
    userOverrides: {}
  };
}

/**
 * Saves permissions to localStorage and emits reactive event
 */
export function saveMenuPermissions(permissions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
    // Dispatch reactive custom event so Sidebar and Navbar update instantly
    window.dispatchEvent(new CustomEvent('crm-menu-permissions-changed', {
      detail: permissions
    }));
    return true;
  } catch (err) {
    console.error('Failed to save menu permissions:', err);
    return false;
  }
}

/**
 * Resets all menu permissions to factory defaults
 */
export function resetMenuPermissions() {
  const defaults = {
    roles: { ...DEFAULT_ROLE_PERMISSIONS },
    userOverrides: {}
  };
  saveMenuPermissions(defaults);
  return defaults;
}

/**
 * Checks whether a specific menu is visible for a given user object.
 * Hierarchy:
 * 1. Specific User Override (by employeeCode, email, or _id)
 * 2. Role-based Permission (by user.securityRole, user.role, user.designation)
 * 3. Default fallback
 */
export function isMenuVisibleForUser(menuId, user) {
  if (!user) return true; // Before login or unknown

  const permissions = getMenuPermissions();

  // 1. Check user-specific override
  const userKey = user.employeeCode || user.emailAddress || user.email || user._id || user.id;
  if (userKey && permissions.userOverrides && Array.isArray(permissions.userOverrides[userKey])) {
    return permissions.userOverrides[userKey].includes(menuId);
  }

  // 2. Check Role-based permission
  const userRole = user.securityRole || user.role || user.designation || '';
  const canonicalRole = normalizeRoleId(userRole);

  const allowedMenus = permissions.roles[canonicalRole] || DEFAULT_ROLE_PERMISSIONS[canonicalRole];
  if (Array.isArray(allowedMenus)) {
    return allowedMenus.includes(menuId);
  }

  // Default fallback: allow
  return true;
}

/**
 * Returns the list of permitted menu IDs for a user
 */
export function getPermittedMenusForUser(user) {
  if (!user) return ALL_MENUS.map(m => m.id);

  const permissions = getMenuPermissions();
  const userKey = user.employeeCode || user.emailAddress || user.email || user._id || user.id;

  if (userKey && permissions.userOverrides && Array.isArray(permissions.userOverrides[userKey])) {
    return permissions.userOverrides[userKey];
  }

  const userRole = user.securityRole || user.role || user.designation || '';
  const canonicalRole = normalizeRoleId(userRole);

  return permissions.roles[canonicalRole] || DEFAULT_ROLE_PERMISSIONS[canonicalRole] || ALL_MENUS.map(m => m.id);
}
