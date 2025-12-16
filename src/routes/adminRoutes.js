import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { adminAuth } from '../middlewares/adminAuth.js';
import {
  //   getAllUsers,
  //   getReports
  //   deletePropertyByAdmin,
  getAllProperties,
  getDashboardStats,
  toggleActiveProperty,
  getAdminStats,
  approveProperty,
  rejectProperty,
  adminDeleteProperty,
} from '../controllers/adminController.js';

const router = express.Router();

// router.get("/reports", protect, adminOnly, getReports);
// router.delete("/properties/:id", protect, adminOnly, deletePropertyByAdmin);
// router.get("/users", protect, adminOnly, getAllUsers);
router.get('/properties', protect, adminAuth, getAllProperties);
router.get('/stats', protect, adminAuth, getDashboardStats);
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

export default router;
