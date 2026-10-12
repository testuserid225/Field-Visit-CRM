import express from 'express';
import {
  getContactPersons,
  getContactPersonById,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
  getDesignationsFromMaster
} from '../controllers/contactPersonController.js';

const router = express.Router();

router.get('/meta/designations', getDesignationsFromMaster);
router.get('/', getContactPersons);
router.get('/:id', getContactPersonById);
router.post('/', createContactPerson);
router.put('/:id', updateContactPerson);
router.delete('/:id', deleteContactPerson);

export default router;
