import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  getFavoriteStatus,
} from '../controllers/favoriteController.js';

const router = express.Router();

// All favorite routes require authentication
router.post('/:propertyId', protect, addFavorite);
router.delete('/:propertyId', protect, removeFavorite);
// Check if property is in favorites
router.get('/:propertyId/status', protect, getFavoriteStatus);
router.get('/', protect, getFavorites);

export default router;
