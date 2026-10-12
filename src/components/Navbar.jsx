import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Palette,
  Check,
  ChevronDown,
  LogOut
} from 'lucide-react';

export default function Navbar({
  currentPage,
  currentUser,
  searchQuery,
  setSearchQuery,
  currentTheme = 'emerald',
  onThemeChange,
  onLogout
}) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const pageTitles = {
    dashboard: 'Executive Dashboard',
    opportunities: 'Opportunities & Pipeline Management',
    quotations: 'Commercial Quotations & Revisions Management',
    'approval-inbox': 'Manager Approval Inbox - Daily Visit & Expenses',
    'daily-expenses': 'Daily Visit & Expenses Management',
    employees: 'Employee Directory & Personnel',
    customers: 'Customer Directory & Accounts',
    'contact-persons': 'Contact Persons Directory',
    masters: 'CRM Master Data Setup & Configurations',
    security: 'Security & Role-Based Menu Access Control',
    visits: 'Field Visits Management',
    clients: 'Client & Accounts Directory',
    tracker: 'Live Field GPS Tracking',
    reports: 'Field Performance Analytics',
  };

  const themes = [
    { id: 'emerald', name: 'Emerald Mint', color: '#10b981', desc: 'Fresh & High-Tech Field Ops' },
    { id: 'obsidian', name: 'Obsidian Night', color: '#0f1715', desc: 'Deep High-Contrast Dark Mode' },
    { id: 'violet', name: 'Royal Amethyst', color: '#8b5cf6', desc: 'Vibrant Neo-SaaS Palette' },
    { id: 'sunset', name: 'Cyber Sunset', color: '#f59e0b', desc: 'Warm Radiant Amber Glow' }
  ];

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const activeThemeObj = themes.find(t => t.id === currentTheme) || themes[0];

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease'
    }}>
      {/* Left: Page Title & Context */}
      <div>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          {pageTitles[currentPage] || 'Field Visit CRM'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Field Territory: <strong>{currentUser?.territory || 'Bangalore Region'}</strong></span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {todayFormatted}
          </span>
        </div>
      </div>

      {/* Middle: Quick Search */}
      {/* <div style={{
        position: 'relative',
        width: '320px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px' }} />
        <input 
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search visits, clients, areas..."
          style={{
            width: '100%',
            padding: '8px 14px 8px 36px',
            fontSize: '0.85rem',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            outline: 'none',
            color: 'var(--text-main)',
            transition: 'var(--transition)'
          }}
        />
      </div> */}

      {/* Right: Actions, Theme Switcher, GPS status & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Interactive Theme Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            id="theme-switcher-btn"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: activeThemeObj.color,
              boxShadow: `0 0 6px ${activeThemeObj.color}`
            }} />
            <span>{activeThemeObj.name}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {isThemeMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '42px',
              right: 0,
              width: '230px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
              padding: '8px',
              zIndex: 1000,
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-light)', padding: '6px 10px', textTransform: 'uppercase' }}>
                Select Design Theme
              </div>
              {themes.map(t => (
                <button
                  key={t.id}
                  id={`theme-opt-${t.id}`}
                  onClick={() => {
                    if (onThemeChange) onThemeChange(t.id);
                    setIsThemeMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    backgroundColor: currentTheme === t.id ? 'var(--primary-50)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== t.id) e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== t.id) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.color }} />
                    <div style={{ textAlign: 'left' }}>
                      <div>{t.name}</div>
                    </div>
                  </div>
                  {currentTheme === t.id && <Check size={14} color="var(--primary-600)" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Card & Sign Out (Aligned to top right side of Select Design Theme) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 14px 6px 8px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Avatar & User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.35)',
              flexShrink: 0
            }}>
              {currentUser?.avatar || 'ST'}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap'
              }}>
                {currentUser?.name || currentUser?.fullName || 'Shaikh Tareq'}
              </div>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                {currentUser?.role || currentUser?.designation || 'Administrator (ADMIN)'}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          {onLogout && (
            <button
              id="navbar-logout-btn"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.22)';
                e.currentTarget.style.color = '#fca5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.color = '#f87171';
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
