import React, { useState, useMemo } from 'react';
import { Layers, FolderTree, ChevronRight, ChevronDown, Check, X, RotateCcw, Info, Hash } from 'lucide-react';

export default function GroupByModal({
  isOpen,
  onClose,
  data = [],
  columns = [],
  activeGroupByColumn = '',
  onApplyGroupBy,
  onClearGroupBy
}) {
  const [selectedCol, setSelectedCol] = useState(activeGroupByColumn || '');
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // Columns suitable for grouping (exclude IDs and actions)
  const groupableColumns = useMemo(() => {
    return columns.filter(c => !['index', 'actions', 'select', '_id'].includes(c.field || c.colId));
  }, [columns]);

  // Compute Grouped Records & Summaries
  const groupedData = useMemo(() => {
    if (!selectedCol || !data || data.length === 0) return null;

    const groups = new Map();

    data.forEach(item => {
      let keyVal = item[selectedCol];
      if (keyVal === undefined || keyVal === null || keyVal === '') {
        keyVal = '(Unassigned)';
      } else {
        keyVal = String(keyVal);
      }

      if (!groups.has(keyVal)) {
        groups.set(keyVal, { key: keyVal, count: 0, rows: [] });
      }

      const g = groups.get(keyVal);
      g.count += 1;
      g.rows.push(item);
    });

    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [selectedCol, data]);

  if (!isOpen) return null;

  const toggleGroupCollapse = (key) => {
    const next = new Set(collapsedGroups);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setCollapsedGroups(next);
  };

  const handleExpandAll = () => {
    setCollapsedGroups(new Set());
  };

  const handleCollapseAll = () => {
    if (groupedData) {
      setCollapsedGroups(new Set(groupedData.map(g => g.key)));
    }
  };

  const handleApply = () => {
    onApplyGroupBy(selectedCol);
    onClose();
  };

  const handleClear = () => {
    setSelectedCol('');
    onClearGroupBy();
    onClose();
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <FolderTree size={18} color="var(--primary-600)" />
            <span>Group Records by Column</span>
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
                AG Grid native tree row grouping (<code>rowGroup: true</code>) is restricted to <strong>AG Grid Enterprise</strong>. We have implemented an interactive hierarchical client-side grouping view that works seamlessly under the free Community tier.
              </span>
            </div>
          </div>

          {/* Group Column Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              Group Records By:
            </label>
            <select
              value={selectedCol}
              onChange={e => {
                setSelectedCol(e.target.value);
                setCollapsedGroups(new Set());
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            >
              <option value="">-- Select a Column to Group --</option>
              {groupableColumns.map(c => (
                <option key={c.field || c.colId} value={c.field || c.colId}>
                  {c.headerName || c.field}
                </option>
              ))}
            </select>
          </div>

          {/* Grouped View & Summaries */}
          {groupedData && groupedData.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {groupedData.length} Group Categories ({data.length} Total Records)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Expand All
                  </button>
                  <span style={{ color: 'var(--border-subtle)' }}>|</span>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div style={{
                maxHeight: '340px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)'
              }}>
                {groupedData.map(group => {
                  const isCollapsed = collapsedGroups.has(group.key);

                  return (
                    <div key={group.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {/* Group Header */}
                      <div
                        onClick={() => toggleGroupCollapse(group.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-main)',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isCollapsed ? <ChevronRight size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--primary-600)" />}
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                            {group.key}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--primary-50)',
                          color: 'var(--primary-700)'
                        }}>
                          {group.count} {group.count === 1 ? 'record' : 'records'}
                        </span>
                      </div>

                      {/* Group Rows Preview */}
                      {!isCollapsed && (
                        <div style={{ padding: '6px 14px 10px 36px', backgroundColor: 'var(--bg-card)' }}>
                          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <tbody>
                              {group.rows.slice(0, 5).map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: '1px dashed var(--border-subtle)' }}>
                                  <td style={{ padding: '5px 8px', color: 'var(--text-muted)', width: '30px' }}>
                                    {rIdx + 1}.
                                  </td>
                                  <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text-main)' }}>
                                    {row.organizationName || row.clientName || row.fullName || row.subject || row.title || row._id}
                                  </td>
                                  <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>
                                    {row.status || row.customerType || row.department || row.designation || ''}
                                  </td>
                                </tr>
                              ))}
                              {group.rows.length > 5 && (
                                <tr>
                                  <td colSpan={3} style={{ padding: '6px 8px', fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.7rem' }}>
                                    ...and {group.rows.length - 5} more records in this group
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid-modal-footer">
          {activeGroupByColumn && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClear}
              style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} />
              <span>Remove Grouping</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleApply}
            disabled={!selectedCol}
          >
            Apply Grouping
          </button>
        </div>
      </div>
    </div>
  );
}
