import { Router } from 'express';
import {
  initChartOfAccounts,
  getAccounts,
  createAccount,
  createJournalEntry,
  getJournalEntries,
  getProfitAndLoss,
} from '../controllers/finance.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'accountant'));

router.post('/accounts/init', initChartOfAccounts);
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);

router.post('/journal', createJournalEntry);
router.get('/journal', getJournalEntries);

router.get('/profit-loss', getProfitAndLoss);

export default router;

