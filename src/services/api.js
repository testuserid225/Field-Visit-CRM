const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Helper to retrieve token strictly from sessionStorage (tab & browser session scoped)
export const getAuthToken = () => {
  try {
    if (localStorage.getItem('field_crm_token')) {
      localStorage.removeItem('field_crm_token');
    }
    return sessionStorage.getItem('field_crm_token') || '';
  } catch {
    return '';
  }
};

// Helper to generate auth headers with Bearer token based on login user details
export const getAuthHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Central fetch wrapper that injects Authorization Bearer token from login user details
export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

export const api = {
  getAuthToken,
  getAuthHeaders,
  authFetch,

  // Check backend health & MongoDB connection
  checkHealth: async () => {
    try {
      const res = await authFetch(`${API_BASE}/health`);
      return await res.json();
    } catch (err) {
      console.warn('Backend API currently unreachable:', err.message);
      return null;
    }
  },

  // Auth (Token-based login against Employee table)
  login: async (email, password) => {
    try {
      const res = await authFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data && data.success && data.token) {
        // Tab & Browser Session Security: Store token strictly in sessionStorage so closing tab/browser logs out immediately
        sessionStorage.setItem('field_crm_token', data.token);
        localStorage.removeItem('field_crm_token');
        
        // Security: NEVER store unencrypted user profile object (field_crm_user) in browser storage
        localStorage.removeItem('field_crm_user');
        sessionStorage.removeItem('field_crm_user');
      }
      return data;
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
      return { success: false, message: 'Unable to connect to authentication server' };
    }
  },

  // Verify Google Authenticator 2FA 6-digit code with email identity matching
  verify2FA: async (twoFactorToken, code, email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorToken, code, email })
      });
      const data = await res.json();
      if (data && data.success && data.token) {
        // Tab & Browser Session Security: Store token strictly in sessionStorage
        sessionStorage.setItem('field_crm_token', data.token);
        localStorage.removeItem('field_crm_token');
        localStorage.removeItem('field_crm_user');
        sessionStorage.removeItem('field_crm_user');
      }
      return data;
    } catch (err) {
      console.warn('verify2FA error:', err.message);
      return { success: false, message: 'Unable to verify two-factor authentication code' };
    }
  },

  reset2FA: async (resetData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      return await res.json();
    } catch (err) {
      console.warn('reset2FA error:', err.message);
      return { success: false, message: 'Unable to reset two-factor authentication' };
    }
  },

  getCurrentUser: async () => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const res = await authFetch(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      return data.success ? data.user : null;
    } catch (err) {
      console.warn('Backend getCurrentUser error:', err.message);
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('field_crm_token');
    sessionStorage.removeItem('field_crm_token');
    localStorage.removeItem('field_crm_user');
    sessionStorage.removeItem('field_crm_user');
  },

  // Dashboard & Real-Time Stats
  getDashboardStats: async () => {
    try {
      const res = await authFetch(`${API_BASE}/stats/dashboard`);
      const data = await res.json();
      return data.success ? data.stats : null;
    } catch (err) {
      console.warn('Backend getDashboardStats error:', err.message);
      return null;
    }
  },

  // Visits
  getVisits: async () => {
    try {
      const res = await authFetch(`${API_BASE}/visits`);
      const data = await res.json();
      return data.success ? data.visits : null;
    } catch (err) {
      console.warn('Backend getVisits fallback:', err.message);
      return null;
    }
  },

  createVisit: async (visitData) => {
    try {
      const res = await authFetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData)
      });
      const data = await res.json();
      return data.success ? data.visit : null;
    } catch (err) {
      console.warn('Backend createVisit fallback:', err.message);
      return null;
    }
  },

  checkInVisit: async (id, checkInData) => {
    try {
      const res = await authFetch(`${API_BASE}/visits/${id}/checkin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData)
      });
      const data = await res.json();
      return data.success ? data.visit : null;
    } catch (err) {
      console.warn('Backend checkInVisit fallback:', err.message);
      return null;
    }
  },

  deleteVisit: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/visits/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      return data.success;
    } catch (err) {
      console.warn('Backend deleteVisit fallback:', err.message);
      return false;
    }
  },

  // Clients
  getClients: async () => {
    try {
      const res = await authFetch(`${API_BASE}/clients`);
      const data = await res.json();
      return data.success ? data.clients : null;
    } catch (err) {
      console.warn('Backend getClients fallback:', err.message);
      return null;
    }
  },

  createClient: async (clientData) => {
    try {
      const res = await authFetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      const data = await res.json();
      return data.success ? data.client : null;
    } catch (err) {
      console.warn('Backend createClient fallback:', err.message);
      return null;
    }
  },

  // Masters API (All 10 Masters)
  getMasterItems: async (masterType, query = '') => {
    try {
      const url = `${API_BASE}/masters/${masterType}${query ? `?${query}` : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      return data.success ? data.items : [];
    } catch (err) {
      console.warn(`Backend getMasterItems [${masterType}] fallback:`, err.message);
      return null;
    }
  },

  createMasterItem: async (masterType, itemData) => {
    try {
      const res = await authFetch(`${API_BASE}/masters/${masterType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`Backend createMasterItem [${masterType}] fallback:`, err.message);
      return { success: false, message: err.message };
    }
  },

  updateMasterItem: async (masterType, id, itemData) => {
    try {
      const res = await authFetch(`${API_BASE}/masters/${masterType}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`Backend updateMasterItem [${masterType}] fallback:`, err.message);
      return { success: false, message: err.message };
    }
  },

  deleteMasterItem: async (masterType, id) => {
    try {
      const res = await authFetch(`${API_BASE}/masters/${masterType}/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`Backend deleteMasterItem [${masterType}] fallback:`, err.message);
      return { success: false, message: err.message };
    }
  },

  getMasterDropdowns: async () => {
    try {
      const res = await authFetch(`${API_BASE}/masters/meta/dropdowns`);
      const data = await res.json();
      return data.success ? data : { principals: [], categories: [], managers: [], contactPersons: [] };
    } catch (err) {
      console.warn('Backend getMasterDropdowns fallback:', err.message);
      return { principals: [], categories: [], managers: [], contactPersons: [] };
    }
  },

  // Contact Persons API
  getContactPersons: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_BASE}/contact-persons${query ? `?${query}` : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      return data.success ? data.contactPersons : [];
    } catch (err) {
      console.warn('Backend getContactPersons fallback:', err.message);
      return [];
    }
  },

  createContactPerson: async (personData) => {
    try {
      const res = await authFetch(`${API_BASE}/contact-persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createContactPerson fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateContactPerson: async (id, personData) => {
    try {
      const res = await authFetch(`${API_BASE}/contact-persons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateContactPerson fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  deleteContactPerson: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/contact-persons/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend deleteContactPerson fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  getContactPersonDesignations: async () => {
    try {
      const res = await authFetch(`${API_BASE}/contact-persons/meta/designations`);
      const data = await res.json();
      return data.success ? data.designations : [];
    } catch (err) {
      console.warn('Backend getContactPersonDesignations fallback:', err.message);
      return [];
    }
  },

  // Customer Management APIs
  getCustomers: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_BASE}/customers${query ? `?${query}` : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      return data.success ? data.customers : [];
    } catch (err) {
      console.warn('Backend getCustomers fallback:', err.message);
      return [];
    }
  },

  createCustomer: async (customerData) => {
    try {
      const res = await authFetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createCustomer fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const res = await authFetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateCustomer fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  deleteCustomer: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/customers/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend deleteCustomer fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  getCustomerIndustrySegments: async () => {
    try {
      const res = await authFetch(`${API_BASE}/customers/meta/industries`);
      const data = await res.json();
      return data.success ? data.segments : [];
    } catch (err) {
      console.warn('Backend getCustomerIndustrySegments fallback:', err.message);
      return [];
    }
  },

  // Employee Management APIs
  getEmployees: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_BASE}/employees${query ? `?${query}` : ''}`;
      const res = await authFetch(url);
      const data = await res.json();
      return data.success ? data.employees : [];
    } catch (err) {
      console.warn('Backend getEmployees fallback:', err.message);
      return [];
    }
  },

  createEmployee: async (employeeData) => {
    try {
      const res = await authFetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createEmployee fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateEmployee: async (id, employeeData) => {
    try {
      const res = await authFetch(`${API_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateEmployee fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  deleteEmployee: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/employees/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend deleteEmployee fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  getEmployeeDropdownOptions: async () => {
    try {
      const res = await authFetch(`${API_BASE}/employees/meta/options`);
      const data = await res.json();
      return data.success ? data.options : null;
    } catch (err) {
      console.warn('Backend getEmployeeDropdownOptions fallback:', err.message);
      return null;
    }
  },

  // Opportunities & Pipeline
  getOpportunities: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await authFetch(`${API_BASE}/opportunities${query ? `?${query}` : ''}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getOpportunities fallback:', err.message);
      return { success: false, opportunities: [], stats: null };
    }
  },

  getOpportunityById: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/opportunities/${id}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getOpportunityById fallback:', err.message);
      return { success: false, opportunity: null };
    }
  },

  createOpportunity: async (oppData) => {
    try {
      const res = await authFetch(`${API_BASE}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oppData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createOpportunity fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateOpportunity: async (id, oppData) => {
    try {
      const res = await authFetch(`${API_BASE}/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oppData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateOpportunity fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateOpportunityStage: async (id, stage) => {
    try {
      const res = await authFetch(`${API_BASE}/opportunities/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage })
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateOpportunityStage fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  addQuotationRevision: async (id, quoteData) => {
    try {
      const res = await authFetch(`${API_BASE}/opportunities/${id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend addQuotationRevision fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  deleteOpportunity: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/opportunities/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend deleteOpportunity fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  // Quotations & Revisions
  getQuotations: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.opportunityId) query.append('opportunityId', params.opportunityId);
      const res = await authFetch(`${API_BASE}/quotations?${query.toString()}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getQuotations fallback:', err.message);
      return { success: false, quotations: [], message: err.message };
    }
  },

  getQuotationById: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/${id}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getQuotationById fallback:', err.message);
      return { success: false, quotation: null, message: err.message };
    }
  },

  createQuotation: async (quotationData) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createQuotation fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateQuotation: async (id, quotationData) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateQuotation fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  createQuotationRevision: async (id, revisionData) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/${id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revisionData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createQuotationRevision fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateQuotationStatus: async (id, statusOrData) => {
    try {
      const payload = typeof statusOrData === 'string' ? { status: statusOrData } : statusOrData;
      const res = await authFetch(`${API_BASE}/quotations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateQuotationStatus fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  sendQuotationEmail: async (id, emailData = {}) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/${id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend sendQuotationEmail fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  getQuotationSmtpStatus: async () => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/smtp/status`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getQuotationSmtpStatus fallback:', err.message);
      return { success: false, isConfigured: false, message: err.message };
    }
  },

  configureQuotationSmtp: async (appPassword) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/smtp/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appPassword })
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend configureQuotationSmtp fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  deleteQuotation: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/quotations/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend deleteQuotation fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  // Daily Visit & Expenses
  getDailyVisitExpenses: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.activity) query.append('activity', params.activity);
      if (params.branch) query.append('branch', params.branch);
      if (params.customerName) query.append('customerName', params.customerName);
      if (params.employeeName) query.append('employeeName', params.employeeName);
      const res = await authFetch(`${API_BASE}/daily-visit-expenses?${query.toString()}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getDailyVisitExpenses fallback:', err.message);
      return { success: false, reports: [], message: err.message };
    }
  },

  // Manager Approval Inbox
  getApprovalInbox: async (params = {}) => {
    try {
      const token = getAuthToken();
      if (!token) return { success: false, reports: [], stats: null };

      const query = new URLSearchParams();
      if (params.branch) query.append('branch', params.branch);
      if (params.status) query.append('status', params.status);
      if (params.search) query.append('search', params.search);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
      const res = await authFetch(`${API_BASE}/daily-visit-expenses/inbox?${query.toString()}`);
      if (!res.ok) {
        return { success: false, reports: [], stats: null, message: `Server status ${res.status}` };
      }
      return await res.json();
    } catch (err) {
      return { success: false, reports: [], stats: null, message: err.message };
    }
  },

  getDailyVisitExpenseById: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/daily-visit-expenses/${id}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend getDailyVisitExpenseById fallback:', err.message);
      return { success: false, report: null, message: err.message };
    }
  },

  createDailyVisitExpense: async (reportData) => {
    try {
      const res = await authFetch(`${API_BASE}/daily-visit-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend createDailyVisitExpense fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateDailyVisitExpense: async (id, reportData) => {
    try {
      const res = await authFetch(`${API_BASE}/daily-visit-expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateDailyVisitExpense fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  updateDailyVisitExpenseStatus: async (id, status, approverRemarks = '', approverName = '') => {
    try {
      const res = await authFetch(`${API_BASE}/daily-visit-expenses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approverRemarks, approverName })
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend updateDailyVisitExpenseStatus fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  deleteDailyVisitExpense: async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/daily-visit-expenses/${id}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      console.warn('Backend deleteDailyVisitExpense fallback:', err.message);
      return { success: false, message: err.message };
    }
  },

  getMasterExpenseHeads: async () => {
    try {
      const res = await authFetch(`${API_BASE}/masters/expense-heads`);
      const data = await res.json();
      return data.success ? data.items : [];
    } catch (err) {
      console.warn('Backend getMasterExpenseHeads fallback:', err.message);
      return [];
    }
  },

  getMasterProducts: async () => {
    try {
      const res = await authFetch(`${API_BASE}/masters/products`);
      const data = await res.json();
      return data.success ? data.items : [];
    } catch (err) {
      console.warn('Backend getMasterProducts fallback:', err.message);
      return [];
    }
  },

  // Record Counts for Navigation Menu Badges
  getMenuCounts: async () => {
    try {
      const res = await authFetch(`${API_BASE}/stats/menu-counts`);
      if (!res.ok) return { success: false, counts: null };
      return await res.json();
    } catch (err) {
      console.warn('Backend getMenuCounts fallback:', err.message);
      return { success: false, counts: null, message: err.message };
    }
  }
};

