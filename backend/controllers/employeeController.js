import Employee from '../models/Employee.js';
import { Department, Designation, Branch, GradeFuelRate } from '../models/MasterModels.js';

// GET: View all employees with search & filter
export const getEmployees = async (req, res) => {
  try {
    const { search, department, branch, status } = req.query;
    let filter = {};

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (branch && branch !== 'all') {
      filter.branch = branch;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { fullName: searchRegex },
        { employeeCode: searchRegex },
        { emailAddress: searchRegex },
        { mobileNo: searchRegex },
        { department: searchRegex },
        { designation: searchRegex },
        { branch: searchRegex },
        { securityRole: searchRegex }
      ];
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Single employee
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Create employee
export const createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      gender,
      dateOfBirth,
      joiningDate,
      mobileNo,
      emailAddress,
      department,
      designation,
      branch,
      employeeGrade,
      securityRole,
      status,
      accountPassword,
      employeeCode
    } = req.body;

    if (!fullName || !mobileNo || !emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Mobile No, and Email Address are required.'
      });
    }

    // Determine employeeCode safely to prevent duplicate key collisions
    let finalCode = (employeeCode || '').trim();
    if (!finalCode) {
      const allEmps = await Employee.find({}, { employeeCode: 1 });
      let maxNum = 1000;
      for (const emp of allEmps) {
        if (emp.employeeCode) {
          const match = String(emp.employeeCode).match(/EMP-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }
      finalCode = `EMP-${maxNum + 1}`;
    }

    const employee = await Employee.create({
      employeeCode: finalCode,
      fullName: fullName.trim(),
      gender: gender || 'Male',
      dateOfBirth: dateOfBirth || '1992-01-01',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      mobileNo: mobileNo.trim(),
      emailAddress: emailAddress.trim().toLowerCase(),
      department: department || 'Sales',
      designation: designation || 'Sales Executive',
      branch: branch || 'Mumbai HQ',
      employeeGrade: employeeGrade || 'Grade B',
      securityRole: securityRole || 'Sales Executive (SALES_EXEC)',
      status: status || 'Active',
      accountPassword: accountPassword || 'Employee@123'
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('[Create Employee Error]:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `An employee with this ${field === 'emailAddress' ? 'Email Address' : field === 'employeeCode' ? 'Employee Code' : field} already exists.`
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT: Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Employee.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updated
    });
  } catch (error) {
    console.error('[Update Employee Error]:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `An employee with this ${field === 'emailAddress' ? 'Email Address' : field === 'employeeCode' ? 'Employee Code' : field} already exists.`
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE: Remove employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Helper to fetch active master options for Employee dropdowns
export const getEmployeeDropdownOptions = async (req, res) => {
  try {
    // 1. Departments from master
    const deptDocs = await Department.find({ status: 'Active' }).sort({ departmentName: 1 });
    const departments = deptDocs.map(d => d.departmentName);

    // 2. Designations from master
    const desigDocs = await Designation.find({ status: 'Active' }).sort({ designationTitle: 1 });
    const designations = desigDocs.map(d => d.designationTitle);

    // 3. Branches from master
    const branchDocs = await Branch.find({ status: 'Active' }).sort({ branchName: 1 });
    const branches = branchDocs.map(b => b.branchName);

    // 4. Grades from master
    const gradeDocs = await GradeFuelRate.find({ status: 'Active' }).sort({ gradeName: 1 });
    const grades = gradeDocs.map(g => g.gradeName);

    res.json({
      success: true,
      options: {
        departments: departments.length > 0 ? departments : ['Sales', 'Service & Support', 'Operations', 'Finance & Billing'],
        designations: designations.length > 0 ? designations : ['Sales Executive', 'Service Engineer', 'Territory Manager', 'Branch Manager'],
        branches: branches.length > 0 ? branches : ['Mumbai HQ', 'Delhi North', 'Bengaluru Tech Hub', 'Pune Operations'],
        grades: grades.length > 0 ? grades : ['Grade A', 'Grade B', 'Grade C', 'Executive Grade'],
        securityRoles: [
          'Service Engineer (SERVICE_ENG)',
          'Sales Executive (SALES_EXEC)',
          'Branch Manager (BRANCH_MGR)',
          'Administrator (ADMIN)'
        ],
        genders: ['Male', 'Female', 'Other'],
        statuses: ['Active', 'Inactive', 'On Leave']
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
