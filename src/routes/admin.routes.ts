import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { AdminAuthController } from '../controllers/admin-auth.controller';
import { AdminBookingsController } from '../controllers/admin-bookings.controller';
import { AdminMastersController } from '../controllers/admin-masters.controller';
import { AdminServicesController } from '../controllers/admin-services.controller';
import { AdminStatsController } from '../controllers/admin-stats.controller';

const router = Router();

// Auth routes (public)
router.post('/auth/login', AdminAuthController.login);
router.post('/auth/logout', AdminAuthController.logout);
router.get('/auth/check', AdminAuthController.checkAuth);

// Protected routes (require authentication)

// Stats
router.get('/stats', requireAuth, AdminStatsController.getStats);

// Bookings
router.get('/bookings', requireAuth, AdminBookingsController.getAll);
router.get('/bookings/calendar/events', requireAuth, AdminBookingsController.getCalendarEvents);
router.get('/bookings/:id', requireAuth, AdminBookingsController.getById);
router.put('/bookings/:id', requireAuth, AdminBookingsController.update);
router.delete('/bookings/:id', requireAuth, AdminBookingsController.delete);

// Masters
router.get('/masters', requireAuth, AdminMastersController.getAll);
router.get('/masters/:id', requireAuth, AdminMastersController.getById);
router.post('/masters', requireAuth, AdminMastersController.create);
router.put('/masters/:id', requireAuth, AdminMastersController.update);
router.delete('/masters/:id', requireAuth, AdminMastersController.delete);

// Services
router.get('/services', requireAuth, AdminServicesController.getAll);
router.get('/services/:id', requireAuth, AdminServicesController.getById);
router.post('/services', requireAuth, AdminServicesController.create);
router.put('/services/:id', requireAuth, AdminServicesController.update);
router.delete('/services/:id', requireAuth, AdminServicesController.delete);

export default router;
