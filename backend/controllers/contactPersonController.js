import ContactPerson from '../models/ContactPerson.js';
import { Designation } from '../models/MasterModels.js';

// GET: View all contact persons with search & filter
export const getContactPersons = async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { customerOrganizationName: searchRegex },
        { designation: searchRegex },
        { mobileNumber: searchRegex },
        { email: searchRegex }
      ];
    }

    const contactPersons = await ContactPerson.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: contactPersons.length, contactPersons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Single contact person
export const getContactPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const person = await ContactPerson.findById(id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Contact Person not found' });
    }
    res.json({ success: true, contactPerson: person });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create contact person
export const createContactPerson = async (req, res) => {
  try {
    const { name, customerOrganizationName, designation, mobileNumber, email, status } = req.body;

    if (!name || !designation || !mobileNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contact Person Name, Designation/Role, and Mobile Number are required.' 
      });
    }

    const person = await ContactPerson.create({
      name,
      customerOrganizationName: customerOrganizationName || '',
      designation,
      mobileNumber,
      email: email || '',
      status: status || 'Active'
    });

    res.status(201).json({ success: true, message: 'Contact Person created successfully', contactPerson: person });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update contact person
export const updateContactPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ContactPerson.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Contact Person not found' });
    }

    res.json({ success: true, message: 'Contact Person updated successfully', contactPerson: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove contact person
export const deleteContactPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactPerson.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Contact Person not found' });
    }

    res.json({ success: true, message: 'Contact Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Helper to fetch active designations strictly from Designation master
export const getDesignationsFromMaster = async (req, res) => {
  try {
    const desigDocs = await Designation.find({ status: 'Active' }).sort({ designationTitle: 1 });
    const designations = desigDocs.map(d => d.designationTitle).filter(Boolean);
    res.json({ success: true, designations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

