import React, { useState } from 'react';
import { FileSpreadsheet, Download, Check, Loader2 } from 'lucide-react';
import { exportToExcel } from '../utils/excelExportUtils';

export default function ExportExcelButton({
  data = [],
  columns = [],
  visibleColumns = null,
  filename = 'CRM_Export',
  sheetName = 'Data',
  buttonLabel = 'Export Excel',
  showToast = null,
  style = {},
  id = 'export-excel-btn'
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      if (typeof showToast === 'function') {
        showToast('No records available to export.');
      } else {
        alert('No records available to export.');
      }
      return;
    }

    setIsExporting(true);
    try {
      // Small tick for smooth UI transition
      await new Promise(res => setTimeout(res, 80));

      const res = await exportToExcel({
        data,
        columns,
        visibleColumns,
        filename,
        sheetName
      });

      setIsSuccess(true);
      if (typeof showToast === 'function') {
        showToast(`Exported ${res.count} records to ${res.filename} successfully!`);
      }

      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Export Excel error:', err);
      if (typeof showToast === 'function') {
        showToast(err.message || 'Failed to export Excel file.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const count = Array.isArray(data) ? data.length : 0;

  return (
    <button
      type="button"
      id={id}
      onClick={handleExport}
      disabled={isExporting || count === 0}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '8px 14px',
        borderRadius: '10px',
        backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
        color: isSuccess ? '#10b981' : 'var(--text-main)',
        border: isSuccess ? '1px solid #10b981' : '1px solid var(--border-subtle)',
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: count === 0 ? 'not-allowed' : 'pointer',
        opacity: count === 0 ? 0.6 : 1,
        transition: 'all 0.15s ease',
        boxShadow: 'var(--shadow-sm)',
        userSelect: 'none',
        ...style
      }}
      title={count === 0 ? 'No records to export' : `Export ${count} records to Microsoft Excel (.xlsx)`}
      onMouseEnter={(e) => {
        if (count > 0 && !isSuccess) {
          e.currentTarget.style.borderColor = '#10b981';
          e.currentTarget.style.color = 'var(--primary-400)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSuccess) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-main)';
        }
      }}
    >
      {isExporting ? (
        <Loader2 size={14} className="animate-spin" color="var(--primary-400)" />
      ) : isSuccess ? (
        <Check size={14} color="#10b981" />
      ) : (
        <FileSpreadsheet size={15} color="#10b981" />
      )}
      <span>{isSuccess ? 'Exported!' : buttonLabel}</span>
      {count > 0 && (
        <span style={{
          backgroundColor: isSuccess ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
          color: isSuccess ? '#000' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: 800,
          padding: '1px 6px',
          borderRadius: '8px',
          marginLeft: '2px'
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
