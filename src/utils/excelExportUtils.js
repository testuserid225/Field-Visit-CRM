import * as XLSX from 'xlsx';

/**
 * Universal Excel Export Utility for Field Visit CRM
 * 
 * @param {Object} options
 * @param {Array<Object>} options.data - The array of row data to export
 * @param {Array<{ key: string, label: string, transform?: (val: any, row: any) => any }>} [options.columns] - Optional column definitions
 * @param {Array<string>} [options.visibleColumns] - Optional list of visible column keys to filter by
 * @param {string} [options.filename='Export'] - Base filename without extension
 * @param {string} [options.sheetName='Data'] - Name of the worksheet
 * @returns {Promise<{ success: boolean, count: number, filename: string }>}
 */
export async function exportToExcel({
  data = [],
  columns = [],
  visibleColumns = null,
  filename = 'CRM_Export',
  sheetName = 'Sheet1'
}) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No records available to export.');
  }

  // 1. Determine active columns to export
  let exportCols = columns;
  if (Array.isArray(visibleColumns) && visibleColumns.length > 0) {
    exportCols = columns.filter(col => {
      // Exclude pure UI action columns and checkbox select columns from spreadsheet export
      if (col.key === 'actions' || col.key === 'select') return false;
      return visibleColumns.includes(col.key);
    });
  } else if (columns.length > 0) {
    // Exclude action columns
    exportCols = columns.filter(col => col.key !== 'actions' && col.key !== 'select');
  }

  // 2. Format row data into clean objects with readable header labels
  const formattedRows = data.map((row, index) => {
    const rowObj = {};

    if (exportCols.length > 0) {
      exportCols.forEach(col => {
        const headerLabel = col.label || col.key;
        let value;

        if (col.key === 'index') {
          value = index + 1;
        } else if (typeof col.transform === 'function') {
          value = col.transform(row[col.key], row, index);
        } else {
          value = row[col.key];
        }

        // Clean up nested objects, nulls, undefined, and dates
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          } else {
            value = JSON.stringify(value);
          }
        }

        rowObj[headerLabel] = value;
      });
    } else {
      // Fallback: auto-export all keys of the row (excluding internal _id, __v)
      Object.keys(row).forEach(key => {
        if (key.startsWith('_') || key === 'id') return;
        rowObj[key] = row[key] !== null && row[key] !== undefined ? row[key] : '';
      });
    }

    return rowObj;
  });

  // 3. Create Worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // 4. Auto-calculate generous column widths based on content
  const columnWidths = [];
  if (formattedRows.length > 0) {
    const headerKeys = Object.keys(formattedRows[0]);
    headerKeys.forEach(header => {
      let maxLen = header.length;
      for (let i = 0; i < Math.min(formattedRows.length, 100); i++) {
        const cellValue = String(formattedRows[i][header] || '');
        if (cellValue.length > maxLen) {
          maxLen = cellValue.length;
        }
      }
      columnWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 45) });
    });
    worksheet['!cols'] = columnWidths;
  }

  // 5. Create Workbook and append sheet
  const workbook = XLSX.utils.book_new();
  const safeSheetName = (sheetName || 'Data').substring(0, 31).replace(/[:\\/?*[\]]/g, '');
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // 6. Generate filename with date stamp: e.g. Opportunities_2026-10-08.xlsx
  const dateStamp = new Date().toISOString().split('T')[0];
  const cleanFilename = `${filename.replace(/\.xlsx$/i, '')}_${dateStamp}.xlsx`;

  // 7. Write file to client browser trigger
  XLSX.writeFile(workbook, cleanFilename);

  return {
    success: true,
    count: data.length,
    filename: cleanFilename
  };
}
