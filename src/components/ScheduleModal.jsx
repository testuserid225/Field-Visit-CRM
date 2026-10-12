import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Building, AlertCircle, User, Briefcase, Sparkles, PhoneCall } from 'lucide-react';
import { api } from '../services/api';

const FALLBACK_ACTIVITIES = [
  'Product Demonstration & AMC Pitch',
  'Breakdown & Preventative Maintenance Visit',
  'Payment & Invoice Follow-Up',
  'Initial Requirement Gathering & Site Audit',
  'Quarterly Relationship Review',
  'Contract Renewal Negotiation'
];

const FALLBACK_EMPLOYEES = [
  'Rahul S. Sharma (Sales Executive)',
  'Anjali Verma (Service Engineer)',
  'Imran Khan (Senior Manager)',
  'Sneha Kulkarni (Operations Lead)'
];

export default function ScheduleModal({ isOpen, onClose, onSchedule, clients = [] }) {
  const [customerList, setCustomerList] = useState([]);
  const [contactPersonList, setContactPersonList] = useState([]);
  const [activityTypes, setActivityTypes] = useState(FALLBACK_ACTIVITIES);
  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);

  const [formData, setFormData] = useState({
    clientName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00 AM',
    purpose: FALLBACK_ACTIVITIES[0],
    priority: 'Medium',
    assignedTo: FALLBACK_EMPLOYEES[0],
    notes: ''
  });

  const [error, setError] = useState('');

  // Fetch live masters for dynamic dropdowns
  useEffect(() => {
    if (!isOpen) return;

    const fetchMasters = async () => {
      try {
        // 1. Fetch Customers from Customer Master
        const custs = await api.getCustomers();
        if (Array.isArray(custs) && custs.length > 0) {
          setCustomerList(custs);
        }

        // 2. Fetch Contact Persons from Contact Person Master
        const contacts = await api.getContactPersons();
        if (Array.isArray(contacts) && contacts.length > 0) {
          setContactPersonList(contacts);
        }

        // 3. Fetch Activity Types from Master
        const activities = await api.getMasterItems('activity-types');
        if (Array.isArray(activities) && activities.length > 0) {
          const actNames = activities.map(a => a.activityName).filter(Boolean);
          if (actNames.length > 0) {
            setActivityTypes(actNames);
            setFormData(prev => ({ ...prev, purpose: prev.purpose || actNames[0] }));
          }
        }

        // 4. Fetch Employees from Employee Master
        const emps = await api.getEmployees();
        if (Array.isArray(emps) && emps.length > 0) {
          const empNames = emps.map(e => `${e.fullName} (${e.designation || 'Staff'})`);
          if (empNames.length > 0) {
            setEmployees(empNames);
            setFormData(prev => ({ ...prev, assignedTo: prev.assignedTo || empNames[0] }));
          }
        }
      } catch (err) {
        console.warn('Error fetching master dropdowns for schedule modal:', err.message);
      }
    };

    fetchMasters();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle selecting a Customer Organization from Customer Master
  const handleCustomerSelect = (orgName) => {
    if (!orgName) {
      setFormData(prev => ({ ...prev, clientName: '' }));
      return;
    }

    const selectedCust = customerList.find(c => c.organizationName === orgName);
    const selectedClientProp = clients.find(c => c.name === orgName);

    if (selectedCust) {
      const fullAddr = selectedCust.fullAddress 
        ? `${selectedCust.fullAddress}, ${selectedCust.city || ''}, ${selectedCust.state || ''}`.replace(/,\s*,/g, ',').trim()
        : `${selectedCust.city || ''} ${selectedCust.state || ''}`.trim();

      // Find matching contact person if available
      const matchingContact = contactPersonList.find(cp => cp.name === selectedCust.primaryContactPerson);

      setFormData(prev => ({
        ...prev,
        clientName: selectedCust.organizationName,
        contactPerson: selectedCust.primaryContactPerson || prev.contactPerson,
        phone: matchingContact?.mobileNumber || prev.phone,
        email: matchingContact?.email || prev.email,
        address: fullAddr || prev.address
      }));
    } else if (selectedClientProp) {
      setFormData(prev => ({
        ...prev,
        clientName: selectedClientProp.name,
        contactPerson: selectedClientProp.contactPerson || prev.contactPerson,
        phone: selectedClientProp.phone || prev.phone,
        email: selectedClientProp.email || prev.email,
        address: selectedClientProp.address || prev.address
      }));
    } else {
      setFormData(prev => ({ ...prev, clientName: orgName }));
    }
  };

  // Handle selecting a Contact Person from Contact Person Master
  const handleContactPersonSelect = (personName) => {
    if (!personName) {
      setFormData(prev => ({ ...prev, contactPerson: '' }));
      return;
    }

    const selectedCp = contactPersonList.find(cp => cp.name === personName);
    if (selectedCp) {
      setFormData(prev => ({
        ...prev,
        contactPerson: selectedCp.name,
        phone: selectedCp.mobileNumber || prev.phone,
        email: selectedCp.email || prev.email,
        clientName: prev.clientName || selectedCp.customerOrganizationName || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, contactPerson: personName }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.address.trim() || !formData.purpose.trim()) {
      setError('Please fill in Client Name, Address, and Purpose of visit.');
      return;
    }

    const newVisit = {
      id: `VST-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: formData.clientName,
      contactPerson: formData.contactPerson || 'Store / Site Manager',
      phone: formData.phone || '+91 98000 00000',
      email: formData.email || 'client@example.com',
      address: formData.address,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      purpose: formData.purpose,
      priority: formData.priority,
      status: 'Scheduled',
      checkInTime: null,
      checkOutTime: null,
      assignedTo: formData.assignedTo || 'Imran Khan (Senior Manager)',
      notes: formData.notes,
      distanceKm: `${(Math.random() * 15 + 2).toFixed(1)} km`,
      latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
      longitude: 77.5946 + (Math.random() - 0.5) * 0.1,
      verifiedGps: false
    };

    onSchedule(newVisit);
    onClose();
  };

  // Available options
  const displayCustomers = customerList.length > 0 
    ? customerList.map(c => ({ name: c.organizationName, sub: c.industrySegment || c.city }))
    : clients.map(c => ({ name: c.name, sub: c.category || c.city }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Calendar size={20} color="var(--primary-600)" />
            <span>Schedule New Field Visit</span>
          </div>
          <button 
            id="modal-close-btn"
            onClick={onClose} 
            style={{ color: 'var(--text-light)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'var(--status-cancelled-bg)',
                color: 'var(--status-cancelled)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Organization (from Customer Master) */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                Customer Organization (from Customer Master) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="schedule-client-select"
                className="form-control"
                value={formData.clientName}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                required
              >
                <option value="">-- Select Customer from Master --</option>
                {displayCustomers.map((c, idx) => (
                  <option key={idx} value={c.name}>
                    {c.name} {c.sub ? `(${c.sub})` : ''}
                  </option>
                ))}
                {formData.clientName && !displayCustomers.some(c => c.name === formData.clientName) && (
                  <option value={formData.clientName}>{formData.clientName}</option>
                )}
              </select>
            </div>

            {/* Contact Person (from Contact Person Master) & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Contact Person (from Contact Person Master)
                </label>
                <select
                  id="schedule-contact-person-select"
                  className="form-control"
                  value={formData.contactPerson}
                  onChange={(e) => handleContactPersonSelect(e.target.value)}
                >
                  <option value="">-- Select Contact Person --</option>
                  {contactPersonList.map((cp, idx) => (
                    <option key={idx} value={cp.name}>
                      {cp.name} {cp.designation ? `(${cp.designation})` : ''}
                    </option>
                  ))}
                  {formData.contactPerson && !contactPersonList.some(cp => cp.name === formData.contactPerson) && (
                    <option value={formData.contactPerson}>{formData.contactPerson}</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Phone Number
                </label>
                <input
                  id="schedule-phone"
                  type="text"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Site / Visit Address */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                Site / Visit Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="schedule-address"
                type="text"
                className="form-control"
                placeholder="Full address, landmarks, area"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            {/* Date, Time & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  className="form-control"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Time
                </label>
                <input
                  id="schedule-time"
                  type="text"
                  className="form-control"
                  placeholder="10:30 AM"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Priority
                </label>
                <select
                  id="schedule-priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Purpose of Visit (from Activity-Types Master) & Assigned Field Officer (from Employee Master) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Purpose of Visit (from Activity-Types Master) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="schedule-purpose-select"
                  className="form-control"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                >
                  {activityTypes.map((act, idx) => (
                    <option key={idx} value={act}>{act}</option>
                  ))}
                  {formData.purpose && !activityTypes.includes(formData.purpose) && (
                    <option value={formData.purpose}>{formData.purpose}</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                  Assigned Field Officer (from Employee Master) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  id="schedule-assigned-select"
                  className="form-control"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                >
                  {employees.map((emp, idx) => (
                    <option key={idx} value={emp}>{emp}</option>
                  ))}
                  {formData.assignedTo && !employees.includes(formData.assignedTo) && (
                    <option value={formData.assignedTo}>{formData.assignedTo}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Visit Notes / Objective */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                Visit Notes / Objective
              </label>
              <textarea
                id="schedule-notes"
                className="form-control"
                rows="2"
                placeholder="Any special instructions or documents to carry..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <button 
              id="confirm-schedule-btn"
              type="submit" 
              className="btn btn-primary"
            >
              Confirm & Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
