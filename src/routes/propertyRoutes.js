import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createProperty,
  getAllProperties,

  getMyProperty,
  getPropertyById,
  updateProperty,
} from '../controllers/propertyController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add', protect, createProperty);
router.get('/my-property', protect, getMyProperty);
router.get('/', getAllProperties); // Public: all listings
router.get('/:id', getPropertyById);
router.put('/update/:id', protect, upload.array('images'), updateProperty);

export default router;
