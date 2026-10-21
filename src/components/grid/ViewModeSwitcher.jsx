import React from 'react';
import { LayoutGrid, Table, Sparkles } from 'lucide-react';

/**
 * Premium Apple/Linear-style Segmented View Mode Switcher
 * Used across all CRM list pages for switching between AG Grid Pro and Standard Views.
 */
export default function ViewModeSwitcher({
  viewMode = 'aggrid',
  onChange,
  options = [
    { id: 'aggrid', label: 'AG Grid', icon: LayoutGrid, badge: 'PRO' },
    { id: 'standard', label: 'Standard Table', icon: Table }
  ]
}) {
  return (
    <div className="crm-view-mode-pill-group" role="tablist" aria-label="View Mode Switcher">
      {options.map((opt) => {
        const isActive = viewMode === opt.id;
        const IconComponent = opt.icon;

        return (
          <button
            key={opt.id}
            id={`view-toggle-${opt.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`crm-view-mode-pill ${isActive ? 'active' : ''} ${opt.id === 'aggrid' ? 'is-aggrid' : ''}`}
            onClick={() => onChange(opt.id)}
            title={opt.title || `Switch to ${opt.label} View`}
          >
            {IconComponent && (
              <IconComponent
                size={14}
                className={`crm-view-pill-icon ${isActive ? 'active-icon' : ''}`}
              />
            )}
            <span className="crm-view-pill-label">{opt.label}</span>

            {opt.badge && (
              <span className={`crm-view-pill-badge ${isActive ? 'active-badge' : ''}`}>
                {opt.badge === 'PRO' && <Sparkles size={10} className="crm-badge-sparkle" />}
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
