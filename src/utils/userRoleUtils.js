/**
 * User Role and Department Utility
 * Determines menu access and approval permissions based on Employee table definitions:
 * - Department (e.g. 'Management', 'Admin', 'Sales', 'Service')
 * - Designation (e.g. 'Branch Manager', 'System Administrator', 'Sales Executive', 'Service Engineer')
 * - Security Role (e.g. 'Administrator (ADMIN)', 'Branch Manager (BRANCH_MGR)')
 */

export const isBranchManager = (user) => {
  if (!user) return false;
  const desig = (user.designation || '').trim().toLowerCase();
  const role = (user.securityRole || user.role || '').trim().toLowerCase();
  return (
    desig.includes('branch manager') ||
    desig.includes('branch mgr') ||
    role.includes('branch_mgr') ||
    role.includes('branch manager')
  );
};

export const isSystemAdmin = (user) => {
  if (!user) return false;
  const desig = (user.designation || '').trim().toLowerCase();
  const dept = (user.department || '').trim().toLowerCase();
  const role = (user.securityRole || user.role || '').trim().toLowerCase();

  return (
    desig.includes('system administrator') ||
    desig === 'administrator' ||
    role.includes('admin') ||
    (dept === 'management' && !isBranchManager(user))
  );
};

export const isBranchManagerOrAdmin = (user) => {
  if (!user) return false;
  const dept = (user.department || '').trim().toLowerCase();
  const desig = (user.designation || '').trim().toLowerCase();
  const role = (user.securityRole || user.role || '').trim().toLowerCase();

  // As requested: "bases on login user department which is define in Employee table"
  const isMgmtDepartment = dept === 'management' || dept === 'admin' || dept === 'administration';

  const isMgr = isBranchManager(user);
  const isAdmin = isSystemAdmin(user);

  return isMgmtDepartment || isMgr || isAdmin;
};

export const getUserBranch = (user) => {
  return user?.branch || user?.territory || '';
};
