import { Router } from 'express';
import authRoutes from './auth.routes';
import foodRoutes from './food.routes';
import orderRoutes from './order.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';
import tableRoutes from './table.routes';
import qrRoutes from './qr.routes';
import organizationRoutes from './organization.routes';
import waiterRoutes from './waiter.routes';
import kdsRoutes from './kds.routes';
import posRoutes from './pos.routes';
import inventoryRoutes from './inventory.routes';
import recipeRoutes from './recipe.routes';
import procurementRoutes from './procurement.routes';
import financeRoutes from './finance.routes';
import hrRoutes from './hr.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/foods', foodRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);

// ERP Modules
router.use('/tables', tableRoutes);
router.use('/qr', qrRoutes);
router.use('/organization', organizationRoutes);
router.use('/waiters', waiterRoutes);
router.use('/kds', kdsRoutes);
router.use('/pos', posRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/procurement', procurementRoutes);
router.use('/finance', financeRoutes);
router.use('/hr', hrRoutes);

export default router;
