import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  User, 
  ShieldCheck, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function VisitDetailsModal({ isOpen, onClose, visit, onOpenCheckIn }) {
  if (!isOpen || !visit) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="badge badge-completed"><CheckCircle size={12} /> Completed</span>;
      case 'In-Progress':
        return <span className="badge badge-inprogress"><Clock size={12} /> In Progress</span>;
      default:
        return <span className="badge badge-pending"><Calendar size={12} /> Scheduled</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>Visit Dossier: {visit.id}</span>
          </div>
          <button 
            id="details-modal-close"
            onClick={onClose} 
            style={{ color: 'var(--text-light)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {visit.clientName}
            </h2>
            {getStatusBadge(visit.status)}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--bg-main)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.85rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>CONTACT PERSON</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{visit.contactPerson}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>PHONE</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{visit.phone}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>SCHEDULED DATE & TIME</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {visit.scheduledDate} at {visit.scheduledTime}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>PRIORITY & DISTANCE</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {visit.priority} Priority ({visit.distanceKm})
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
              VISIT LOCATION / ADDRESS
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <MapPin size={16} color="var(--primary-600)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{visit.address}</span>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
              PURPOSE & OBJECTIVES
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-main)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
              {visit.purpose}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
              FIELD OFFICER NOTES & OUTCOME
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', backgroundColor: '#fff', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
              {visit.notes || 'No remarks recorded yet.'}
            </div>
          </div>

          {/* Check-in timestamp info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: visit.verifiedGps ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${visit.verifiedGps ? '#a7f3d0' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color={visit.verifiedGps ? '#059669' : '#94a3b8'} />
              <span style={{ color: visit.verifiedGps ? '#065f46' : 'var(--text-muted)', fontWeight: 600 }}>
                {visit.verifiedGps ? 'Geo-Tagged Visit Confirmed' : 'Awaiting Field Check-in'}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              {visit.checkInTime ? `Checked in: ${visit.checkInTime}` : 'Not checked in'}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {visit.status !== 'Completed' && (
            <button
              id="details-action-checkin-btn"
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onOpenCheckIn(visit);
              }}
            >
              {visit.status === 'In-Progress' ? 'Check Out / Complete' : 'Check In to Site'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
