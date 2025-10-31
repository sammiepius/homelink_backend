import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createProperty,
  getAllProperties,
  getMyListing,
  getPropertyById,
  updateProperty,
} from '../controllers/propertyController.js';

const router = express.Router();

router.post('/add', protect, createProperty);
router.get('/my-property', protect, getMyListing);
router.get('/', getAllProperties); // Public: all listings
router.get('/:id', getPropertyById);
router.put('/edit/:id', protect, updateProperty);

export default router;
