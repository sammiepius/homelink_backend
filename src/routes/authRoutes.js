import express from 'express';
import {
  signup,
  login,
  updateProfile,
  getProfile,
  changePassword,
} from '../controllers/authController.js';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/signup', signup);
router.post('/login', login);
router.put('/update', protect, upload.single('profilePhoto'), updateProfile);
router.get('/me', protect, getProfile);
router.put('/change-password', protect, changePassword);

export default router;
