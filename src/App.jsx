import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MastersPage from './pages/MastersPage';
import ContactPersonsPage from './pages/ContactPersonsPage';
import CustomersPage from './pages/CustomersPage';
import EmployeesPage from './pages/EmployeesPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import QuotationsPage from './pages/QuotationsPage';
import DailyVisitExpensesPage from './pages/DailyVisitExpensesPage';
import ApprovalInboxPage from './pages/ApprovalInboxPage';
import SecurityPermissionsPage from './pages/SecurityPermissionsPage';
import { isBranchManagerOrAdmin } from './utils/userRoleUtils';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ScheduleModal from './components/ScheduleModal';
import CheckInModal from './components/CheckInModal';
import VisitDetailsModal from './components/VisitDetailsModal';

import { INITIAL_VISITS, INITIAL_CLIENTS, DEMO_USERS } from './data/mockData';
import { api } from './services/api';

export default function App() {
  // Authentication state - Strictly held in React runtime memory (Never in browser localStorage)
  const [currentUser, setCurrentUser] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // URL Navigation & Query Parameter State Synchronization
  const getUrlNavigation = () => {
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const pageParam = params.get('page');
      const statusParam = params.get('status');
      
      const validPages = [
        'dashboard',
        'opportunities',
        'quotations',
        'approval-inbox',
        'daily-expenses',
        'masters',
        'employees',
        'customers',
        'contact-persons',
        'security'
      ];
      
      const reportParam = params.get('report') === '1' || params.get('report') === 'true';
      return {
        page: validPages.includes(pageParam) ? pageParam : 'dashboard',
        status: statusParam || null,
        openReport: reportParam
      };
    } catch {
      return { page: 'dashboard', status: null, openReport: false };
    }
  };

  const initialNav = getUrlNavigation();
  const [currentPage, setCurrentPage] = useState(initialNav.page);
  const [currentFilterStatus, setCurrentFilterStatus] = useState(initialNav.status);
  const [openReportModal, setOpenReportModal] = useState(Boolean(initialNav.openReport));
  const [searchQuery, setSearchQuery] = useState('');

  // Primary navigate handler that updates page state, filter status, and browser URL
  const navigateTo = (page, params = {}) => {
    const targetPage = page || 'dashboard';
    const targetStatus = params.status !== undefined ? params.status : null;
    const shouldOpenReport = Boolean(params.openReport);
    
    setCurrentPage(targetPage);
    setCurrentFilterStatus(targetStatus);
    setOpenReportModal(shouldOpenReport);

    try {
      const url = new URL(window.location.href);
      if (targetPage && targetPage !== 'dashboard') {
        url.searchParams.set('page', targetPage);
      } else {
        url.searchParams.delete('page');
      }

      if (targetStatus && targetStatus !== 'ALL') {
        url.searchParams.set('status', targetStatus);
      } else if (targetStatus === 'ALL') {
        url.searchParams.set('status', 'ALL');
      } else {
        url.searchParams.delete('status');
      }

      if (shouldOpenReport) {
        url.searchParams.set('report', '1');
      } else {
        url.searchParams.delete('report');
      }

      window.history.pushState({ page: targetPage, status: targetStatus, openReport: shouldOpenReport }, '', url.toString());
    } catch (err) {
      console.warn('Navigation URL pushState error:', err);
    }
  };

  // Browser back/forward button (popstate) listener
  useEffect(() => {
    const handlePopState = () => {
      const nav = getUrlNavigation();
      setCurrentPage(nav.page);
      setCurrentFilterStatus(nav.status);
      setOpenReportModal(Boolean(nav.openReport));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Data stores
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [activeCheckInVisit, setActiveCheckInVisit] = useState(null);
  const [activeDetailsVisit, setActiveDetailsVisit] = useState(null);
  const [schedulePreselectedClient, setSchedulePreselectedClient] = useState(null);

  // Theme state: 'emerald', 'obsidian', 'violet', 'sunset'
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('field_crm_theme') || 'emerald';
  });

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('field_crm_theme', currentTheme);
  }, [currentTheme]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Role Navigation Guard: Branch Manager & System Administrator should NOT access daily-expenses
  useEffect(() => {
    if (isBranchManagerOrAdmin(currentUser) && currentPage === 'daily-expenses') {
      navigateTo('approval-inbox', { status: currentFilterStatus });
    }
  }, [currentUser, currentPage]);

  // Sync data from MongoDB backend on mount with cryptographic token validation
  const syncBackendData = async () => {
    // Security: Purge any legacy persistent token or unencrypted user object from localStorage
    try {
      localStorage.removeItem('field_crm_token');
      localStorage.removeItem('field_crm_user');
      sessionStorage.removeItem('field_crm_user');
    } catch {}

    const health = await api.checkHealth();
    if (health && health.database?.status === 'Connected') {
      setDbConnected(true);
    }

    // Verify session using cryptographic JWT token strictly from sessionStorage
    const token = api.getAuthToken();
    if (token) {
      try {
        const tokenUser = await api.getCurrentUser();
        if (tokenUser) {
          // Keep user profile STRICTLY in React runtime memory (Never in browser localStorage)
          setCurrentUser(tokenUser);

          // Load protected visits and clients using verified token
          const serverVisits = await api.getVisits();
          if (serverVisits && serverVisits.length > 0) {
            const normalized = serverVisits.map(v => ({ ...v, id: v.visitId || v._id }));
            setVisits(normalized);
          }

          const serverClients = await api.getClients();
          if (serverClients && serverClients.length > 0) {
            const normalizedClients = serverClients.map(c => ({ ...c, id: c.clientId || c._id }));
            setClients(normalizedClients);
          }
        } else {
          // Token invalid or expired - force clean logout
          api.logout();
          setCurrentUser(null);
        }
      } catch (err) {
        api.logout();
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    setIsSessionLoading(false);
  };

  useEffect(() => {
    syncBackendData();
  }, []);

  // Handlers
  const handleLogin = (user) => {
    try {
      localStorage.removeItem('field_crm_token');
      localStorage.removeItem('field_crm_user');
      sessionStorage.removeItem('field_crm_user');
    } catch {}
    // Keep user identity strictly in React runtime memory
    setCurrentUser(user);
    syncBackendData();
    showToast(`Welcome back, ${user.name || user.fullName}!`);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    navigateTo('dashboard', {});
    showToast('Signed out successfully.');
  };

  const handleScheduleVisit = async (newVisit) => {
    setVisits(prev => [newVisit, ...prev]);
    showToast(`Field visit for ${newVisit.clientName} scheduled!`);

    // Async persist to MongoDB
    api.createVisit(newVisit);
  };

  const handleConfirmCheckIn = async ({ visitId, action, time, notes }) => {
    setVisits(prev => prev.map(v => {
      if (v.id === visitId || v.visitId === visitId) {
        if (action === 'check-in') {
          return {
            ...v,
            status: 'In-Progress',
            checkInTime: time,
            notes: notes || v.notes,
            verifiedGps: true
          };
        } else if (action === 'complete') {
          return {
            ...v,
            status: 'Completed',
            checkOutTime: time,
            notes: notes || v.notes,
            verifiedGps: true
          };
        }
      }
      return v;
    }));

    showToast(action === 'check-in' ? 'Geo-verified check-in registered!' : 'Visit successfully completed and logged!');

    // Async persist to MongoDB
    api.checkInVisit(visitId, { action, time, notes, verifiedGps: true });
  };

  const handleDeleteVisit = async (visitId) => {
    if (window.confirm('Are you sure you want to remove this visit appointment?')) {
      setVisits(prev => prev.filter(v => v.id !== visitId && v.visitId !== visitId));
      showToast('Visit appointment removed.');
      api.deleteVisit(visitId);
    }
  };

  const handleAddClient = async (client) => {
    setClients(prev => [client, ...prev]);
    showToast(`Client "${client.name}" registered successfully!`);
    api.createClient(client);
  };

  const handleScheduleForClient = (client) => {
    setSchedulePreselectedClient(client);
    setIsScheduleOpen(true);
  };

  // While validating cryptographic session token, show sleek loading indicator
  if (isSessionLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#051410',
        color: '#fff',
        fontFamily: 'var(--font-main, system-ui, sans-serif)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
        }}>
          <div style={{
            width: '22px',
            height: '22px',
            border: '3px solid rgba(255, 255, 255, 0.25)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
          }} />
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Verifying Secure Session...
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
          Validating token authentication
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not authenticated, render LoginPage
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLogin} 
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={(page) => navigateTo(page, {})}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          currentPage={currentPage}
          currentUser={currentUser}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          onLogout={handleLogout}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Render Active Page */}
        <main>
          {currentPage === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'opportunities' && (
            <OpportunitiesPage 
              showToast={showToast} 
              currentUser={currentUser} 
              onNavigateQuotations={() => navigateTo('quotations', {})} 
            />
          )}

          {currentPage === 'quotations' && (
            <QuotationsPage
              showToast={showToast}
              currentUser={currentUser}
              initialStatusFilter={currentFilterStatus}
              initialOpenReport={openReportModal}
              onClearOpenReport={() => setOpenReportModal(false)}
            />
          )}

          {currentPage === 'approval-inbox' && (
            <ApprovalInboxPage
              showToast={showToast}
              currentUser={currentUser}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'daily-expenses' && (
            <DailyVisitExpensesPage
              showToast={showToast}
              currentUser={currentUser}
              initialStatusFilter={currentFilterStatus}
            />
          )}

          {currentPage === 'masters' && (
            <MastersPage showToast={showToast} />
          )}

          {currentPage === 'employees' && (
            <EmployeesPage showToast={showToast} />
          )}

          {currentPage === 'customers' && (
            <CustomersPage showToast={showToast} />
          )}

          {currentPage === 'contact-persons' && (
            <ContactPersonsPage showToast={showToast} />
          )}

          {currentPage === 'security' && (
            <SecurityPermissionsPage 
              showToast={showToast} 
              currentUser={currentUser} 
            />
          )}
        </main>
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setSchedulePreselectedClient(null);
        }}
        onSchedule={handleScheduleVisit}
        clients={clients}
      />

      {/* Check In / Out Modal */}
      <CheckInModal
        isOpen={!!activeCheckInVisit}
        visit={activeCheckInVisit}
        onClose={() => setActiveCheckInVisit(null)}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      {/* Visit Details Modal */}
      <VisitDetailsModal
        isOpen={!!activeDetailsVisit}
        visit={activeDetailsVisit}
        onClose={() => setActiveDetailsVisit(null)}
        onOpenCheckIn={(visit) => setActiveCheckInVisit(visit)}
      />
    </div>
  );
}
