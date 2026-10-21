import React, { useState, useMemo } from 'react';
import { TableProperties, Calculator, Info, X, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PivotModal({
  isOpen,
  onClose,
  data = [],
  columns = []
}) {
  const eligibleColumns = useMemo(() => {
    return columns.filter(c => !['index', 'actions', 'select', '_id'].includes(c.field || c.colId));
  }, [columns]);

  const numericColumns = useMemo(() => {
    return eligibleColumns.filter(c => {
      const key = c.field || c.colId;
      const sample = data.find(d => d[key] !== undefined && d[key] !== null)?.[key];
      return typeof sample === 'number' || (!isNaN(Number(sample)) && sample !== '');
    });
  }, [eligibleColumns, data]);

  const [rowField, setRowField] = useState(() => eligibleColumns[0]?.field || '');
  const [colField, setColField] = useState(() => eligibleColumns[1]?.field || eligibleColumns[0]?.field || '');
  const [valField, setValField] = useState(() => numericColumns[0]?.field || 'count');
  const [aggregation, setAggregation] = useState('count'); // 'count' | 'sum' | 'avg' | 'min' | 'max'

  // Calculate 2D Pivot Matrix
  const pivotMatrix = useMemo(() => {
    if (!data || data.length === 0 || !rowField || !colField) {
      return null;
    }

    const rowKeysSet = new Set();
    const colKeysSet = new Set();
    const cellMap = new Map(); // key: `${rVal}:::${cVal}` => array of numbers or counts

    data.forEach(item => {
      let r = item[rowField];
      let c = item[colField];
      r = (r === undefined || r === null || r === '') ? '(Blank)' : String(r);
      c = (c === undefined || c === null || c === '') ? '(Blank)' : String(c);

      rowKeysSet.add(r);
      colKeysSet.add(c);

      const cellKey = `${r}:::${c}`;
      if (!cellMap.has(cellKey)) {
        cellMap.set(cellKey, []);
      }

      if (valField === 'count') {
        cellMap.get(cellKey).push(1);
      } else {
        const num = Number(item[valField]);
        cellMap.get(cellKey).push(isNaN(num) ? 0 : num);
      }
    });

    const rowKeys = Array.from(rowKeysSet).sort();
    const colKeys = Array.from(colKeysSet).sort();

    // Aggregator helper
    const calcAgg = (arr) => {
      if (!arr || arr.length === 0) return 0;
      if (aggregation === 'count') return arr.length;
      if (aggregation === 'sum') return arr.reduce((a, b) => a + b, 0);
      if (aggregation === 'avg') return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
      if (aggregation === 'min') return Math.min(...arr);
      if (aggregation === 'max') return Math.max(...arr);
      return arr.length;
    };

    // Calculate cell values
    const matrix = rowKeys.map(r => {
      const rowObj = { _row: r, _rowTotal: 0 };
      const allRowVals = [];

      colKeys.forEach(c => {
        const vals = cellMap.get(`${r}:::${c}`) || [];
        allRowVals.push(...vals);
        rowObj[c] = calcAgg(vals);
      });

      rowObj._rowTotal = calcAgg(allRowVals);
      return rowObj;
    });

    // Column Totals
    const colTotals = { _row: 'Grand Total' };
    const allGrandVals = [];
    colKeys.forEach(c => {
      const allColVals = [];
      rowKeys.forEach(r => {
        const vals = cellMap.get(`${r}:::${c}`) || [];
        allColVals.push(...vals);
      });
      allGrandVals.push(...allColVals);
      colTotals[c] = calcAgg(allColVals);
    });
    colTotals._rowTotal = calcAgg(allGrandVals);

    return { rowKeys, colKeys, matrix, colTotals };
  }, [data, rowField, colField, valField, aggregation]);

  if (!isOpen) return null;

  const handleExportPivotExcel = () => {
    if (!pivotMatrix) return;
    try {
      const exportRows = pivotMatrix.matrix.map(r => {
        const row = { [rowField]: r._row };
        pivotMatrix.colKeys.forEach(c => {
          row[c] = r[c];
        });
        row['Total'] = r._rowTotal;
        return row;
      });

      // Add Grand total
      const totalRow = { [rowField]: pivotMatrix.colTotals._row };
      pivotMatrix.colKeys.forEach(c => {
        totalRow[c] = pivotMatrix.colTotals[c];
      });
      totalRow['Total'] = pivotMatrix.colTotals._rowTotal;
      exportRows.push(totalRow);

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pivot_Summary');
      XLSX.writeFile(wb, `Pivot_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Pivot Export error:', err);
    }
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '880px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <TableProperties size={18} color="var(--primary-600)" />
            <span>Interactive Pivot Table & Cross-Tab Matrix</span>
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
              <span style={{ fontWeight: 700 }}>Licence Transparency: </span>
              <span>
                AG Grid native pivot mode (<code>pivot: true</code>) requires an <strong>AG Grid Enterprise</strong> licence. Our custom multi-dimensional Pivot engine calculates real-time 2D cross-tab matrix aggregations free without enterprise requirements.
              </span>
            </div>
          </div>

          {/* Pivot Configuration Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Rows */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Row Field
              </label>
              <select
                value={rowField}
                onChange={e => setRowField(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              >
                {eligibleColumns.map(c => (
                  <option key={c.field || c.colId} value={c.field || c.colId}>
                    {c.headerName || c.field}
                  </option>
                ))}
              </select>
            </div>

            {/* Columns */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Column Field
              </label>
              <select
                value={colField}
                onChange={e => setColField(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              >
                {eligibleColumns.map(c => (
                  <option key={c.field || c.colId} value={c.field || c.colId}>
                    {c.headerName || c.field}
                  </option>
                ))}
              </select>
            </div>

            {/* Value Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Value Field
              </label>
              <select
                value={valField}
                onChange={e => setValField(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              >
                <option value="count">Record Count (#)</option>
                {numericColumns.map(c => (
                  <option key={c.field || c.colId} value={c.field || c.colId}>
                    {c.headerName || c.field}
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Aggregation
              </label>
              <select
                value={aggregation}
                onChange={e => setAggregation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              >
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>
          </div>

          {/* Pivot Table Matrix View */}
          {pivotMatrix ? (
            <div className="pivot-table-container">
              <table className="pivot-table">
                <thead>
                  <tr>
                    <th style={{ backgroundColor: 'var(--bg-main)' }}>
                      {rowField} \ {colField}
                    </th>
                    {pivotMatrix.colKeys.map(cKey => (
                      <th key={cKey} style={{ textAlign: 'right' }}>
                        {cKey}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pivotMatrix.matrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', backgroundColor: 'var(--bg-main)' }}>
                        {row._row}
                      </td>
                      {pivotMatrix.colKeys.map(cKey => (
                        <td key={cKey} style={{ textAlign: 'right' }}>
                          {row[cKey] || 0}
                        </td>
                      ))}
                      <td className="total-cell" style={{ textAlign: 'right' }}>
                        {row._rowTotal}
                      </td>
                    </tr>
                  ))}
                  {/* Grand Totals */}
                  <tr>
                    <td className="total-cell" style={{ fontWeight: 800 }}>
                      {pivotMatrix.colTotals._row}
                    </td>
                    {pivotMatrix.colKeys.map(cKey => (
                      <td key={cKey} className="total-cell" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {pivotMatrix.colTotals[cKey]}
                      </td>
                    ))}
                    <td className="total-cell" style={{ textAlign: 'right', fontWeight: 800 }}>
                      {pivotMatrix.colTotals._rowTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No pivot records available with current field selections.
            </div>
          )}
        </div>

        <div className="grid-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportPivotExcel}
            style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={14} color="#059669" />
            <span>Export Pivot to Excel</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
