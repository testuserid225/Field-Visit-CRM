import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// AG Grid Styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './AdvancedDataGrid.css';

// Toolbar & Modals
import GridActionsToolbar from './GridActionsToolbar';
import ColumnsModal from './modals/ColumnsModal';
import FilterModal from './modals/FilterModal';
import DataModal from './modals/DataModal';
import FormatModal from './modals/FormatModal';
import ChartModal from './modals/ChartModal';
import GroupByModal from './modals/GroupByModal';
import PivotModal from './modals/PivotModal';
import ReportModal from './modals/ReportModal';
import DownloadModal from './modals/DownloadModal';
import SubscriptionModal from './modals/SubscriptionModal';
import HelpModal from './modals/HelpModal';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loader2, Inbox } from 'lucide-react';

// Register AG Grid Community Modules (Free tier)
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AdvancedDataGrid({
  gridId = 'crm_grid',
  title = '',
  subtitle = '',
  rowData = [],
  columnDefs = [],
  isLoading = false,
  onRefresh = null,
  currentUser = null,
  showToast = null,
  primaryAction = null,
  exportFilename = 'CRM_Export',
  customFilters = null,
  defaultPageSize = 25,
  rowSelection = 'multiple',
  onRowClicked = null,
  onSelectionChanged = null
}) {
  const gridRef = useRef(null);
  const [gridApi, setGridApi] = useState(null);

  // Toolbar & Search state
  const [quickSearch, setQuickSearch] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Modals visibility state
  const [openModal, setOpenModal] = useState(null); // 'columns' | 'filter' | 'data' | 'format' | 'chart' | 'groupby' | 'pivot' | 'report' | 'download' | 'subscription' | 'help'

  // Columns visibility & order state
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    return columnDefs.filter(c => !c.hide).map(c => c.field || c.colId);
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    return columnDefs.map(c => c.field || c.colId);
  });

  // Custom filter rules state
  const [activeFilters, setActiveFilters] = useState([]);

  // Sort model state
  const [sortModel, setSortModel] = useState([]);

  // Group by column
  const [groupByColumn, setGroupByColumn] = useState('');

  // Format preferences
  const [formatConfig, setFormatConfig] = useState({
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'YYYY-MM-DD',
    decimals: 2,
    useThousandsSeparator: true,
    enableStatusBadges: true,
    highlightHighValues: false
  });

  // Detect dark mode from document body or data-theme attribute
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark' || theme === 'obsidian');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Sync column visibility when columnDefs change
  useEffect(() => {
    if (columnDefs && columnDefs.length > 0) {
      const allKeys = columnDefs.map(c => c.field || c.colId);
      setVisibleColumnKeys(prev => {
        if (prev.length === 0) return columnDefs.filter(c => !c.hide).map(c => c.field || c.colId);
        return prev;
      });
      setColumnOrder(prev => {
        if (prev.length === 0) return allKeys;
        return prev;
      });
    }
  }, [columnDefs]);

  // Handle AG Grid Ready
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Sync pageSize dynamically with gridApi
  useEffect(() => {
    if (gridApi && !gridApi.isDestroyed?.()) {
      try {
        if (typeof gridApi.setGridOption === 'function') {
          gridApi.setGridOption('paginationPageSize', pageSize);
        } else if (typeof gridApi.paginationSetPageSize === 'function') {
          gridApi.paginationSetPageSize(pageSize);
        }
      } catch (e) {
        console.warn('Grid API page size sync notice:', e);
      }
    }
  }, [gridApi, pageSize]);

  // Filter evaluation engine
  const filteredRowData = useMemo(() => {
    if (!rowData || !Array.isArray(rowData)) return [];

    let result = [...rowData];

    // 1. Apply multi-rule active filters
    if (activeFilters.length > 0) {
      result = result.filter(row => {
        return activeFilters.every(rule => {
          const val = row[rule.field];
          const query = String(rule.value || '').trim().toLowerCase();
          const target = val === undefined || val === null ? '' : String(val).toLowerCase();

          switch (rule.operator) {
            case 'contains':
              return target.includes(query);
            case 'equals':
              return target === query;
            case 'notEqual':
              return target !== query;
            case 'startsWith':
              return target.startsWith(query);
            case 'endsWith':
              return target.endsWith(query);
            case 'greaterThan': {
              const numVal = Number(val);
              const numQ = Number(rule.value);
              return !isNaN(numVal) && !isNaN(numQ) && numVal > numQ;
            }
            case 'lessThan': {
              const numVal = Number(val);
              const numQ = Number(rule.value);
              return !isNaN(numVal) && !isNaN(numQ) && numVal < numQ;
            }
            case 'inList': {
              const items = query.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
              return items.includes(target);
            }
            case 'blank':
              return target === '';
            case 'notBlank':
              return target !== '';
            default:
              return true;
          }
        });
      });
    }

    // 2. Apply quick global search
    if (quickSearch && quickSearch.trim()) {
      const q = quickSearch.trim().toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => {
          if (v === null || v === undefined) return false;
          if (typeof v === 'object') return false;
          return String(v).toLowerCase().includes(q);
        });
      });
    }

    // 3. Apply Multi-Sort if specified
    if (sortModel.length > 0) {
      result.sort((a, b) => {
        for (const sortItem of sortModel) {
          const { colId, sort } = sortItem;
          const valA = a[colId];
          const valB = b[colId];

          if (valA === valB) continue;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;

          let comp = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            comp = valA - valB;
          } else {
            comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
          }
          return sort === 'asc' ? comp : -comp;
        }
        return 0;
      });
    }

    return result;
  }, [rowData, activeFilters, quickSearch, sortModel]);

  // Enhanced Column Definitions with Visibility, Ordering & Formatters
  const processedColumnDefs = useMemo(() => {
    if (!columnDefs || columnDefs.length === 0) return [];

    // Map columns in current order
    const colMap = new Map();
    columnDefs.forEach(c => colMap.set(c.field || c.colId, c));

    const ordered = [];
    columnOrder.forEach(key => {
      if (colMap.has(key)) {
        ordered.push(colMap.get(key));
        colMap.delete(key);
      }
    });
    // Append any remaining
    colMap.forEach(c => ordered.push(c));

    return ordered.map(col => {
      const key = col.field || col.colId || col.headerName || '';
      const isVisible = visibleColumnKeys.includes(key);

      // Enhance Cell Renderer for Status if not already custom-defined
      let cellRenderer = col.cellRenderer;
      const lowerKey = typeof key === 'string' ? key.toLowerCase() : '';
      const lowerHeader = typeof col.headerName === 'string' ? col.headerName.toLowerCase() : '';

      if (!cellRenderer && formatConfig.enableStatusBadges && (lowerKey.includes('status') || lowerHeader.includes('status'))) {
        cellRenderer = (params) => {
          if (!params.value) return '-';
          const val = String(params.value);
          const low = val.toLowerCase();
          let cls = 'pending';
          if (low.includes('active') || low.includes('approved') || low.includes('completed')) cls = 'active';
          if (low.includes('inactive') || low.includes('rejected') || low.includes('cancelled')) cls = 'inactive';
          if (low.includes('draft') || low.includes('submitted')) cls = 'pending';

          return (
            <span className={`ag-status-badge ${cls}`}>
              {val}
            </span>
          );
        };
      }

      // Enhance Value Formatter for Currency / Numbers / Dates
      let valueFormatter = col.valueFormatter;
      if (!valueFormatter) {
        if (col.type === 'currency' || lowerKey.includes('amount') || lowerKey.includes('claim') || lowerKey.includes('price') || lowerKey.includes('total')) {
          valueFormatter = (params) => {
            if (params.value === undefined || params.value === null || params.value === '') return '-';
            const num = Number(params.value);
            if (isNaN(num)) return params.value;
            const sym = formatConfig.currencySymbol ? formatConfig.currencySymbol + ' ' : '';
            return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: formatConfig.decimals, maximumFractionDigits: formatConfig.decimals })}`;
          };
        } else if (col.type === 'date' || lowerKey.includes('date')) {
          valueFormatter = (params) => {
            if (!params.value) return '-';
            try {
              const d = new Date(params.value);
              if (isNaN(d.getTime())) return params.value;
              if (formatConfig.dateFormat === 'DD/MM/YYYY') {
                return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              }
              if (formatConfig.dateFormat === 'MM/DD/YYYY') {
                return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
              }
              if (formatConfig.dateFormat === 'DD-MMM-YYYY') {
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              }
              return d.toISOString().split('T')[0];
            } catch {
              return params.value;
            }
          };
        }
      }

      return {
        ...col,
        hide: !isVisible,
        cellRenderer,
        valueFormatter,
        sortable: col.sortable !== false,
        filter: col.filter !== false,
        resizable: col.resizable !== false
      };
    });
  }, [columnDefs, columnOrder, visibleColumnKeys, formatConfig]);

  // Default Column Definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
    flex: 1
  }), []);

  // Filter badges for toolbar
  const filterBadges = useMemo(() => {
    return activeFilters.map(f => {
      const col = columnDefs.find(c => (c.field || c.colId) === f.field);
      const colLabel = col?.headerName || f.field;
      return {
        id: f.id,
        label: `${colLabel} ${f.operator} "${f.value || ''}"`
      };
    });
  }, [activeFilters, columnDefs]);

  // Column config apply
  const handleApplyColumns = (visibleKeys, newOrder) => {
    setVisibleColumnKeys(visibleKeys);
    if (newOrder) setColumnOrder(newOrder);
    if (showToast) showToast('Column configuration updated.');
  };

  const handleResetColumns = () => {
    setVisibleColumnKeys(columnDefs.filter(c => !c.hide).map(c => c.field || c.colId));
    setColumnOrder(columnDefs.map(c => c.field || c.colId));
    if (showToast) showToast('Columns restored to default.');
  };

  // Direct export helper for Actions > Download subitems
  const handleDirectExport = (type) => {
    const targetCols = columnDefs.filter(c => visibleColumnKeys.includes(c.field || c.colId));
    const finalFilename = `${exportFilename}_${new Date().toISOString().split('T')[0]}`;

    if (type === 'csv') {
      if (gridApi) {
        gridApi.exportDataAsCsv({ fileName: `${finalFilename}.csv` });
      } else {
        const headers = targetCols.map(c => c.headerName || c.field);
        const rows = filteredRowData.map(item => targetCols.map(col => `"${String(item[col.field || col.colId] || '').replace(/"/g, '""')}"`).join(','));
        const blob = new Blob([[headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${finalFilename}.csv`;
        a.click();
        URL.revokeObjectURL(a);
      }
      if (showToast) showToast('CSV exported successfully!');
    } else if (type === 'xlsx') {
      const sheetData = filteredRowData.map((item, idx) => {
        const obj = {};
        targetCols.forEach(c => {
          const k = c.headerName || c.field;
          obj[k] = c.field === 'index' ? idx + 1 : item[c.field || c.colId] ?? '';
        });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      XLSX.writeFile(wb, `${finalFilename}.xlsx`);
      if (showToast) showToast('Excel spreadsheet exported successfully!');
    } else if (type === 'pdf') {
      const doc = new jsPDF({ orientation: targetCols.length > 6 ? 'landscape' : 'portrait' });
      doc.setFontSize(14);
      doc.setTextColor(5, 150, 105);
      doc.text(title || exportFilename.replace(/_/g, ' '), 14, 18);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleString()} | ${filteredRowData.length} records`, 14, 24);

      autoTable(doc, {
        head: [targetCols.map(c => c.headerName || c.field)],
        body: filteredRowData.map((item, idx) => targetCols.map(c => c.field === 'index' ? String(idx + 1) : String(item[c.field || c.colId] ?? ''))),
        startY: 28,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255 }
      });
      doc.save(`${finalFilename}.pdf`);
      if (showToast) showToast('PDF document exported successfully!');
    }
  };

  // State snapshot for Report Profile saving
  const currentGridState = useMemo(() => ({
    visibleColumnKeys,
    columnOrder,
    activeFilters,
    sortModel,
    groupByColumn,
    pageSize,
    formatConfig
  }), [visibleColumnKeys, columnOrder, activeFilters, sortModel, groupByColumn, pageSize, formatConfig]);

  // Load Report State
  const handleLoadReportState = (savedState) => {
    if (!savedState) return;
    if (savedState.visibleColumnKeys) setVisibleColumnKeys(savedState.visibleColumnKeys);
    if (savedState.columnOrder) setColumnOrder(savedState.columnOrder);
    if (savedState.activeFilters) setActiveFilters(savedState.activeFilters);
    if (savedState.sortModel) setSortModel(savedState.sortModel);
    if (savedState.groupByColumn !== undefined) setGroupByColumn(savedState.groupByColumn);
    if (savedState.pageSize) setPageSize(savedState.pageSize);
    if (savedState.formatConfig) setFormatConfig(savedState.formatConfig);
  };

  // Reset all to default state
  const handleResetAll = () => {
    setQuickSearch('');
    setActiveFilters([]);
    setSortModel([]);
    setGroupByColumn('');
    setPageSize(defaultPageSize);
    handleResetColumns();
    setFormatConfig({
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'YYYY-MM-DD',
      decimals: 2,
      useThousandsSeparator: true,
      enableStatusBadges: true,
      highlightHighValues: false
    });
    if (showToast) showToast('Restored default grid state.');
  };

  return (
    <div className="advanced-grid-container" id={`grid-container-${gridId}`}>
      {/* Top Actions Toolbar */}
      <GridActionsToolbar
        quickSearchText={quickSearch}
        onQuickSearchChange={setQuickSearch}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalRecords={rowData.length}
        filteredRecordsCount={filteredRowData.length}
        onOpenModal={setOpenModal}
        onRefreshData={onRefresh}
        onResetAll={handleResetAll}
        onDirectExport={handleDirectExport}
        customFilters={customFilters}
        activeFilterBadges={filterBadges}
        onRemoveFilterBadge={(id) => setActiveFilters(prev => prev.filter(f => f.id !== id))}
        onClearAllFilterBadges={() => setActiveFilters([])}
        primaryAction={primaryAction}
      />

      {/* Main Grid Viewport */}
      <div style={{ position: 'relative', width: '100%', minHeight: '520px', height: '620px' }}>
        {isLoading ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            gap: '12px'
          }}>
            <Loader2 size={36} color="var(--primary-600)" className="animate-spin" />
            <span style={{ fontWeight: 750, fontSize: '0.875rem', color: 'var(--text-main)', letterSpacing: '0.01em' }}>
              Loading Grid Records...
            </span>
          </div>
        ) : filteredRowData.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px 20px',
            color: 'var(--text-muted)',
            gap: '12px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <Inbox size={32} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
              No Matching Records Found
            </div>
            <div style={{ fontSize: '0.8125rem', maxWidth: '360px', textAlign: 'center', lineHeight: 1.5 }}>
              {quickSearch || activeFilters.length > 0 ? (
                <span>Try clearing search keywords or active filters in the Actions toolbar.</span>
              ) : (
                <span>No records available in this database view.</span>
              )}
            </div>
            {(quickSearch || activeFilters.length > 0) && (
              <button
                type="button"
                onClick={handleResetAll}
                className="clear-all-filters-btn"
                style={{ marginTop: '8px', fontSize: '0.8125rem' }}
              >
                Reset Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={isDarkMode ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'}
            style={{ width: '100%', height: '100%' }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={filteredRowData}
              columnDefs={processedColumnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={pageSize}
              paginationPageSizeSelector={[10, 25, 50, 100, 500]}
              rowSelection={rowSelection}
              onGridReady={onGridReady}
              onRowClicked={onRowClicked}
              onSelectionChanged={onSelectionChanged}
              animateRows={true}
              enableCellTextSelection={true}
              suppressMenuHide={true}
              headerHeight={46}
              rowHeight={52}
            />
          </div>
        )}
      </div>

      {/* 11 Integrated Modals for Actions Menu */}
      <ColumnsModal
        isOpen={openModal === 'columns'}
        onClose={() => setOpenModal(null)}
        columns={columnDefs}
        visibleColumnKeys={visibleColumnKeys}
        onApplyColumns={handleApplyColumns}
        onResetColumns={handleResetColumns}
      />

      <FilterModal
        isOpen={openModal === 'filter'}
        onClose={() => setOpenModal(null)}
        columns={columnDefs}
        activeFilters={activeFilters}
        onApplyFilters={setActiveFilters}
        onClearAllFilters={() => setActiveFilters([])}
      />

      <DataModal
        isOpen={openModal === 'data'}
        onClose={() => setOpenModal(null)}
        columns={columnDefs}
        sortModel={sortModel}
        onApplySort={setSortModel}
        onRefreshData={onRefresh}
        onResetDataState={handleResetAll}
      />

      <FormatModal
        isOpen={openModal === 'format'}
        onClose={() => setOpenModal(null)}
        formatConfig={formatConfig}
        onApplyFormat={setFormatConfig}
        onResetFormat={() => setFormatConfig({
          currency: 'INR',
          currencySymbol: '₹',
          dateFormat: 'YYYY-MM-DD',
          decimals: 2,
          useThousandsSeparator: true,
          enableStatusBadges: true,
          highlightHighValues: false
        })}
      />

      <ChartModal
        isOpen={openModal === 'chart'}
        onClose={() => setOpenModal(null)}
        data={filteredRowData}
        columns={columnDefs}
      />

      <GroupByModal
        isOpen={openModal === 'groupby'}
        onClose={() => setOpenModal(null)}
        data={filteredRowData}
        columns={columnDefs}
        activeGroupByColumn={groupByColumn}
        onApplyGroupBy={setGroupByColumn}
        onClearGroupBy={() => setGroupByColumn('')}
      />

      <PivotModal
        isOpen={openModal === 'pivot'}
        onClose={() => setOpenModal(null)}
        data={filteredRowData}
        columns={columnDefs}
      />

      <ReportModal
        isOpen={openModal === 'report'}
        onClose={() => setOpenModal(null)}
        gridId={gridId}
        currentUser={currentUser}
        currentGridState={currentGridState}
        onLoadReportState={handleLoadReportState}
        onResetToDefault={handleResetAll}
        showToast={showToast}
      />

      <DownloadModal
        isOpen={openModal === 'download'}
        onClose={() => setOpenModal(null)}
        data={rowData}
        filteredData={filteredRowData}
        columns={columnDefs}
        visibleColumnKeys={visibleColumnKeys}
        gridApi={gridApi}
        filename={exportFilename}
        showToast={showToast}
      />

      <SubscriptionModal
        isOpen={openModal === 'subscription'}
        onClose={() => setOpenModal(null)}
        gridId={gridId}
        currentUser={currentUser}
        showToast={showToast}
      />

      <HelpModal
        isOpen={openModal === 'help'}
        onClose={() => setOpenModal(null)}
      />
    </div>
  );
}
