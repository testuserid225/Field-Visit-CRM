import React, { useState } from 'react';
import { SlidersHorizontal, Check, X, Search, RotateCcw, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

export default function ColumnsModal({
  isOpen,
  onClose,
  columns = [],
  visibleColumnKeys = [],
  onApplyColumns,
  onResetColumns
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState(() => columns.map(c => c.field || c.colId));
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(visibleColumnKeys));

  if (!isOpen) return null;

  // Toggle selection
  const handleToggle = (key) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      if (next.size > 1) { // Prevent hiding all columns
        next.delete(key);
      }
    } else {
      next.add(key);
    }
    setSelectedKeys(next);
  };

  const handleSelectAll = () => {
    setSelectedKeys(new Set(columns.map(c => c.field || c.colId)));
  };

  const handleDeselectAll = () => {
    // Keep at least the first column
    const first = columns[0]?.field || columns[0]?.colId;
    setSelectedKeys(new Set(first ? [first] : []));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setCurrentOrder(newOrder);
  };

  const moveDown = (index) => {
    if (index === currentOrder.length - 1) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setCurrentOrder(newOrder);
  };

  const handleApply = () => {
    onApplyColumns(Array.from(selectedKeys), currentOrder);
    onClose();
  };

  const handleReset = () => {
    onResetColumns();
    onClose();
  };

  const filteredColumns = currentOrder
    .map(key => columns.find(c => (c.field || c.colId) === key))
    .filter(Boolean)
    .filter(col => {
      const label = col.headerName || col.field || '';
      return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <SlidersHorizontal size={18} color="var(--primary-600)" />
            <span>Configure Columns & Ordering</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid-modal-body">
          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search column names..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Quick Select Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ color: 'var(--primary-600)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Show All
              </button>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{ color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Hide All
              </button>
            </div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {selectedKeys.size} of {columns.length} visible
            </span>
          </div>

          {/* Column List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            {filteredColumns.map((col, idx) => {
              const key = col.field || col.colId;
              const isChecked = selectedKeys.has(key);
              const isLocked = col.pinned || col.lockVisible;

              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isChecked ? 'transparent' : 'var(--bg-main)',
                    opacity: isChecked ? 1 : 0.65,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isLocked ? 'not-allowed' : 'pointer', flex: 1, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLocked}
                      onChange={() => handleToggle(key)}
                      style={{ accentColor: 'var(--primary-600)', width: '15px', height: '15px' }}
                    />
                    <span>{col.headerName || col.field}</span>
                    {col.pinned && (
                      <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 700 }}>
                        Pinned {col.pinned}
                      </span>
                    )}
                  </label>

                  {/* Ordering Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <button
                      type="button"
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      title="Move Column Up / Left"
                      style={{ padding: '3px 6px', borderRadius: '4px', border: 'none', background: 'none', color: idx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer' }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(idx)}
                      disabled={idx === currentOrder.length - 1}
                      title="Move Column Down / Right"
                      style={{ padding: '3px 6px', borderRadius: '4px', border: 'none', background: 'none', color: idx === currentOrder.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: idx === currentOrder.length - 1 ? 'default' : 'pointer' }}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid-modal-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleApply}>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
