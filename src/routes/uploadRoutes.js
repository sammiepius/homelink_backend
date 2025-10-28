import express from 'express';
import multer from 'multer';
import { uploadImages } from '../controllers/uploadController.js';

const router = express.Router();

// Use multer for temporary file handling
const upload = multer({ dest: 'uploads/' });

// Upload route — multiple images allowed
router.post('/', upload.array('images', 4), uploadImages);

export default router;
