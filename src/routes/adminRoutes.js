import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { adminAuth } from '../middlewares/adminAuth.js';
import {
  //   getAllUsers,
  //   getReports
  getAllProperties,
  toggleActiveProperty,
  getAdminStats,
  approveProperty,
  rejectProperty,
  adminDeleteProperty,
  getDashboardCharts,
  // getAuditLogs,
  getRecentActivities,
  getAuditLogsss,
  getRecentActivity,
} from '../controllers/adminController.js';

const router = express.Router();

// router.get("/reports", protect, adminOnly, getReports);
// router.delete("/properties/:id", protect, adminOnly, deletePropertyByAdmin);
// router.get("/users", protect, adminOnly, getAllUsers);
router.get('/properties', protect, adminAuth, getAllProperties);
router.get('/dashboard/charts', protect, adminAuth, getDashboardCharts);
router.get('/adminstats', protect, adminAuth, getAdminStats);
router.patch('/property/:id/approve', protect, adminAuth, approveProperty);
router.patch('/property/:id/reject', rejectProperty);
router.delete('/property/:id/delete', protect, adminAuth, adminDeleteProperty);
router.patch(
  '/property/:id/toggle-active',
  protect,
  adminAuth,
  toggleActiveProperty
);
// router.get('/audit-logs', protect, adminAuth, getAuditLogs);
router.get('/activities/recent', protect, adminAuth, getRecentActivities);
router.get('/audit-log', protect, adminAuth, getAuditLogsss);

router.get('/recent', protect, getRecentActivity);

export default router;
