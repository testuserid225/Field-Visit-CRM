import express from 'express';
import {
  getDailyVisitExpenses,
  getApprovalInbox,
  getDailyVisitExpenseById,
  createDailyVisitExpense,
  updateDailyVisitExpense,
  updateDailyVisitExpenseStatus,
  deleteDailyVisitExpense
} from '../controllers/dailyVisitExpenseController.js';
import { requireBranchManagerOrAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getDailyVisitExpenses);
router.get('/inbox', requireBranchManagerOrAdmin, getApprovalInbox);
router.post('/', createDailyVisitExpense);
router.get('/:id', getDailyVisitExpenseById);
router.put('/:id', updateDailyVisitExpense);
router.patch('/:id/status', requireBranchManagerOrAdmin, updateDailyVisitExpenseStatus);
router.delete('/:id', deleteDailyVisitExpense);

export default router;
