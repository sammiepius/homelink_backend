import express from 'express';
import { authorizeRoles, checkOwnership, landlordOnly, protect } from '../middlewares/authMiddleware.js';
import {
  createProperty,
  deleteProperty,
  deletePropertyImage,
  // getAllProperties,
  getMarketplaceProperties,
  getMyProperty,
  getPropertyById,
  updateProperty,
} from '../controllers/propertyController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add', protect,authorizeRoles("LANDLORD"), createProperty);
router.get('/my-property', protect, authorizeRoles("LANDLORD"), getMyProperty);
// router.get('/', getAllProperties); // Public: all listings
router.get('/', getMarketplaceProperties); // Public: all listings
router.get('/:id', getPropertyById);
router.put('/update/:id', protect,authorizeRoles("LANDLORD"),checkOwnership, upload.array('images'), updateProperty);
router.delete('/:id/image', protect, authorizeRoles("LANDLORD"), checkOwnership, deletePropertyImage);
router.delete('/:id', protect, authorizeRoles("LANDLORD"), checkOwnership, deleteProperty);

export default router;
