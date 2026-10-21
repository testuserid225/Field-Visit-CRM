import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, AreaChart as AreaIcon, X, Info } from 'lucide-react';

const PALETTE = [
  '#10b981', '#059669', '#3b82f6', '#8b5cf6',
  '#f59e0b', '#ec4899', '#06b6d4', '#6366f1',
  '#14b8a6', '#f97316'
];

export default function ChartModal({
  isOpen,
  onClose,
  data = [],
  columns = []
}) {
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'pie' | 'area'
  
  // Categorical columns suitable for X-axis
  const categoryCols = useMemo(() => {
    return columns.filter(c => !['index', 'actions', 'select', '_id'].includes(c.field || c.colId));
  }, [columns]);

  // Metric columns or 'count'
  const numericCols = useMemo(() => {
    return columns.filter(c => {
      const key = c.field || c.colId;
      if (['index', 'actions', 'select', '_id'].includes(key)) return false;
      // Check if sample values are numeric
      const sample = data.find(d => d[key] !== undefined && d[key] !== null)?.[key];
      return typeof sample === 'number' || (!isNaN(Number(sample)) && sample !== '');
    });
  }, [columns, data]);

  const [categoryKey, setCategoryKey] = useState(() => categoryCols[1]?.field || categoryCols[0]?.field || '');
  const [metricKey, setMetricKey] = useState(() => numericCols[0]?.field || 'count');
  const [aggregation, setAggregation] = useState('count'); // 'count' | 'sum' | 'avg'

  // Aggregated Chart Data
  const chartData = useMemo(() => {
    if (!data || data.length === 0 || !categoryKey) return [];

    const map = new Map();

    data.forEach(item => {
      let catVal = item[categoryKey];
      if (catVal === undefined || catVal === null || catVal === '') {
        catVal = '(Unassigned)';
      } else {
        catVal = String(catVal);
      }

      if (!map.has(catVal)) {
        map.set(catVal, { category: catVal, count: 0, sum: 0, values: [] });
      }

      const entry = map.get(catVal);
      entry.count += 1;

      if (metricKey !== 'count') {
        const rawVal = Number(item[metricKey]);
        if (!isNaN(rawVal)) {
          entry.sum += rawVal;
          entry.values.push(rawVal);
        }
      }
    });

    // Format for Recharts
    const result = Array.from(map.values()).map(entry => {
      let finalVal = 0;
      if (metricKey === 'count' || aggregation === 'count') {
        finalVal = entry.count;
      } else if (aggregation === 'sum') {
        finalVal = entry.sum;
      } else if (aggregation === 'avg') {
        finalVal = entry.values.length > 0 ? Number((entry.sum / entry.values.length).toFixed(2)) : 0;
      }

      return {
        name: entry.category.length > 18 ? entry.category.substring(0, 16) + '...' : entry.category,
        fullName: entry.category,
        value: finalVal,
        count: entry.count
      };
    });

    // Sort descending by value and take top 12
    return result.sort((a, b) => b.value - a.value).slice(0, 14);
  }, [data, categoryKey, metricKey, aggregation]);

  if (!isOpen) return null;

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <BarChart3 size={18} color="var(--primary-600)" />
            <span>Interactive Data Visualizer & Charts</span>
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
              <span style={{ fontWeight: 700 }}>Open Source Chart Engine: </span>
              <span>
                AG Grid native integrated charting requires an <strong>AG Grid Enterprise</strong> licence. This high-performance visualization suite is provided completely free via <strong>Recharts (MIT)</strong> without licence fees or watermarks.
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Chart Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Chart Type
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'bar', icon: BarChart3, label: 'Bar' },
                  { id: 'line', icon: LineIcon, label: 'Line' },
                  { id: 'area', icon: AreaIcon, label: 'Area' },
                  { id: 'pie', icon: PieIcon, label: 'Pie' }
                ].map(ct => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => setChartType(ct.id)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        border: chartType === ct.id ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                        backgroundColor: chartType === ct.id ? 'var(--primary-50)' : 'var(--bg-card)',
                        color: chartType === ct.id ? 'var(--primary-700)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={13} />
                      <span>{ct.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category / Dimension (X-Axis) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Category (X-Axis)
              </label>
              <select
                value={categoryKey}
                onChange={e => setCategoryKey(e.target.value)}
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
                {categoryCols.map(c => (
                  <option key={c.field || c.colId} value={c.field || c.colId}>
                    {c.headerName || c.field}
                  </option>
                ))}
              </select>
            </div>

            {/* Value / Metric Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                Metric (Y-Axis)
              </label>
              <select
                value={metricKey}
                onChange={e => setMetricKey(e.target.value)}
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
                {numericCols.map(c => (
                  <option key={c.field || c.colId} value={c.field || c.colId}>
                    {c.headerName || c.field}
                  </option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            {metricKey !== 'count' && (
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
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                </select>
              </div>
            )}
          </div>

          {/* Chart Display Area */}
          <div style={{
            height: '340px',
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 8px 8px 8px'
          }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No records available to chart with current selection.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name, item) => [val, `${item.payload.fullName} (${aggregation.toUpperCase()})`]}
                      contentStyle={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                    <Bar dataKey="value" name={metricKey === 'count' ? 'Count' : metricKey} fill="var(--primary-600)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name, item) => [val, item.payload.fullName]}
                      contentStyle={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                    <Line type="monotone" dataKey="value" name={metricKey === 'count' ? 'Count' : metricKey} stroke="var(--primary-600)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name, item) => [val, item.payload.fullName]}
                      contentStyle={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                    <Area type="monotone" dataKey="value" name={metricKey === 'count' ? 'Count' : metricKey} stroke="var(--primary-600)" fill="rgba(16, 185, 129, 0.25)" />
                  </AreaChart>
                ) : (
                  <PieChart>
                    <Tooltip
                      formatter={(val, name, item) => [val, item.payload.fullName]}
                      contentStyle={{ borderRadius: '8px', fontSize: '0.8125rem' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', maxHeight: '60px', overflowY: 'auto' }} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid-modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Visualizer
          </button>
        </div>
      </div>
    </div>
  );
}
