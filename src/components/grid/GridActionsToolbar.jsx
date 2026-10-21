import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Filter,
  Database,
  Palette,
  BarChart3,
  FolderTree,
  TableProperties,
  FileText,
  Download,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  RefreshCw,
  FileSpreadsheet,
  Save,
  Bookmark,
  RotateCcw,
  Check,
  PlusCircle
} from 'lucide-react';

export default function GridActionsToolbar({
  quickSearchText = '',
  onQuickSearchChange,
  pageSize = 25,
  onPageSizeChange,
  totalRecords = 0,
  filteredRecordsCount = 0,
  onOpenModal,
  onRefreshData,
  onResetAll,
  onDirectExport,
  customFilters = null,
  activeFilterBadges = [],
  onRemoveFilterBadge,
  onClearAllFilterBadges,
  primaryAction = null
}) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'data' | 'report' | 'download'
  const actionsRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setIsActionsOpen(false);
        setActiveSubmenu(null);
      }
    }
    if (isActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsOpen]);

  const handleActionClick = (modalName) => {
    setIsActionsOpen(false);
    setActiveSubmenu(null);
    onOpenModal(modalName);
  };

  return (
    <div>
      {/* Primary Toolbar */}
      <div className="grid-toolbar">
        {/* Left Side: Search & Custom Filter Pills */}
        <div className="grid-toolbar-left">
          {/* Quick Search Input */}
          <div className="grid-search-box">
            <Search size={15} className="grid-search-icon" />
            <input
              type="text"
              className="grid-search-input"
              placeholder="Quick search records..."
              value={quickSearchText}
              onChange={e => onQuickSearchChange(e.target.value)}
            />
            {quickSearchText && (
              <button
                type="button"
                className="grid-search-clear"
                onClick={() => onQuickSearchChange('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Optional Injected Page Filters (e.g. Type, Status) */}
          {customFilters}
        </div>

        {/* Right Side: Page Size, Counter, Refresh, Actions Dropdown, Primary Button */}
        <div className="grid-toolbar-right">
          {/* Page Size Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600 }}>Show:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>All (500)</option>
            </select>
          </div>

          {/* Record Count Badge */}
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-main)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}>
            {filteredRecordsCount === totalRecords ? (
              <span>{totalRecords} records</span>
            ) : (
              <span>{filteredRecordsCount} of {totalRecords}</span>
            )}
          </div>

          {/* Quick Refresh Button */}
          {typeof onRefreshData === 'function' && (
            <button
              type="button"
              onClick={onRefreshData}
              title="Refresh Data from Server"
              style={{
                padding: '7px 9px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-600)'; e.currentTarget.style.borderColor = 'var(--primary-300)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <RefreshCw size={14} />
            </button>
          )}

          {/* ACTIONS DROPDOWN BUTTON (Main Prompt Requirement) */}
          <div style={{ position: 'relative' }} ref={actionsRef}>
            <button
              type="button"
              className={`actions-btn ${isActionsOpen ? 'active' : ''}`}
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              id="grid-actions-menu-btn"
            >
              <SlidersHorizontal size={14} color="var(--primary-600)" />
              <span>Actions</span>
              <ChevronDown size={14} style={{ transform: isActionsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>

            {/* 11-Option Enterprise Actions Dropdown Menu */}
            {isActionsOpen && (
              <div className="actions-menu-popover">
                {/* 1. Columns */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('columns')}
                >
                  <div className="actions-menu-item-left">
                    <SlidersHorizontal size={14} className="actions-menu-icon" />
                    <span>Columns</span>
                  </div>
                </button>

                {/* 2. Filter */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('filter')}
                >
                  <div className="actions-menu-item-left">
                    <Filter size={14} className="actions-menu-icon" />
                    <span>Filter</span>
                  </div>
                </button>

                {/* 3. Data (with Submenu) */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setActiveSubmenu('data')}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <button
                    type="button"
                    className={`actions-menu-item ${activeSubmenu === 'data' ? 'active' : ''}`}
                    onClick={() => handleActionClick('data')}
                  >
                    <div className="actions-menu-item-left">
                      <Database size={14} className="actions-menu-icon" />
                      <span>Data</span>
                    </div>
                    <ChevronRight size={13} className="actions-menu-chevron" />
                  </button>

                  {/* Submenu for Data */}
                  {activeSubmenu === 'data' && (
                    <div className="actions-submenu-flyout">
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => {
                          setIsActionsOpen(false);
                          if (onRefreshData) onRefreshData();
                        }}
                      >
                        <div className="actions-menu-item-left">
                          <RefreshCw size={13} className="actions-menu-icon" />
                          <span>Refresh Grid</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => handleActionClick('data')}
                      >
                        <div className="actions-menu-item-left">
                          <SlidersHorizontal size={13} className="actions-menu-icon" />
                          <span>Multi-Sort Hierarchy</span>
                        </div>
                      </button>
                      <div className="actions-menu-divider" />
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => {
                          setIsActionsOpen(false);
                          onResetAll();
                        }}
                      >
                        <div className="actions-menu-item-left">
                          <RotateCcw size={13} style={{ color: '#ef4444' }} />
                          <span style={{ color: '#ef4444' }}>Restore Default State</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Format */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('format')}
                >
                  <div className="actions-menu-item-left">
                    <Palette size={14} className="actions-menu-icon" />
                    <span>Format</span>
                  </div>
                </button>

                {/* 5. Chart */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('chart')}
                >
                  <div className="actions-menu-item-left">
                    <BarChart3 size={14} className="actions-menu-icon" />
                    <span>Chart</span>
                  </div>
                </button>

                {/* 6. Group By */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('groupby')}
                >
                  <div className="actions-menu-item-left">
                    <FolderTree size={14} className="actions-menu-icon" />
                    <span>Group By</span>
                  </div>
                </button>

                {/* 7. Pivot */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('pivot')}
                >
                  <div className="actions-menu-item-left">
                    <TableProperties size={14} className="actions-menu-icon" />
                    <span>Pivot</span>
                  </div>
                </button>

                <div className="actions-menu-divider" />

                {/* 8. Report (with Submenu) */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setActiveSubmenu('report')}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <button
                    type="button"
                    className={`actions-menu-item ${activeSubmenu === 'report' ? 'active' : ''}`}
                    onClick={() => handleActionClick('report')}
                  >
                    <div className="actions-menu-item-left">
                      <FileText size={14} className="actions-menu-icon" />
                      <span>Report</span>
                    </div>
                    <ChevronRight size={13} className="actions-menu-chevron" />
                  </button>

                  {/* Submenu for Report */}
                  {activeSubmenu === 'report' && (
                    <div className="actions-submenu-flyout">
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => handleActionClick('report')}
                      >
                        <div className="actions-menu-item-left">
                          <Save size={13} className="actions-menu-icon" />
                          <span>Save Report</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => handleActionClick('report')}
                      >
                        <div className="actions-menu-item-left">
                          <Bookmark size={13} className="actions-menu-icon" />
                          <span>Load Saved Report</span>
                        </div>
                      </button>
                      <div className="actions-menu-divider" />
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => {
                          setIsActionsOpen(false);
                          onResetAll();
                        }}
                      >
                        <div className="actions-menu-item-left">
                          <RotateCcw size={13} className="actions-menu-icon" />
                          <span>Reset</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 9. Download (with Submenu) */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setActiveSubmenu('download')}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <button
                    type="button"
                    className={`actions-menu-item ${activeSubmenu === 'download' ? 'active' : ''}`}
                    onClick={() => handleActionClick('download')}
                  >
                    <div className="actions-menu-item-left">
                      <Download size={14} className="actions-menu-icon" />
                      <span>Download</span>
                    </div>
                    <ChevronRight size={13} className="actions-menu-chevron" />
                  </button>

                  {/* Submenu for Download */}
                  {activeSubmenu === 'download' && (
                    <div className="actions-submenu-flyout">
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => {
                          setIsActionsOpen(false);
                          if (onDirectExport) onDirectExport('xlsx');
                        }}
                      >
                        <div className="actions-menu-item-left">
                          <FileSpreadsheet size={13} color="#059669" />
                          <span>Excel Spreadsheet (.xlsx)</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => {
                          setIsActionsOpen(false);
                          if (onDirectExport) onDirectExport('csv');
                        }}
                      >
                        <div className="actions-menu-item-left">
                          <FileText size={13} color="#0284c7" />
                          <span>CSV File (.csv)</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => {
                          setIsActionsOpen(false);
                          if (onDirectExport) onDirectExport('pdf');
                        }}
                      >
                        <div className="actions-menu-item-left">
                          <Download size={13} color="#dc2626" />
                          <span>PDF Document (.pdf)</span>
                        </div>
                      </button>
                      <div className="actions-menu-divider" />
                      <button
                        type="button"
                        className="actions-menu-item"
                        onClick={() => handleActionClick('download')}
                      >
                        <div className="actions-menu-item-left">
                          <SlidersHorizontal size={13} className="actions-menu-icon" />
                          <span>Custom Export Scope...</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 10. Subscription */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('subscription')}
                >
                  <div className="actions-menu-item-left">
                    <Bell size={14} className="actions-menu-icon" />
                    <span>Subscription</span>
                  </div>
                </button>

                <div className="actions-menu-divider" />

                {/* 11. Help */}
                <button
                  type="button"
                  className="actions-menu-item"
                  onClick={() => handleActionClick('help')}
                >
                  <div className="actions-menu-item-left">
                    <HelpCircle size={14} className="actions-menu-icon" />
                    <span>Help</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button (e.g. + Add Customer) */}
          {React.isValidElement(primaryAction) ? (
            primaryAction
          ) : primaryAction && typeof primaryAction === 'object' && primaryAction.label ? (
            <button
              id={primaryAction.id || 'grid-primary-action-btn'}
              type="button"
              className="btn btn-primary"
              onClick={primaryAction.onClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              {primaryAction.icon || <PlusCircle size={16} />}
              <span>{primaryAction.label}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Active Filters Badges Row */}
      {activeFilterBadges && activeFilterBadges.length > 0 && (
        <div className="grid-active-filters-bar">
          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
            Active Filters ({activeFilterBadges.length}):
          </span>

          {activeFilterBadges.map((badge, idx) => (
            <div key={badge.id || idx} className="filter-badge-chip">
              <span>{badge.label}</span>
              <button
                type="button"
                className="remove-chip-btn"
                onClick={() => onRemoveFilterBadge(badge.id)}
                title="Remove this filter condition"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="clear-all-filters-btn"
            onClick={onClearAllFilterBadges}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
