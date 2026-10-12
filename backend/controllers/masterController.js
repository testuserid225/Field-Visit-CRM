import { MASTER_MODELS, Principal, Category, Branch } from '../models/MasterModels.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ContactPerson from '../models/ContactPerson.js';

const getModel = (masterType) => {
  const model = MASTER_MODELS[masterType];
  return model || null;
};

// GET: View all items for a master
export const getMasterItems = async (req, res) => {
  try {
    const { masterType } = req.params;
    const { search, status } = req.query;

    const Model = getModel(masterType);
    if (!Model) {
      return res.status(404).json({ success: false, message: `Master type '${masterType}' not found` });
    }

    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      // Search across common fields
      filter.$or = [
        { code: searchRegex },
        { gradeCode: searchRegex },
        { industryCode: searchRegex },
        { branchName: searchRegex },
        { departmentName: searchRegex },
        { designationTitle: searchRegex },
        { expenseHeadName: searchRegex },
        { gradeName: searchRegex },
        { industrySegmentName: searchRegex },
        { principalName: searchRegex },
        { category: searchRegex },
        { productName: searchRegex },
        { activityName: searchRegex }
      ];
    }

    const items = await Model.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create item
export const createMasterItem = async (req, res) => {
  try {
    const { masterType } = req.params;
    const Model = getModel(masterType);
    if (!Model) {
      return res.status(404).json({ success: false, message: `Master type '${masterType}' not found` });
    }

    const item = await Model.create(req.body);
    res.status(201).json({ success: true, message: 'Item created successfully', item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A record with this Code / Name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update item
export const updateMasterItem = async (req, res) => {
  try {
    const { masterType, id } = req.params;
    const Model = getModel(masterType);
    if (!Model) {
      return res.status(404).json({ success: false, message: `Master type '${masterType}' not found` });
    }

    const item = await Model.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.json({ success: true, message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove item
export const deleteMasterItem = async (req, res) => {
  try {
    const { masterType, id } = req.params;
    const Model = getModel(masterType);
    if (!Model) {
      return res.status(404).json({ success: false, message: `Master type '${masterType}' not found` });
    }

    const item = await Model.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Dropdown options helper for Principals, Categories, Managers, Contact Persons
export const getMasterDropdowns = async (req, res) => {
  try {
    const principals = await Principal.find({ status: 'Active' }).select('principalName code');
    const categories = await Category.find({ status: 'Active' }).select('category');
    
    // Dynamically fetch all actual Employees for Mapped Branch Manager from Employee master
    const employees = await Employee.find({}).sort({ fullName: 1 });
    let managers = [];
    if (employees && employees.length > 0) {
      managers = employees.map(emp => emp.designation ? `${emp.fullName} (${emp.designation})` : emp.fullName);
    } else {
      managers = [
        'Imran Khan (Senior Manager)',
        'Sarah Jenkins (Territory Lead)',
        'Rajesh Verma (Regional Head)',
        'Anand Kulkarni (Branch Lead)'
      ];
    }

    // Dynamically fetch contact persons for Principal / OEM brand contact person from Contact Person master
    const contactPersons = await ContactPerson.find({ status: 'Active' }).sort({ name: 1 });
    const contactList = contactPersons.map(cp => ({
      name: cp.name,
      email: cp.email || '',
      phone: cp.mobileNumber || ''
    }));

    res.json({
      success: true,
      principals: principals.map(p => p.principalName),
      categories: categories.map(c => c.category),
      managers,
      contactPersons: contactList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
