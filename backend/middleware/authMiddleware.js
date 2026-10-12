import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

// Protect middleware: Verifies JWT token and binds authenticated user details
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Valid authorization token is required.'
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'field_visit_crm_super_secret_jwt_token_key_2026'
      );

      // 1. Try finding in Employee master
      let employee = await Employee.findById(decoded.id).select('-accountPassword');
      if (employee) {
        if (employee.status === 'Inactive') {
          return res.status(403).json({
            success: false,
            message: 'Your employee account is currently inactive. Contact system administrator.'
          });
        }

        req.employee = employee;
        req.user = employee;
        req.tokenUser = decoded;
        return next();
      }

      // 2. Fallback to User table
      let user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.employee = user;
        req.tokenUser = decoded;
        return next();
      }

      // 3. Fallback: if token is valid and contains user details, attach claims
      if (decoded.id && (decoded.email || decoded.fullName)) {
        req.user = decoded;
        req.employee = decoded;
        req.tokenUser = decoded;
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'Employee account not found for this authorization token.'
      });
    } catch (error) {
      console.warn('[JWT Auth Middleware Error]:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid authorization token. Please log in again.'
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied. No authorization token provided. Bearer token required.'
  });
};

// Guard: Branch Manager or System Administrator only
export const requireBranchManagerOrAdmin = (req, res, next) => {
  const user = req.employee || req.user || req.tokenUser;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }

  const dept = (user.department || '').trim().toLowerCase();
  const desig = (user.designation || '').trim().toLowerCase();
  const role = (user.securityRole || user.role || '').trim().toLowerCase();

  const isBranchMgr = desig.includes('branch manager') || desig.includes('branch mgr') || role.includes('branch_mgr') || role.includes('branch manager');
  const isSysAdmin = desig.includes('system administrator') || desig.includes('administrator') || role.includes('admin') || dept === 'management';

  if (!isBranchMgr && !isSysAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This action requires Branch Manager or System Administrator privileges.'
    });
  }

  next();
};

// Guard: System Administrator only
export const requireAdmin = (req, res, next) => {
  const user = req.employee || req.user || req.tokenUser;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }

  const desig = (user.designation || '').trim().toLowerCase();
  const role = (user.securityRole || user.role || '').trim().toLowerCase();

  const isSysAdmin = desig.includes('system administrator') || desig.includes('administrator') || role.includes('admin');
  if (!isSysAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }

  next();
};
