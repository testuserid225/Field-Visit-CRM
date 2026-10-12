import Visit from '../models/Visit.js';
import Client from '../models/Client.js';

// Get all visits with optional query filters
export const getVisits = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }

    const visits = await Visit.find(query).sort({ scheduledDate: -1, scheduledTime: 1 });
    res.json({ success: true, count: visits.length, visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single visit by ID or visitId
export const getVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await Visit.findOne({ $or: [{ _id: id }, { visitId: id }] });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, visit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create / Schedule new field visit
export const createVisit = async (req, res) => {
  try {
    const {
      clientName,
      contactPerson,
      phone,
      email,
      address,
      scheduledDate,
      scheduledTime,
      purpose,
      priority,
      notes,
      assignedTo
    } = req.body;

    if (!clientName || !address || !purpose) {
      return res.status(400).json({ success: false, message: 'Client name, address, and purpose are required.' });
    }

    const newVisit = await Visit.create({
      clientName,
      contactPerson: contactPerson || 'Site Manager',
      phone: phone || '+91 98000 00000',
      email: email || 'client@example.com',
      address,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || '11:00 AM',
      purpose,
      priority: priority || 'Medium',
      notes: notes || '',
      assignedTo: assignedTo || 'Imran Khan',
      distanceKm: `${(Math.random() * 15 + 2).toFixed(1)} km`,
      latitude: 12.9716 + (Math.random() - 0.5) * 0.1,
      longitude: 77.5946 + (Math.random() - 0.5) * 0.1
    });

    // Increment client total visits if client exists
    await Client.findOneAndUpdate(
      { name: clientName },
      { $inc: { totalVisits: 1 }, $set: { lastVisitDate: newVisit.scheduledDate } }
    );

    res.status(201).json({ success: true, message: 'Visit scheduled successfully', visit: newVisit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check-in or Check-out of a field visit
export const checkInVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, time, notes, verifiedGps } = req.body;

    const visit = await Visit.findOne({ $or: [{ _id: id }, { visitId: id }] });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const checkTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'check-in') {
      visit.status = 'In-Progress';
      visit.checkInTime = checkTime;
      visit.verifiedGps = verifiedGps !== undefined ? verifiedGps : true;
    } else if (action === 'complete') {
      visit.status = 'Completed';
      visit.checkOutTime = checkTime;
      visit.verifiedGps = true;
    }

    if (notes) {
      visit.notes = notes;
    }

    await visit.save();

    res.json({
      success: true,
      message: action === 'check-in' ? 'Field check-in recorded' : 'Visit completed and logged',
      visit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update visit details
export const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Visit.findOneAndUpdate(
      { $or: [{ _id: id }, { visitId: id }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, message: 'Visit updated', visit: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete visit
export const deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Visit.findOneAndDelete({ $or: [{ _id: id }, { visitId: id }] });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, message: 'Visit removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
