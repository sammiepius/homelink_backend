import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createProperty,
  getAllProperties,
  getMyListing,
  getPropertyById,
} from '../controllers/propertyController.js';

const router = express.Router();

router.post('/add', protect, createProperty);
router.get('/my-property', protect, getMyListing);
router.get('/', getAllProperties); // Public: all listings
router.get('/:id', getPropertyById);

export default router;
