import React, { useState } from 'react';
import { Palette, Hash, DollarSign, Calendar, Percent, Check, X, RotateCcw } from 'lucide-react';

const CURRENCY_SYMBOLS = [
  { value: 'INR', label: '₹ Indian Rupee (INR)', symbol: '₹' },
  { value: 'USD', label: '$ US Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: '€ Euro (EUR)', symbol: '€' },
  { value: 'GBP', label: '£ British Pound (GBP)', symbol: '£' },
  { value: 'NONE', label: 'No Currency Symbol', symbol: '' }
];

const DATE_FORMATS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-10-21)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 21/10/2026)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 10/21/2026)' },
  { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (e.g. 21-Oct-2026)' }
];

const NUMBER_DECIMALS = [
  { value: 0, label: '0 Decimals (e.g. 1,500)' },
  { value: 2, label: '2 Decimals (e.g. 1,500.00)' },
  { value: 4, label: '4 Decimals (e.g. 1,500.0000)' }
];

export default function FormatModal({
  isOpen,
  onClose,
  formatConfig = {},
  onApplyFormat,
  onResetFormat
}) {
  const [currency, setCurrency] = useState(formatConfig.currency || 'INR');
  const [dateFormat, setDateFormat] = useState(formatConfig.dateFormat || 'YYYY-MM-DD');
  const [decimals, setDecimals] = useState(formatConfig.decimals ?? 2);
  const [useThousandsSeparator, setUseThousandsSeparator] = useState(formatConfig.useThousandsSeparator ?? true);
  const [enableStatusBadges, setEnableStatusBadges] = useState(formatConfig.enableStatusBadges ?? true);
  const [highlightHighValues, setHighlightHighValues] = useState(formatConfig.highlightHighValues ?? false);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFormat({
      currency,
      currencySymbol: CURRENCY_SYMBOLS.find(c => c.value === currency)?.symbol || '',
      dateFormat,
      decimals,
      useThousandsSeparator,
      enableStatusBadges,
      highlightHighValues
    });
    onClose();
  };

  const handleReset = () => {
    onResetFormat();
    onClose();
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <Palette size={18} color="var(--primary-600)" />
            <span>Display Formatting & Styles</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="grid-modal-body">
          <div className="grid-license-notice">
            <span style={{ fontWeight: 700 }}>Note:</span>
            <span>Formatting modifies only the visual grid cell representation and does not alter underlying database data.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Currency Format */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                <DollarSign size={15} color="var(--primary-600)" />
                <span>Currency Display</span>
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              >
                {CURRENCY_SYMBOLS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                <Calendar size={15} color="var(--primary-600)" />
                <span>Date Representation</span>
              </label>
              <select
                value={dateFormat}
                onChange={e => setDateFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              >
                {DATE_FORMATS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Number Precision */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  <Hash size={15} color="var(--primary-600)" />
                  <span>Decimal Places</span>
                </label>
                <select
                  value={decimals}
                  onChange={e => setDecimals(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.8125rem',
                    outline: 'none'
                  }}
                >
                  {NUMBER_DECIMALS.map(n => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Thousands Separator
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: 'var(--text-main)'
                }}>
                  <input
                    type="checkbox"
                    checked={useThousandsSeparator}
                    onChange={e => setUseThousandsSeparator(e.target.checked)}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>Commas (1,234.56)</span>
                </label>
              </div>
            </div>

            {/* Visual Highlights & Badges */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                Visual Enhancements & Row Highlighting
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableStatusBadges}
                    onChange={e => setEnableStatusBadges(e.target.checked)}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>Render Status columns with colored pills (Active, Inactive, Approved, Pending)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={highlightHighValues}
                    onChange={e => setHighlightHighValues(e.target.checked)}
                    style={{ accentColor: 'var(--primary-600)' }}
                  />
                  <span>Highlight premium / high financial amounts with subtle emerald glow</span>
                </label>
              </div>
            </div>
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
            <span>Reset Formatting</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleApply}>
            Apply Formatting
          </button>
        </div>
      </div>
    </div>
  );
}
