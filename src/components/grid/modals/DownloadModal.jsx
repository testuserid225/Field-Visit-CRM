import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, Check, X, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DownloadModal({
  isOpen,
  onClose,
  data = [],
  filteredData = [],
  columns = [],
  visibleColumnKeys = [],
  gridApi = null,
  filename = 'CRM_Export',
  showToast = null
}) {
  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'csv' | 'pdf'
  const [scope, setScope] = useState('filtered'); // 'filtered' | 'all'
  const [columnsScope, setColumnsScope] = useState('visible'); // 'visible' | 'all'
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const datasetToExport = scope === 'filtered' ? filteredData : data;

  const targetColumns = (columnsScope === 'visible' && visibleColumnKeys.length > 0)
    ? columns.filter(c => visibleColumnKeys.includes(c.field || c.colId))
    : columns.filter(c => !['select', 'actions'].includes(c.field || c.colId));

  const handleExport = async () => {
    if (!datasetToExport || datasetToExport.length === 0) {
      if (showToast) showToast('No records available to export.');
      return;
    }

    setIsExporting(true);
    const dateStr = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${scope}_${dateStr}`;

    try {
      if (format === 'csv') {
        // Generate CSV rows
        const headers = targetColumns.map(c => c.headerName || c.field);
        const rows = datasetToExport.map(item => {
          return targetColumns.map(col => {
            const val = item[col.field || col.colId];
            if (val === undefined || val === null) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          }).join(',');
        });

        const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${finalFilename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'xlsx') {
        // Export with SheetJS (xlsx)
        const sheetData = datasetToExport.map((item, idx) => {
          const rowObj = {};
          targetColumns.forEach(col => {
            const key = col.headerName || col.field;
            let val = item[col.field || col.colId];
            if (col.field === 'index') val = idx + 1;
            rowObj[key] = val !== undefined && val !== null ? val : '';
          });
          return rowObj;
        });

        const ws = XLSX.utils.json_to_sheet(sheetData);
        // Auto-fit column widths
        const colWidths = targetColumns.map(col => ({
          wch: Math.max((col.headerName || '').length + 4, 12)
        }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
        XLSX.writeFile(wb, `${finalFilename}.xlsx`);
      } else if (format === 'pdf') {
        // Export with jsPDF & autotable
        const doc = new jsPDF({ orientation: targetColumns.length > 6 ? 'landscape' : 'portrait' });

        // Enterprise Report Header
        doc.setFontSize(16);
        doc.setTextColor(5, 150, 105); // Emerald
        doc.text(filename.replace(/_/g, ' '), 14, 18);

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Scope: ${scope.toUpperCase()} records (${datasetToExport.length} rows)`, 14, 25);

        const tableHeaders = [targetColumns.map(c => c.headerName || c.field)];
        const tableBody = datasetToExport.map((item, idx) => {
          return targetColumns.map(col => {
            if (col.field === 'index') return String(idx + 1);
            const val = item[col.field || col.colId];
            return val !== undefined && val !== null ? String(val) : '';
          });
        });

        autoTable(doc, {
          head: tableHeaders,
          body: tableBody,
          startY: 30,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 249] }
        });

        doc.save(`${finalFilename}.pdf`);
      }

      if (showToast) {
        showToast(`Exported ${datasetToExport.length} records as ${format.toUpperCase()} successfully!`);
      }
      onClose();
    } catch (err) {
      console.error('Download export error:', err);
      if (showToast) showToast('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <Download size={18} color="var(--primary-600)" />
            <span>Download & Export Records</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid-modal-body">
          {/* License & Free Capability Disclosure */}
          <div className="grid-license-notice">
            <Info size={16} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 700 }}>Open Export Suite: </span>
              <span>
                AG Grid native Excel export requires an <strong>AG Grid Enterprise</strong> licence. Our application provides full <strong>Excel (.xlsx)</strong>, <strong>PDF</strong>, and <strong>CSV</strong> exports with custom column formatting completely free under open-source libraries.
              </span>
            </div>
          </div>

          {/* Export Format Select */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Choose File Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { id: 'xlsx', icon: FileSpreadsheet, label: 'Excel (.xlsx)', desc: 'Full spreadsheet with column widths' },
                { id: 'csv', icon: File, label: 'CSV (.csv)', desc: 'Universal raw data table' },
                { id: 'pdf', icon: FileText, label: 'PDF Document', desc: 'Formatted printable report' }
              ].map(fmt => {
                const Icon = fmt.icon;
                const isSel = format === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: isSel ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSel ? 'var(--primary-50)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={24} color={isSel ? 'var(--primary-700)' : 'var(--text-muted)'} style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSel ? 'var(--primary-700)' : 'var(--text-main)' }}>
                      {fmt.label}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.3 }}>
                      {fmt.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            padding: '14px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Record Scope */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Rows to Include
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>Filtered Rows ({filteredData.length})</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>All Dataset Rows ({data.length})</span>
                </label>
              </div>
            </div>

            {/* Column Scope */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Columns to Include
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportCols"
                    checked={columnsScope === 'visible'}
                    onChange={() => setColumnsScope('visible')}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>Visible Columns Only ({visibleColumnKeys.length})</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="exportCols"
                    checked={columnsScope === 'all'}
                    onChange={() => setColumnsScope('all')}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>All Columns ({columns.length})</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={isExporting || datasetToExport.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>{isExporting ? 'Generating...' : `Export ${datasetToExport.length} Records`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
