import React, { useState, useEffect } from 'react';
import { FileText, Save, Bookmark, RotateCcw, Trash2, Check, X, User } from 'lucide-react';

export default function ReportModal({
  isOpen,
  onClose,
  gridId = 'grid',
  currentUser = null,
  currentGridState = {},
  onLoadReportState,
  onResetToDefault,
  showToast = null
}) {
  const [activeTab, setActiveTab] = useState('save'); // 'save' | 'load'
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [savedReports, setSavedReports] = useState([]);

  const storageKey = `crm_ag_reports_${currentUser?.id || currentUser?.email || 'global'}_${gridId}`;

  // Load saved reports from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setSavedReports(JSON.parse(raw));
      } else {
        setSavedReports([]);
      }
    } catch {
      setSavedReports([]);
    }
  }, [storageKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!reportName.trim()) {
      if (showToast) showToast('Please enter a name for this report.');
      return;
    }

    const newReport = {
      id: 'rep_' + Date.now(),
      name: reportName.trim(),
      description: reportDescription.trim(),
      createdAt: new Date().toISOString(),
      user: currentUser?.fullName || currentUser?.name || 'Local User',
      state: currentGridState
    };

    const updated = [newReport, ...savedReports.filter(r => r.name.toLowerCase() !== reportName.trim().toLowerCase())];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedReports(updated);
      setReportName('');
      setReportDescription('');
      if (showToast) showToast(`Report "${newReport.name}" saved successfully!`);
      setActiveTab('load');
    } catch (err) {
      if (showToast) showToast('Failed to save report: ' + err.message);
    }
  };

  const handleLoad = (report) => {
    if (!report || !report.state) return;
    onLoadReportState(report.state);
    if (showToast) showToast(`Loaded report "${report.name}" successfully!`);
    onClose();
  };

  const handleDelete = (id, name, e) => {
    e.stopPropagation();
    const updated = savedReports.filter(r => r.id !== id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSavedReports(updated);
      if (showToast) showToast(`Deleted report "${name}".`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    onResetToDefault();
    if (showToast) showToast('Grid configuration reset to factory default.');
    onClose();
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <FileText size={18} color="var(--primary-600)" />
            <span>Report Profiles & Saved Views</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('save')}
            style={{
              flex: 1,
              padding: '11px 16px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              borderBottom: activeTab === 'save' ? '2px solid var(--primary-600)' : 'none',
              color: activeTab === 'save' ? 'var(--primary-700)' : 'var(--text-muted)',
              background: activeTab === 'save' ? 'var(--bg-card)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} />
            <span>Save Current View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('load')}
            style={{
              flex: 1,
              padding: '11px 16px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              borderBottom: activeTab === 'load' ? '2px solid var(--primary-600)' : 'none',
              color: activeTab === 'load' ? 'var(--primary-700)' : 'var(--text-muted)',
              background: activeTab === 'load' ? 'var(--bg-card)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Bookmark size={14} />
            <span>Load Saved Report ({savedReports.length})</span>
          </button>
        </div>

        <div className="grid-modal-body">
          {activeTab === 'save' ? (
            <form onSubmit={handleSave}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Save your customized view — visible columns, filter criteria, sorting hierarchy, and formatting preferences — as a reusable report profile.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Report Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Active Enterprise Prospects, Mumbai Territory View"
                  value={reportName}
                  onChange={e => setReportName(e.target.value)}
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
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note about the purpose of this saved view..."
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '18px'
              }}>
                <span style={{ fontWeight: 700 }}>Profile Association: </span>
                <span>{currentUser ? `${currentUser.fullName || currentUser.name} (${currentUser.emailAddress || currentUser.email})` : 'Global Local Profile'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} />
                  <span>Save Report Profile</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              {savedReports.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  <Bookmark size={32} color="var(--border-strong)" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    No Saved Report Profiles Yet
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Click "Save Current View" to store your current grid filter and column layout.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {savedReports.map(rep => (
                    <div
                      key={rep.id}
                      onClick={() => handleLoad(rep)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-300)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                          {rep.name}
                        </div>
                        {rep.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {rep.description}
                          </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
                          Saved on {new Date(rep.createdAt).toLocaleDateString()} by {rep.user}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLoad(rep)}
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                        >
                          Apply View
                        </button>
                        <button
                          type="button"
                          onClick={e => handleDelete(rep.id, rep.name, e)}
                          title="Delete saved report"
                          style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <span>Reset Grid to Default</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
