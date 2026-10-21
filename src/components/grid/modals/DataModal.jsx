import React, { useState } from 'react';
import { Database, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, X, Plus, Trash2 } from 'lucide-react';

export default function DataModal({
  isOpen,
  onClose,
  columns = [],
  sortModel = [],
  onApplySort,
  onRefreshData,
  onResetDataState
}) {
  const [sortRules, setSortRules] = useState(() => {
    if (sortModel && sortModel.length > 0) {
      return sortModel.map(s => ({ ...s, id: Math.random().toString(36).substring(7) }));
    }
    const firstCol = columns[0]?.field || '';
    return [{ id: 'sort-1', colId: firstCol, sort: 'asc' }];
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const addSortRule = () => {
    const firstCol = columns[0]?.field || '';
    setSortRules(prev => [...prev, { id: Math.random().toString(36).substring(7), colId: firstCol, sort: 'asc' }]);
  };

  const removeSortRule = (id) => {
    setSortRules(prev => prev.filter(r => r.id !== id));
  };

  const updateSortRule = (id, key, val) => {
    setSortRules(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  };

  const handleApply = () => {
    const valid = sortRules.filter(r => Boolean(r.colId)).map(({ colId, sort }) => ({ colId, sort }));
    onApplySort(valid);
    onClose();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof onRefreshData === 'function') {
        await onRefreshData();
      }
    } finally {
      setIsRefreshing(false);
      onClose();
    }
  };

  const handleReset = () => {
    setSortRules([]);
    onResetDataState();
    onClose();
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <Database size={18} color="var(--primary-600)" />
            <span>Data Operations & Sorting</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid-modal-body">
          {/* Quick Data Refresh Action */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Live Data Synchronisation
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Fetch the latest updates directly from the server API & database.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
            </button>
          </div>

          {/* Multi-Column Sort Section */}
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
              Sort Hierarchy
            </span>
            <button
              type="button"
              onClick={addSortRule}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary-600)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>Add Sort Column</span>
            </button>
          </div>

          {sortRules.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No custom sorting applied. Records are in default order.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortRules.map((rule, idx) => (
                <div
                  key={rule.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.5fr 1fr auto',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    #{idx + 1}
                  </span>

                  {/* Column Select */}
                  <select
                    value={rule.colId}
                    onChange={e => updateSortRule(rule.id, 'colId', e.target.value)}
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

                  {/* Direction Select */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => updateSortRule(rule.id, 'sort', 'asc')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        border: rule.sort === 'asc' ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                        backgroundColor: rule.sort === 'asc' ? 'var(--primary-50)' : 'var(--bg-card)',
                        color: rule.sort === 'asc' ? 'var(--primary-700)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowUp size={13} />
                      <span>Asc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSortRule(rule.id, 'sort', 'desc')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        border: rule.sort === 'desc' ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                        backgroundColor: rule.sort === 'desc' ? 'var(--primary-50)' : 'var(--bg-card)',
                        color: rule.sort === 'desc' ? 'var(--primary-700)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowDown size={13} />
                      <span>Desc</span>
                    </button>
                  </div>

                  {/* Remove Rule */}
                  <button
                    type="button"
                    onClick={() => removeSortRule(rule.id)}
                    title="Remove sort"
                    style={{ padding: '6px', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>Reset Data State</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleApply}>
            Apply Sorting
          </button>
        </div>
      </div>
    </div>
  );
}
