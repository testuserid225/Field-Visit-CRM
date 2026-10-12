import express from 'express';
import {
  getMasterItems,
  createMasterItem,
  updateMasterItem,
  deleteMasterItem,
  getMasterDropdowns
} from '../controllers/masterController.js';

const router = express.Router();

// Helper for dynamic master dropdowns
router.get('/meta/dropdowns', getMasterDropdowns);

// Master CRUD
router.get('/:masterType', getMasterItems);
router.post('/:masterType', createMasterItem);
router.put('/:masterType/:id', updateMasterItem);
router.delete('/:masterType/:id', deleteMasterItem);

export default router;
