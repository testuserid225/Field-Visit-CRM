import express from 'express';
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  updateOpportunityStage,
  addQuotationRevision,
  deleteOpportunity
} from '../controllers/opportunityController.js';

const router = express.Router();

router.route('/')
  .get(getOpportunities)
  .post(createOpportunity);

router.route('/:id')
  .get(getOpportunityById)
  .put(updateOpportunity)
  .delete(deleteOpportunity);

router.route('/:id/stage')
  .patch(updateOpportunityStage);

router.route('/:id/quotations')
  .post(addQuotationRevision);

export default router;
