import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  createRevision,
  updateQuotationStatus,
  deleteQuotation,
  sendQuotationEmailHandler,
  getSmtpStatus,
  configureSmtp
} from '../controllers/quotationController.js';

const router = express.Router();

// SMTP Config & Status Routes (must be before /:id)
router.get('/smtp/status', getSmtpStatus);
router.post('/smtp/configure', configureSmtp);

// Routes
router.get('/', getQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);
router.post('/:id/revision', createRevision);
router.post('/:id/revisions', createRevision);
router.patch('/:id/status', updateQuotationStatus);
router.post('/:id/send-email', sendQuotationEmailHandler);

export default router;
