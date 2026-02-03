import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateCategory } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticateToken, getCategories);
router.post('/', authenticateToken, validateCategory, createCategory);
router.put('/:id', authenticateToken, validateCategory, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);

export default router;

