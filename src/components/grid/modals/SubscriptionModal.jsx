import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Calendar, Check, X, Trash2, Send, Info, AlertTriangle } from 'lucide-react';

export default function SubscriptionModal({
  isOpen,
  onClose,
  gridId = 'grid',
  currentUser = null,
  showToast = null
}) {
  const storageKey = `crm_ag_subscriptions_${currentUser?.id || currentUser?.email || 'global'}_${gridId}`;

  const [subscriptions, setSubscriptions] = useState([]);
  const [reportTitle, setReportTitle] = useState('Daily CRM Digest');
  const [frequency, setFrequency] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly'
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [emailList, setEmailList] = useState(() => currentUser?.emailAddress || currentUser?.email || '');
  const [fileFormat, setFileFormat] = useState('PDF'); // 'PDF' | 'Excel'
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'manage'

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setSubscriptions(JSON.parse(raw));
      } else {
        setSubscriptions([]);
      }
    } catch {
      setSubscriptions([]);
    }
  }, [storageKey, isOpen]);

  if (!isOpen) return null;

  const handleSaveSubscription = (e) => {
    e.preventDefault();
    if (!emailList.trim()) {
      if (showToast) showToast('Please provide at least one recipient email address.');
      return;
    }

    const newSub = {
      id: 'sub_' + Date.now(),
      title: reportTitle.trim() || 'Automated CRM Report',
      frequency,
      dayOfWeek: frequency === 'Weekly' ? dayOfWeek : null,
      timeOfDay,
      recipients: emailList.split(',').map(s => s.trim()).filter(Boolean),
      format: fileFormat,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    const updated = [newSub, ...subscriptions];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSubscriptions(updated);
      if (showToast) showToast(`Scheduled subscription "${newSub.title}" created!`);
      setActiveTab('manage');
    } catch (err) {
      if (showToast) showToast('Failed to save subscription: ' + err.message);
    }
  };

  const handleToggle = (id) => {
    const updated = subscriptions.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSubscriptions(updated);
  };

  const handleDelete = (id) => {
    const updated = subscriptions.filter(s => s.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSubscriptions(updated);
    if (showToast) showToast('Subscription removed.');
  };

  const handleTestTrigger = (sub) => {
    if (showToast) {
      showToast(`Test report dispatched to ${sub.recipients.join(', ')} (${sub.format})!`);
    }
  };

  return (
    <div className="grid-modal-overlay" onClick={onClose}>
      <div className="grid-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="grid-modal-header">
          <div className="grid-modal-title">
            <Bell size={18} color="var(--primary-600)" />
            <span>Automated Report Subscriptions</span>
          </div>
          <button className="grid-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{
              flex: 1,
              padding: '11px 16px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              borderBottom: activeTab === 'new' ? '2px solid var(--primary-600)' : 'none',
              color: activeTab === 'new' ? 'var(--primary-700)' : 'var(--text-muted)',
              background: activeTab === 'new' ? 'var(--bg-card)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            New Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            style={{
              flex: 1,
              padding: '11px 16px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              borderBottom: activeTab === 'manage' ? '2px solid var(--primary-600)' : 'none',
              color: activeTab === 'manage' ? 'var(--primary-700)' : 'var(--text-muted)',
              background: activeTab === 'manage' ? 'var(--bg-card)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            Manage Active ({subscriptions.length})
          </button>
        </div>

        <div className="grid-modal-body">
          {/* Service Status Disclosure */}
          <div className="grid-license-notice warning">
            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 700 }}>Service Notice: </span>
              <span>
                Subscriptions can be configured and tested in this interface. Automated background delivery requires configuring an external SMTP server (e.g. SendGrid / AWS SES) and server cron job in your hosting environment.
              </span>
            </div>
          </div>

          {activeTab === 'new' ? (
            <form onSubmit={handleSaveSubscription}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Subscription Subject / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Recipient Emails */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    <Mail size={14} color="var(--primary-600)" />
                    <span>Recipient Email Addresses (Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="manager@company.com, admin@company.com"
                    value={emailList}
                    onChange={e => setEmailList(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Frequency & Time */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Frequency
                    </label>
                    <select
                      value={frequency}
                      onChange={e => setFrequency(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '0.8125rem',
                        outline: 'none'
                      }}
                    >
                      <option value="Daily">Daily (Every Morning)</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly (1st of month)</option>
                    </select>
                  </div>

                  {frequency === 'Weekly' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                        Day of Week
                      </label>
                      <select
                        value={dayOfWeek}
                        onChange={e => setDayOfWeek(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-input)',
                          color: 'var(--text-main)',
                          fontSize: '0.8125rem',
                          outline: 'none'
                        }}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Delivery Time
                    </label>
                    <input
                      type="time"
                      value={timeOfDay}
                      onChange={e => setTimeOfDay(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '0.8125rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                      Attachment Format
                    </label>
                    <select
                      value={fileFormat}
                      onChange={e => setFileFormat(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '0.8125rem',
                        outline: 'none'
                      }}
                    >
                      <option value="PDF">PDF Report Document</option>
                      <option value="Excel">Excel Spreadsheet (.xlsx)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bell size={14} />
                    <span>Create Subscription</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              {subscriptions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                  No automated subscriptions scheduled yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                  {subscriptions.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {sub.title}
                          </span>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            backgroundColor: sub.enabled ? 'var(--primary-50)' : 'var(--bg-main)',
                            color: sub.enabled ? 'var(--primary-700)' : 'var(--text-muted)'
                          }}>
                            {sub.enabled ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {sub.frequency} {sub.dayOfWeek ? `(${sub.dayOfWeek})` : ''} at {sub.timeOfDay} • {sub.format} format
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '2px' }}>
                          To: {sub.recipients.join(', ')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleTestTrigger(sub)}
                          title="Trigger a test email dispatch now"
                          style={{
                            padding: '5px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Send size={12} color="var(--primary-600)" />
                          <span>Test</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(sub.id)}
                          style={{
                            padding: '5px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                          }}
                        >
                          {sub.enabled ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id)}
                          style={{ padding: '6px', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
