import React, { useState } from 'react';
import { Filter, Plus, Trash2, X, RotateCcw, Check } from 'lucide-react';

const OPERATORS = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'notEqual', label: 'does not equal' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'greaterThan', label: 'greater than (>)' },
  { value: 'lessThan', label: 'less than (<)' },
  { value: 'inList', label: 'in list (comma separated)' },
  { value: 'blank', label: 'is blank' },
  { value: 'notBlank', label: 'is not blank' }
];

export default function FilterModal({
  isOpen,
  onClose,
  columns = [],
  activeFilters = [],
  onApplyFilters,
  onClearAllFilters
}) {
  const [rules, setRules] = useState(() => {
    if (activeFilters && activeFilters.length > 0) {
      return activeFilters.map(f => ({ ...f, id: f.id || Math.random().toString(36).substring(7) }));
    }
    const firstCol = columns[0]?.field || '';
    return [{ id: 'rule-1', field: firstCol, operator: 'contains', value: '' }];
  });

  if (!isOpen) return null;

  const addRule = () => {
    const firstCol = columns[0]?.field || '';
    setRules(prev => [...prev, { id: Math.random().toString(36).substring(7), field: firstCol, operator: 'contains', value: '' }]);
  };

  const removeRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const updateRule = (id, key, val) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  };

  const handleApply = () => {
    // Keep only valid rules
    const valid = rules.filter(r => {
      if (['blank', 'notBlank'].includes(r.operator)) return Boolean(r.field);
      return Boolean(r.field && r.value !== undefined && String(r.value).trim() !== '');
    });
    onApplyFilters(valid);
    onClose();
  };

  const handleClearAll = () => {
    setRules([]);
    onClearAllFilters();
    onClose();
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <Filter size={18} color="var(--primary-600)" />
            <span>Filter Records</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid-modal-body">
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Define custom filter conditions to match specific records across columns.
          </p>

          {rules.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              No active filter rules. Click "+ Add Filter Condition" below to begin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1.5fr auto',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {/* Column Select */}
                  <select
                    value={rule.field}
                    onChange={e => updateRule(rule.id, 'field', e.target.value)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  >
                    {columns.map(c => (
                      <option key={c.field || c.colId} value={c.field || c.colId}>
                        {c.headerName || c.field}
                      </option>
                    ))}
                  </select>

                  {/* Operator Select */}
                  <select
                    value={rule.operator}
                    onChange={e => updateRule(rule.id, 'operator', e.target.value)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {!['blank', 'notBlank'].includes(rule.operator) ? (
                    <input
                      type="text"
                      placeholder="Enter filter value..."
                      value={rule.value || ''}
                      onChange={e => updateRule(rule.id, 'value', e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.8125rem',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '8px' }}>
                      (No value needed)
                    </span>
                  )}

                  {/* Delete Rule */}
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    title="Remove filter rule"
                    style={{
                      padding: '6px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={addRule}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--primary-600)',
                background: 'var(--primary-50)',
                border: '1px dashed var(--primary-300)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              <span>Add Filter Condition</span>
            </button>
          </div>
        </div>

        <div className="grid-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClearAll}
            style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>Clear All Filters</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
