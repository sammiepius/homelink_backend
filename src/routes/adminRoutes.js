import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { adminAuth } from '../middlewares/adminAuth.js';
import {
  //   getAllUsers,
  getAllProperties,
  //   deletePropertyByAdmin,
  getDashboardStats,
  //   getReports
} from '../controllers/adminController.js';

const router = express.Router();

// router.get("/users", protect, adminOnly, getAllUsers);
router.get('/properties', protect, adminAuth, getAllProperties);

// router.delete("/properties/:id", protect, adminOnly, deletePropertyByAdmin);
router.get('/stats', protect, adminAuth, getDashboardStats);
// router.get("/reports", protect, adminOnly, getReports);

export default router;
