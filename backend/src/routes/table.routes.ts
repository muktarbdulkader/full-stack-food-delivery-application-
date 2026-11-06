import { Router } from 'express';
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  regenerateQRCode,
} from '../controllers/table.controller';
import { protect, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getAllTables);
router.get('/:id', getTableById);
router.post('/', adminOnly, createTable);
router.put('/:id', adminOnly, updateTable);
router.delete('/:id', adminOnly, deleteTable);
router.post('/:id/regenerate-qr', adminOnly, regenerateQRCode);

export default router;

