import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { body } from 'express-validator';
import { isAuthenticated, hasRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { showSetup, setupRestaurant } from '../controllers/restaurant.controller.js';
import {
  showMenuManager,
  showNewMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
} from '../controllers/restaurant.controller.js';

const router = express.Router();

router.get('/setup', isAuthenticated, hasRole('RESTAURANT'), showSetup);

router.post(
  '/setup',
  isAuthenticated,
  hasRole('RESTAURANT'),
  [
    body('name').trim().notEmpty().withMessage('Restaurant name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('cuisine').trim().notEmpty().withMessage('Cuisine is required')
  ],
  validate,
  setupRestaurant
);

// Configure uploads (disk storage under public/uploads/menu)
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'menu');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const fname = `${Date.now()}_${base}${ext}`;
    cb(null, fname);
  }
});
const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Menu management
router.get('/menu', isAuthenticated, hasRole('RESTAURANT'), showMenuManager);
router.get('/menu/new', isAuthenticated, hasRole('RESTAURANT'), showNewMenuItem);
router.post(
  '/menu',
  isAuthenticated,
  hasRole('RESTAURANT'),
  upload.single('imageFile'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  validate,
  createMenuItem
);

// Update menu item
router.post(
  '/menu/:id/update',
  isAuthenticated,
  hasRole('RESTAURANT'),
  upload.single('imageFile'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  validate,
  updateMenuItem
);

// Delete menu item
router.post('/menu/:id/delete', isAuthenticated, hasRole('RESTAURANT'), deleteMenuItem);

// Toggle availability (AJAX endpoint)
router.post('/menu/:id/toggle', isAuthenticated, hasRole('RESTAURANT'), toggleAvailability);

export default router;
