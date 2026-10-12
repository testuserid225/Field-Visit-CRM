import React, { useState, useRef, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  Check, 
  RotateCcw, 
  Search, 
  CheckSquare, 
  X
} from 'lucide-react';

export default function ColumnVisibilityDropdown({
  columns = [],
  visibleColumns = [],
  onToggle,
  onToggleColumn,
  onReset,
  onResetColumns,
  onShowAll,
  onShowAllColumns,
  buttonLabel = 'Columns',
  align = 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Normalize callbacks to accept either naming pattern
  const handleToggle = (key) => {
    if (typeof onToggle === 'function') {
      onToggle(key);
    } else if (typeof onToggleColumn === 'function') {
      onToggleColumn(key);
    }
  };

  const handleReset = () => {
    if (typeof onReset === 'function') {
      onReset();
    } else if (typeof onResetColumns === 'function') {
      onResetColumns();
    }
  };

  const handleShowAll = () => {
    if (typeof onShowAll === 'function') {
      onShowAll();
    } else if (typeof onShowAllColumns === 'function') {
      onShowAllColumns();
    }
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentVisible = Array.isArray(visibleColumns) ? visibleColumns : [];
  const visibleCount = currentVisible.length;
  const totalCount = columns.length;

  const filteredColumns = columns.filter(col => 
    (col.label || col.key || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        id="column-visibility-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 14px',
          borderRadius: '10px',
          backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
          color: isOpen ? 'var(--primary-400)' : 'var(--text-main)',
          border: isOpen ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: 'var(--shadow-sm)',
          userSelect: 'none'
        }}
        title="Customize and toggle columns in this table"
      >
        <SlidersHorizontal size={14} color={isOpen ? 'var(--primary-400)' : 'var(--text-muted)'} />
        <span>{buttonLabel}</span>
        <span style={{
          backgroundColor: isOpen ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.08)',
          color: isOpen ? '#000' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: 800,
          padding: '1px 6px',
          borderRadius: '8px',
          marginLeft: '2px'
        }}>
          {visibleCount}/{totalCount}
        </span>
        <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: align === 'right' ? 0 : 'auto',
          left: align === 'left' ? 0 : 'auto',
          zIndex: 1000,
          width: '290px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Select Columns
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Check to show, uncheck to hide
              </div>
            </div>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              Auto-saved
            </span>
          </div>

          {/* Quick Actions Bar */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <button
              type="button"
              id="show-all-columns-btn"
              onClick={handleShowAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--primary-400)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <CheckSquare size={13} />
              <span>Show All ({totalCount})</span>
            </button>

            <button
              type="button"
              id="reset-columns-btn"
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Filter input */}
          {columns.length > 5 && (
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}>
              <Search size={13} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search columns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem'
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Column Checkboxes List */}
          <div style={{
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '6px 8px'
          }}>
            {filteredColumns.map(col => {
              const isChecked = currentVisible.includes(col.key);

              return (
                <div
                  key={col.key}
                  id={`toggle-col-${col.key}`}
                  onClick={() => handleToggle(col.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                    marginBottom: '2px',
                    transition: 'all 0.12s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isChecked 
                      ? 'rgba(16, 185, 129, 0.14)' 
                      : 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isChecked 
                      ? 'rgba(16, 185, 129, 0.08)' 
                      : 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Checkbox Icon */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      border: isChecked 
                        ? '1.5px solid var(--primary-500)' 
                        : '1.5px solid var(--border-strong, #64748b)',
                      backgroundColor: isChecked ? 'var(--primary-500)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease',
                      flexShrink: 0
                    }}>
                      {isChecked && <Check size={12} color="#000" strokeWidth={3.5} />}
                    </div>

                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isChecked ? 600 : 400,
                      color: isChecked ? 'var(--text-main)' : 'var(--text-muted)'
                    }}>
                      {col.label}
                    </span>
                  </div>

                  {/* Status Indicator Badge */}
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: isChecked ? '#10b981' : 'var(--text-muted)'
                  }}>
                    {isChecked ? 'Shown' : 'Hidden'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span>Click any column to show or hide</span>
          </div>
        </div>
      )}
    </div>
  );
}
