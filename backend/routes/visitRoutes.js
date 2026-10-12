import express from 'express';
import {
  getVisits,
  getVisitById,
  createVisit,
  checkInVisit,
  updateVisit,
  deleteVisit
} from '../controllers/visitController.js';

const router = express.Router();

router.get('/', getVisits);
router.get('/:id', getVisitById);
router.post('/', createVisit);
router.put('/:id/checkin', checkInVisit);
router.put('/:id', updateVisit);
router.delete('/:id', deleteVisit);

export default router;
