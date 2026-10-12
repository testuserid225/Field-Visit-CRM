import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook to manage dynamic column visibility and save configuration in localStorage.
 * 
 * @param {string} storageKey - Unique localStorage key (e.g. 'crm_cols_opportunities')
 * @param {Array<{ key: string, label: string, defaultVisible?: boolean, locked?: boolean }>} columnDefinitions
 */
export function useColumnVisibility(storageKey, columnDefinitions = []) {
  // Compute initial default set of visible keys
  const defaultKeys = useMemo(() => {
    return columnDefinitions
      .filter(col => col.defaultVisible !== false)
      .map(col => col.key);
  }, [columnDefinitions]);

  // Load from localStorage or fallback to defaults
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Error reading stored columns for ${storageKey}:`, e);
    }
    return defaultKeys;
  });

  // Save to localStorage whenever visibleColumns changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (e) {
      console.warn(`Error persisting columns for ${storageKey}:`, e);
    }
  }, [storageKey, visibleColumns]);

  // Fast lookup helper
  const isColumnVisible = useCallback((key) => {
    return visibleColumns.includes(key);
  }, [visibleColumns]);

  // Toggle a single column - allows selecting and unselecting any column freely
  const toggleColumn = useCallback((key) => {
    setVisibleColumns(prev => {
      let next;
      if (prev.includes(key)) {
        // Prevent hiding every single column (keep at least 1 so table remains visible)
        if (prev.length <= 1) return prev;
        next = prev.filter(k => k !== key);
      } else {
        next = [...prev, key];
      }
      return next;
    });
  }, []);

  // Show all columns
  const showAllColumns = useCallback(() => {
    const allKeys = columnDefinitions.map(c => c.key);
    setVisibleColumns(allKeys);
  }, [columnDefinitions]);

  // Reset to default columns
  const resetToDefaults = useCallback(() => {
    setVisibleColumns(defaultKeys);
  }, [defaultKeys]);

  return {
    columns: columnDefinitions,
    visibleColumns,
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    resetToDefaults
  };
}

export default useColumnVisibility;
