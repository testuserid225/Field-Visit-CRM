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
  PlusCircle,
  Sparkles,
  Layers,
  ArrowUpDown
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
    <div className="grid-toolbar-wrapper">
      {/* Primary Toolbar */}
      <div className="grid-toolbar">
        {/* Left Side: Search & Injected Custom Filter Controls */}
        <div className="grid-toolbar-left">
          {/* Quick Search Input */}
          <div className="grid-search-box">
            <Search size={15} className="grid-search-icon" />
            <input
              type="text"
              className="grid-search-input"
              placeholder="Search table records..."
              value={quickSearchText}
              onChange={e => onQuickSearchChange(e.target.value)}
            />
            {quickSearchText ? (
              <button
                type="button"
                className="grid-search-clear"
                onClick={() => onQuickSearchChange('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="grid-search-kbd" title="Search filter">/</span>
            )}
          </div>

          {/* Optional Injected Page Filters (e.g. Type, Status) */}
          {customFilters}
        </div>

        {/* Right Side: Page Size, Records Counter, Refresh, Actions Dropdown, Primary Button */}
        <div className="grid-toolbar-right">
          {/* Records Count Live Pill */}
          <div className="grid-records-pill" title="Current dataset visibility">
            <span className="grid-records-dot" />
            <span className="grid-records-text">
              {filteredRecordsCount === totalRecords ? (
                <><strong>{totalRecords}</strong> Records</>
              ) : (
                <><strong>{filteredRecordsCount}</strong> of {totalRecords}</>
              )}
            </span>
          </div>

          {/* Page Size Selector */}
          <div className="grid-pagesize-control" title="Rows per page">
            <span className="grid-pagesize-label">Show:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="grid-pagesize-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>All (500)</option>
            </select>
          </div>

          {/* Quick Refresh Button */}
          {typeof onRefreshData === 'function' && (
            <button
              type="button"
              onClick={onRefreshData}
              title="Refresh Data from Server"
              className="grid-icon-btn"
            >
              <RefreshCw size={14} className="grid-refresh-icon" />
            </button>
          )}

          {/* ACTIONS DROPDOWN BUTTON (Main Prompt Requirement) */}
          <div style={{ position: 'relative' }} ref={actionsRef}>
            <button
              type="button"
              className={`actions-btn ${isActionsOpen ? 'active' : ''}`}
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              id="grid-actions-menu-btn"
              title="Open Enterprise Grid Actions & Tools"
            >
              <div className="actions-btn-icon-bubble">
                <SlidersHorizontal size={14} />
              </div>
              <span className="actions-btn-label">Actions</span>
              <span className="actions-btn-badge">11</span>
              <ChevronDown
                size={14}
                className={`actions-btn-chevron ${isActionsOpen ? 'open' : ''}`}
              />
            </button>

            {/* 11-Option Enterprise Actions Dropdown Menu */}
            {isActionsOpen && (
              <div className="actions-menu-popover" role="menu">
                {/* Popover Header Banner */}
                <div className="actions-popover-header">
                  <div className="actions-header-title">
                    <Sparkles size={13} className="text-emerald" />
                    <span>Grid Tools & Analytics</span>
                  </div>
                  <span className="actions-header-tag">PRO</span>
                </div>

                <div className="actions-menu-scrollable">
                  {/* Category 1: View & Structure */}
                  <div className="actions-category-label">VIEW & STRUCTURE</div>

                  {/* 1. Columns */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('columns')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-sky">
                        <SlidersHorizontal size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Columns</span>
                        <span className="actions-item-desc">Show, hide & reorder columns</span>
                      </div>
                    </div>
                  </button>

                  {/* 4. Format */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('format')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-indigo">
                        <Palette size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Format</span>
                        <span className="actions-item-desc">Currency, dates & visual badges</span>
                      </div>
                    </div>
                  </button>

                  {/* Category 2: Analytics & Queries */}
                  <div className="actions-category-label">ANALYTICS & QUERY</div>

                  {/* 2. Filter */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('filter')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-amber">
                        <Filter size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Filter</span>
                        <span className="actions-item-desc">Multi-rule logic & custom conditions</span>
                      </div>
                    </div>
                  </button>

                  {/* 6. Group By */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('groupby')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-purple">
                        <FolderTree size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Group By</span>
                        <span className="actions-item-desc">Group rows by category or status</span>
                      </div>
                    </div>
                  </button>

                  {/* 7. Pivot */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('pivot')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-emerald">
                        <TableProperties size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Pivot</span>
                        <span className="actions-item-desc">2D cross-tab matrix analytics</span>
                      </div>
                    </div>
                  </button>

                  {/* 5. Chart */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('chart')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-rose">
                        <BarChart3 size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Chart</span>
                        <span className="actions-item-desc">Interactive visual bar & line charts</span>
                      </div>
                    </div>
                  </button>

                  {/* Category 3: Data & Export */}
                  <div className="actions-category-label">DATA & REPORTS</div>

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
                        <div className="actions-icon-bubble bubble-cyan">
                          <Database size={14} />
                        </div>
                        <div className="actions-item-meta">
                          <span className="actions-item-title">Data</span>
                          <span className="actions-item-desc">Sort order & data refresh</span>
                        </div>
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
                            <RefreshCw size={13} className="text-emerald" />
                            <span>Refresh Grid Data</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="actions-menu-item"
                          onClick={() => handleActionClick('data')}
                        >
                          <div className="actions-menu-item-left">
                            <ArrowUpDown size={13} className="text-cyan" />
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
                            <RotateCcw size={13} className="text-amber" />
                            <span>Reset Data State</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

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
                        <div className="actions-icon-bubble bubble-teal">
                          <FileText size={14} />
                        </div>
                        <div className="actions-item-meta">
                          <span className="actions-item-title">Report</span>
                          <span className="actions-item-desc">Save & load custom views</span>
                        </div>
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
                            <Save size={13} className="text-emerald" />
                            <span>Save Grid Profile</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="actions-menu-item"
                          onClick={() => handleActionClick('report')}
                        >
                          <div className="actions-menu-item-left">
                            <Bookmark size={13} className="text-teal" />
                            <span>Load Saved Profiles</span>
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
                            <RotateCcw size={13} className="text-amber" />
                            <span>Reset to Default</span>
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
                        <div className="actions-icon-bubble bubble-green">
                          <Download size={14} />
                        </div>
                        <div className="actions-item-meta">
                          <span className="actions-item-title">Download</span>
                          <span className="actions-item-desc">Excel (.xlsx), CSV or PDF</span>
                        </div>
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

                  {/* Category 4: System & License */}
                  <div className="actions-category-label">SYSTEM & SUPPORT</div>

                  {/* 10. Subscription */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('subscription')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-violet">
                        <Bell size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Subscription</span>
                        <span className="actions-item-desc">Enterprise license & add-ons</span>
                      </div>
                    </div>
                  </button>

                  {/* 11. Help */}
                  <button
                    type="button"
                    className="actions-menu-item"
                    onClick={() => handleActionClick('help')}
                  >
                    <div className="actions-menu-item-left">
                      <div className="actions-icon-bubble bubble-slate">
                        <HelpCircle size={14} />
                      </div>
                      <div className="actions-item-meta">
                        <span className="actions-item-title">Help & Shortcuts</span>
                        <span className="actions-item-desc">Documentation & keys</span>
                      </div>
                    </div>
                  </button>
                </div>
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
              className="grid-primary-action-btn"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon || <PlusCircle size={15} />}
              <span>{primaryAction.label}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Active Filters Badges Row */}
      {activeFilterBadges && activeFilterBadges.length > 0 && (
        <div className="grid-active-filters-bar">
          <span className="active-filters-title">
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
