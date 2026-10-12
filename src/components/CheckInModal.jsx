import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  Camera, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  UploadCloud
} from 'lucide-react';

export default function CheckInModal({ isOpen, onClose, visit, onConfirmCheckIn }) {
  const [notes, setNotes] = useState('');
  const [photoAdded, setPhotoAdded] = useState(false);
  const [visitOutcome, setVisitOutcome] = useState('Meeting in progress');
  const [isGPSVerifying, setIsGPSVerifying] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(true);

  if (!isOpen || !visit) return null;

  const handleSimulateGPS = () => {
    setIsGPSVerifying(true);
    setTimeout(() => {
      setIsGPSVerifying(false);
      setGpsVerified(true);
    }, 800);
  };

  const handleCompleteCheckIn = (actionType) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    onConfirmCheckIn({
      visitId: visit.id,
      action: actionType, // 'check-in' or 'complete'
      time: timeString,
      notes: notes || visit.notes,
      gpsVerified: true
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Navigation size={20} color="var(--primary-600)" />
            <span>Field GPS Check-In & Verification</span>
          </div>
          <button 
            id="checkin-modal-close"
            onClick={onClose} 
            style={{ color: 'var(--text-light)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Target Client Info */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              {visit.clientName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <MapPin size={14} color="var(--primary-600)" />
              <span>{visit.address}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>
              Contact: <strong>{visit.contactPerson}</strong> ({visit.phone})
            </div>
          </div>

          {/* GPS Geo-fencing & Coordinates */}
          <div style={{
            border: '1px dashed #3b82f6',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e40af' }}>
                  Geo-Fence Verification
                </span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#15803d',
                backgroundColor: '#dcfce7',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                Matched (Accuracy 4.2m)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: '#3b82f6' }}>
              <div>Latitude: <strong>12.9716° N</strong></div>
              <div>Longitude: <strong>77.5946° E</strong></div>
              <div>Distance from site: <strong>28 meters</strong></div>
              <div>Device Time: <strong>{new Date().toLocaleTimeString()}</strong></div>
            </div>
          </div>

          {/* Photo verification simulation */}
          <div className="form-group">
            <label className="form-label">Client Site Photo / Selfie Proof</label>
            <div 
              id="upload-site-photo"
              onClick={() => setPhotoAdded(!photoAdded)}
              style={{
                border: photoAdded ? '2px solid #10b981' : '1px dashed var(--border-subtle)',
                backgroundColor: photoAdded ? '#ecfdf5' : 'var(--bg-main)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {photoAdded ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669' }}>
                  <CheckCircle size={20} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Site photo verified & geotagged</span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  <Camera size={24} style={{ margin: '0 auto 6px', display: 'block', color: 'var(--text-light)' }} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Click to capture / attach premises photo</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Automatic GPS watermark applied</div>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Notes */}
          <div className="form-group">
            <label className="form-label">Live Visit Notes / Discussion Summary</label>
            <textarea
              id="checkin-notes-input"
              className="form-control"
              rows="3"
              placeholder="e.g. Met with procurement head. Discussed annual order pricing, product specifications, and next demo."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          
          {visit.status === 'In-Progress' ? (
            <button 
              id="confirm-checkout-btn"
              type="button" 
              className="btn btn-success"
              onClick={() => handleCompleteCheckIn('complete')}
            >
              <CheckCircle size={16} />
              <span>Complete & Check Out</span>
            </button>
          ) : (
            <button 
              id="confirm-checkin-btn"
              type="button" 
              className="btn btn-primary"
              onClick={() => handleCompleteCheckIn('check-in')}
            >
              <Navigation size={16} />
              <span>Verify & Check In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
