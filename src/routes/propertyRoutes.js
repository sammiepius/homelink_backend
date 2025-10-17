import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
} from '../controllers/propertyController.js';

const router = express.Router();

router.post('/', protect, createProperty);
router.get('/', getAllProperties); // Public: all listings
router.get('/:id', getPropertyById);

export default router;
