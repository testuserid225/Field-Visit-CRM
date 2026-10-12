import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeDropdownOptions
} from '../controllers/employeeController.js';

import { requireBranchManagerOrAdmin, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/meta/options', getEmployeeDropdownOptions);
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', requireBranchManagerOrAdmin, createEmployee);
router.put('/:id', requireBranchManagerOrAdmin, updateEmployee);
router.delete('/:id', requireAdmin, deleteEmployee);

export default router;
