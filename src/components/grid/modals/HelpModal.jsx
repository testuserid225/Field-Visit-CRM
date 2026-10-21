import React, { useState } from 'react';
import { HelpCircle, SlidersHorizontal, Filter, Database, Palette, BarChart3, FolderTree, TableProperties, FileText, Download, Bell, X, Check } from 'lucide-react';

export default function HelpModal({
  isOpen,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <HelpCircle size={18} color="var(--primary-600)" />
            <span>Advanced Data Grid User Guide & Help</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: '1. Actions & Toolbar' },
            { id: 'columns_filters', label: '2. Columns & Filters' },
            { id: 'analytics', label: '3. Charts & Pivots' },
            { id: 'reports_export', label: '4. Reports & Exports' },
            { id: 'licensing', label: '5. Licensing Transparency' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 14px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : 'none',
                color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--text-muted)',
                background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                About the Enterprise Data Grid
              </h4>
              <p>
                The Advanced Data Grid is built on <strong>AG Grid React</strong>, delivering high-performance virtualized rendering, sub-millisecond scrolling, and comprehensive data analytics directly inside your existing React CRM.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginTop: '6px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-700)' }}>
                    <Database size={15} />
                    <span>Quick Search & Filtering</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Type in the top search bar to immediately filter across all columns with debounced instant querying.
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-700)' }}>
                    <SlidersHorizontal size={15} />
                    <span>Actions Dropdown Menu</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Click <strong>Actions</strong> to access the 11 integrated tools for Columns, Filters, Data, Charts, Groups, Pivots, Reports, and Downloads.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'columns_filters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                Columns & Multi-Rule Filtering
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Column Chooser:</strong> In <em>Actions &gt; Columns</em>, check or uncheck boxes to show/hide specific columns. Use the Up/Down arrow buttons to reorder columns horizontally.
                </li>
                <li>
                  <strong>Resize & Sort:</strong> Drag column header dividers to resize column widths. Click any header once for Ascending, twice for Descending, or hold Shift to multi-sort.
                </li>
                <li>
                  <strong>Advanced Filters:</strong> In <em>Actions &gt; Filter</em>, add multi-criteria rules using 10 operators including <code>contains</code>, <code>equals</code>, <code>greater than</code>, and <code>in list</code>.
                </li>
                <li>
                  <strong>Active Filter Badges:</strong> Active filter criteria appear as clickable chips above the grid. Click the "x" on any chip to immediately remove that condition.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                Visual Charts & Cross-Tab Pivots
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Interactive Charts:</strong> Select <em>Actions &gt; Chart</em> to view real-time Bar, Line, Area, and Pie charts. Choose your Category dimension (X-axis) and Metric value (Y-axis) with Sum, Count, or Average.
                </li>
                <li>
                  <strong>Group By Summaries:</strong> In <em>Actions &gt; Group By</em>, organize records into collapsible categories by any attribute (e.g. by status, industry, department) with live counts.
                </li>
                <li>
                  <strong>2D Pivot Tables:</strong> Open <em>Actions &gt; Pivot</em> to create cross-tabulated matrixes with Row dimensions, Column dimensions, and dynamic cell aggregations (Sum, Avg, Min, Max). Export the calculated pivot table directly to Excel!
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'reports_export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                Report Profiles, Subscriptions & Exports
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Save Report:</strong> Save current visible columns, filters, and sort orders under custom names (e.g. "Active Prospects View") for instant 1-click loading.
                </li>
                <li>
                  <strong>Export Excel (.xlsx):</strong> Exports pure binary Excel spreadsheets using the SheetJS engine with column auto-sizing and number formatting.
                </li>
                <li>
                  <strong>Export PDF:</strong> Generates formatted printable PDFs with enterprise headers, timestamps, and page numbers via jsPDF.
                </li>
                <li>
                  <strong>Scope Toggle:</strong> Toggle between exporting only filtered records or the complete raw dataset.
                </li>
                <li>
                  <strong>Subscriptions:</strong> Configure automated delivery schedules (Daily/Weekly/Monthly) with recipient email lists and format selection.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'licensing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                AG Grid Community vs Enterprise Licensing
              </h4>
              <div className="grid-license-notice">
                <span>
                  This application strictly complies with AG Grid licence terms. All enterprise-style capabilities (Charts, Pivot, Excel Export, Grouping) are provided using robust open-source libraries (Recharts, SheetJS, jsPDF) under permissive free licences, avoiding proprietary Enterprise fees.
                </span>
              </div>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid var(--border-subtle)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)' }}>
                    <th style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>Feature</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>AG Grid Core</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>Integrated Implementation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Data Grid & Virtualization</td>
                    <td style={{ padding: '8px' }}>Community (Free)</td>
                    <td style={{ padding: '8px', color: '#059669', fontWeight: 700 }}>✅ AG Grid Community v36</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Interactive Charts</td>
                    <td style={{ padding: '8px' }}>Enterprise (Paid)</td>
                    <td style={{ padding: '8px', color: '#059669', fontWeight: 700 }}>✅ Recharts (Free MIT)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Pivot Matrix</td>
                    <td style={{ padding: '8px' }}>Enterprise (Paid)</td>
                    <td style={{ padding: '8px', color: '#059669', fontWeight: 700 }}>✅ Custom 2D Cross-Tab Engine (Free)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Excel (.xlsx) Export</td>
                    <td style={{ padding: '8px' }}>Enterprise (Paid)</td>
                    <td style={{ padding: '8px', color: '#059669', fontWeight: 700 }}>✅ SheetJS / xlsx (Free)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 600 }}>PDF Document Export</td>
                    <td style={{ padding: '8px' }}>Not Built-in</td>
                    <td style={{ padding: '8px', color: '#059669', fontWeight: 700 }}>✅ jsPDF & Autotable (Free)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid-modal-footer">
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}
